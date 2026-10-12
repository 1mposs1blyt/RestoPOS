//! Мост между кассой и фискальным регистратором.
//!
//! Устройство одно на терминал и состояние у него своё (открыта ли смена,
//! какой номер документа последний), поэтому живёт в состоянии приложения
//! под мьютексом, а не создаётся на каждый вызов. Две параллельные
//! регистрации в одну ККТ — это два чека вперемешку.
//!
//! Реализация подменяется **в одном месте** — в `FiscalState::new`. Своя
//! `tauri::Builder` в `main.rs` это правило уже нарушала: живая ККТ была
//! заведена там, эмулятор — здесь, и какая из двух работает, зависело
//! от того, какой вход выполняется. Порядок операций и восстановление
//! после обрыва от модели ККТ не зависят и живут
//! в `fiscal::register_with_recovery`.

use std::sync::{Arc, Mutex};

use super::atol::AtolDevice;
use super::emulator::Emulator;
use super::{DeviceStatus, FiscalDevice, ReceiptRequest, RegistrationOutcome, ZReport};

/// Живая ККТ подключена по TCP/IP, а не по COM: монопольного захвата порта
/// у неё нет, и утилита АТОЛ открывает кассу параллельно с ней.
const KKT_ADDRESS: (&str, u16) = ("192.168.1.223", 5555);

/// Чем сейчас работает касса. Нужен, чтобы перенастройка была идемпотентной.
#[derive(PartialEq, Eq, Clone)]
struct Config {
    kind: String,
    ip: String,
    port: u16,
}

pub struct FiscalState {
    /// `Arc`, потому что работа с железом уходит в отдельный поток.
    ///
    /// Причина жёсткая: **синхронная команда Tauri выполняется в главном
    /// потоке**, а любая операция с ККТ — это запуск PowerShell, загрузка
    /// ДТО и обращение по сети, то есть секунды. Пока они идут, окно кассы
    /// не перерисовывается и не отвечает на касания: приложение выглядит
    /// зависшим. Особенно заметно стало, когда экран кассы начал спрашивать
    /// состояние смены сам при открытии.
    device: Arc<Mutex<Box<dyn FiscalDevice>>>,
    /// Отдельным мьютексом: сравнить настройки надо, не занимая ККТ,
    /// иначе перенастройка ждала бы конца печати чужого чека.
    config: Mutex<Config>,
}

/// Как собрать устройство. Одно место на весь крейт.
///
/// Вынесено из `new`, чтобы перенастройка с карточки оборудования
/// (`fiscal_configure`) не завела второй способ сборки: разъехавшиеся
/// конструкторы — ровно та поломка, из-за которой живая ККТ оказывалась
/// заведена в `main.rs`, а эмулятор здесь.
fn build_device(kind: &str, ip: &str, port: u16) -> Box<dyn FiscalDevice> {
    match kind {
        "emulator" => Box::new(Emulator::new()),

        /*
         * Стенд: фискальную часть считает эмулятор, лента выходит из живой
         * ККТ. Нужен потому, что без ФН настоящая ККТ фискальные команды
         * не выполняет, а нефискальный документ печатает всегда.
         *
         * Только отладочная сборка, и не флагом, а `cfg`: в релизе ветки
         * нет вместе с самим модулем. Касса, молча пробившая чек в эмулятор
         * и напечатавшая правдоподобную ленту, — худший исход из возможных.
         */
        #[cfg(debug_assertions)]
        "bench" => Box::new(super::bench::BenchDevice::new(ip, port)),

        _ => Box::new(AtolDevice::new(ip, port)),
    }
}

impl FiscalState {
    /// Здесь и подменяется реализация.
    ///
    /// По умолчанию — драйвер АТОЛ: терминал стоит рядом с железом, и
    /// «касса молча пробила чек в эмулятор» — худший из возможных исходов.
    /// Без ККТ под рукой (машина разработчика, браузерная отладка) эмулятор
    /// включается переменной окружения `RESTOPOS_KKT=emulator`.
    pub fn new() -> Self {
        Self::with_config(Config {
            kind: std::env::var("RESTOPOS_KKT").unwrap_or_default(),
            ip: KKT_ADDRESS.0.to_string(),
            port: KKT_ADDRESS.1,
        })
    }

    /// Состояние под заданные настройки, без чтения окружения.
    ///
    /// Нужно тестам: род устройства они задают прямо, а `RESTOPOS_KKT`
    /// на ходу не поправить — тесты идут потоками одного процесса,
    /// и окружение у них общее.
    fn with_config(config: Config) -> Self {
        Self {
            device: Arc::new(Mutex::new(build_device(
                &config.kind,
                &config.ip,
                config.port,
            ))),
            config: Mutex::new(config),
        }
    }
}

impl Default for FiscalState {
    fn default() -> Self {
        Self::new()
    }
}

/// Отравленный мьютекс означает панику в предыдущей операции с ККТ.
///
/// Возвращаем текстом, а не `unwrap`: касса не должна падать целиком из-за
/// фискального регистратора — гостя ещё нужно рассчитать, пусть и наличными
/// с последующим внесением.
fn lock(state: &FiscalState) -> Result<std::sync::MutexGuard<'_, Box<dyn FiscalDevice>>, String> {
    state
        .device
        .lock()
        .map_err(|_| "Драйвер ККТ в непригодном состоянии, нужен перезапуск кассы".to_string())
}

/// Выполнить операцию с ККТ **вне главного потока**.
///
/// Обёртка обязательна для всего, что трогает железо. Синхронная команда
/// Tauri исполняется в главном потоке, а разговор с ККТ — это процесс
/// PowerShell, загрузка ДТО и сетевой обмен: секунды, в течение которых
/// окно не отвечает. Касса при этом выглядит зависшей, и кассир жмёт кнопку
/// ещё раз.
///
/// Мьютекс берётся уже внутри рабочего потока — очередь к устройству
/// сохраняется (две марки вперемешку по-прежнему невозможны), но ждёт
/// её не интерфейс.
async fn with_device<T, F>(state: &tauri::State<'_, FiscalState>, work: F) -> Result<T, String>
where
    F: FnOnce(&mut dyn FiscalDevice) -> Result<T, String> + Send + 'static,
    T: Send + 'static,
{
    let device = Arc::clone(&state.device);

    tauri::async_runtime::spawn_blocking(move || {
        let mut guard = device.lock().map_err(|_| {
            "Драйвер ККТ в непригодном состоянии, нужен перезапуск кассы".to_string()
        })?;
        work(guard.as_mut())
    })
    .await
    .map_err(|e| format!("Операция с ККТ прервана: {e}"))?
}

/// Перенастройка драйвера под карточку оборудования.
///
/// Без неё адрес в карточке ККМ был бы декоративным: драйвер брал бы его
/// из константы, а кассир, поменявший IP на экране оборудования, не увидел
/// бы никакого эффекта и пошёл бы искать причину в кабеле.
///
/// **Идемпотентна.** Фронт зовёт её на каждое изменение списка устройств,
/// а пересборка устройства обнуляет состояние (на стенде — вместе с открытой
/// сменой). Совпали настройки — ничего не делаем.
#[tauri::command]
pub fn fiscal_configure(
    state: tauri::State<'_, FiscalState>,
    kind: Option<String>,
    ip: String,
    port: u16,
) -> Result<(), String> {
    configure(&state, kind, ip, port)
}

/// Тело `fiscal_configure` без обвязки Tauri.
///
/// Вынесено, чтобы идемпотентность проверялась тестом, а не держалась одним
/// комментарием: `tauri::State` в тесте не собрать, а обнулённая перенастройкой
/// смена видна только на живом стенде — то есть уже посреди расчёта гостя.
fn configure(
    state: &FiscalState,
    kind: Option<String>,
    ip: String,
    port: u16,
) -> Result<(), String> {
    let mut current = state
        .config
        .lock()
        .map_err(|_| "Настройки ККТ в непригодном состоянии".to_string())?;

    /*
     * Род устройства менять с фронта нельзя: `emulator` и `bench` включаются
     * только переменной окружения при запуске. Иначе прод-сборку можно было бы
     * попросить «пробей чек в эмулятор» прямо из webview.
     */
    let wanted = Config {
        kind: kind.unwrap_or_else(|| current.kind.clone()),
        ip,
        port,
    };

    if wanted.kind != current.kind {
        return Err("Род устройства ККТ меняется только при запуске кассы".into());
    }
    if wanted == *current {
        return Ok(());
    }

    let mut device = lock(state)?;
    *device = build_device(&wanted.kind, &wanted.ip, wanted.port);
    *current = wanted;

    Ok(())
}

#[tauri::command]
pub async fn fiscal_status(state: tauri::State<'_, FiscalState>) -> Result<DeviceStatus, String> {
    with_device(&state, |device| device.status().map_err(|e| e.to_string())).await
}

#[tauri::command]
pub async fn fiscal_open_shift(
    state: tauri::State<'_, FiscalState>,
    cashier_name: String,
) -> Result<i64, String> {
    with_device(&state, move |device| {
        device.open_shift(&cashier_name).map_err(|e| e.to_string())
    })
    .await
}

#[tauri::command]
pub async fn fiscal_close_shift(
    state: tauri::State<'_, FiscalState>,
    cashier_name: String,
) -> Result<ZReport, String> {
    with_device(&state, move |device| {
        device.close_shift(&cashier_name).map_err(|e| e.to_string())
    })
    .await
}

#[tauri::command]
pub async fn fiscal_x_report(state: tauri::State<'_, FiscalState>) -> Result<ZReport, String> {
    with_device(&state, |device| device.x_report().map_err(|e| e.to_string())).await
}

/// Регистрация чека.
///
/// Возвращает **исход**, а не `Result`: «неизвестно» — это не ошибка вызова,
/// а третье состояние, и фронт обязан его различать. Свернув его в `Err`,
/// мы заставили бы кассу гадать между двойным чеком и потерянной выручкой.
#[tauri::command]
pub async fn fiscal_register(
    state: tauri::State<'_, FiscalState>,
    request: ReceiptRequest,
) -> Result<RegistrationOutcome, String> {
    with_device(&state, move |device| Ok(super::register_with_recovery(device, &request))).await
}

/// Сценарии отказов для проверки кассы без железа.
///
/// Только в отладочной сборке: в проде подсунуть кассе «потеряй следующий
/// ответ» не должно быть возможно ничем, включая инспектор.
#[cfg(debug_assertions)]
#[tauri::command]
pub fn fiscal_simulate(
    state: tauri::State<'_, FiscalState>,
    scenario: String,
) -> Result<(), String> {
    let mut device = lock(&state)?;

    /*
     * Если за трейтом стоит настоящая ККТ, сценариев отказа у неё нет и быть
     * не может — это отказ вызывающему, а не молчаливый no-op.
     */
    let emulator = device
        .as_emulator()
        .ok_or("Сценарии отказов доступны только на эмуляторе ККТ")?;

    match scenario.as_str() {
        "lost_reply_after" => emulator.fail_next_reply_after_registering(),
        "lost_reply_before" => emulator.fail_next_reply_before_registering(),
        "lost_reply_then_disconnect" => emulator.fail_next_reply_then_disconnect(),
        "reject" => emulator.reject_next("сценарий проверки"),
        "disconnect" => emulator.disconnect(),
        "connect" => emulator.connect(),
        // Ждать сутки, чтобы увидеть отказ по просроченной смене, никто
        // не станет — а ветка эта на кассе, простоявшей ночь, обязательная.
        "age_shift" => emulator.age_shift_hours(25),
        other => return Err(format!("Неизвестный сценарий: {other}")),
    }

    Ok(())
}

/// Нефискальная печать произвольных строк на ККТ АТОЛ по адресу.
///
/// Нужна кухне: на многих точках марки печатает та же ККТ, что и чеки,
/// отдельного принтера нет. ESC/POS в сокет (`printing::print_ticket`) туда
/// не годится — на порту 5555 стоит драйвер АТОЛ, а не сырой принтер.
///
/// **Адрес приходит параметром, а не берётся из `FiscalState`**: станций
/// несколько, и печатать они могут на разные устройства. Своё состояние
/// такой печати не нужно — нефискальный документ ничего не помнит.
///
/// До этой команды фронт собирал PowerShell-скрипт сам и звал его через
/// `@tauri-apps/plugin-shell`, которого в сборке нет, — отсюда «plugin shell
/// not found» на каждой марке. Хуже того, в скрипт подставлялись имя хоста
/// и текст чека **без экранирования**: блюдо с апострофом или `$` в названии
/// ломало скрипт, а то и выполняло чужую команду.
#[tauri::command]
pub async fn atol_print_lines(host: String, port: u16, lines: Vec<String>) -> Result<(), String> {
    AtolDevice::new(&host, port).print_lines(&lines)
}

/// Тестовая печать: проверка связи с ККТ, доступная до всякой фискализации.
#[tauri::command]
pub async fn fiscal_print_test(state: tauri::State<'_, FiscalState>) -> Result<(), String> {
    with_device(&state, |device| device.print_test_receipt()).await
}

/// Печать картинки на ленте ККТ.
///
/// `path` — путь к файлу на машине терминала (BMP или PNG): картинку читает
/// драйвер, и про раздачу фронта он ничего не знает. `scalePercent` — доля
/// от исходного размера, по умолчанию 100.
#[tauri::command]
pub async fn fiscal_print_image(
    state: tauri::State<'_, FiscalState>,
    path: String,
    scale_percent: Option<u32>,
) -> Result<(), String> {
    let mut device = lock(&state)?;
    device.print_image(&path, scale_percent.unwrap_or(100))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Стенд на эмуляторе: род устройства задаётся прямо, без `RESTOPOS_KKT`.
    fn стенд() -> FiscalState {
        FiscalState::with_config(Config {
            kind: "emulator".into(),
            ip: KKT_ADDRESS.0.to_string(),
            port: KKT_ADDRESS.1,
        })
    }

    fn состояние(state: &FiscalState) -> DeviceStatus {
        lock(state)
            .expect("мьютекс цел")
            .status()
            .expect("эмулятор отвечает всегда")
    }

    fn открыть_смену(state: &FiscalState) {
        lock(state)
            .expect("мьютекс цел")
            .open_shift("Мария Дёмина")
            .expect("эмулятор открывает смену");
    }

    #[test]
    fn повтор_с_теми_же_настройками_не_пересобирает_устройство() {
        // Фронт зовёт перенастройку на каждое изменение списка устройств —
        // в том числе когда в карточке ККМ поправили название или галку.
        let state = стенд();
        открыть_смену(&state);

        configure(&state, None, KKT_ADDRESS.0.into(), KKT_ADDRESS.1).expect("настройки те же");

        let status = состояние(&state);
        assert!(
            status.shift_open,
            "пересборка устройства обнулила бы открытую смену"
        );
        assert_eq!(status.shift_number, 1);
    }

    #[test]
    fn смена_адреса_пересобирает_устройство() {
        // Обратная сторона того же: поправленный IP обязан доехать
        // до драйвера, иначе адрес в карточке ККМ декоративный.
        let state = стенд();
        открыть_смену(&state);

        configure(&state, None, "192.168.1.55".into(), KKT_ADDRESS.1).expect("адрес меняется");
        assert!(
            !состояние(&state).shift_open,
            "новое устройство начинает с закрытой сменой"
        );

        // И новый адрес запомнен: повтор с ним уже ничего не пересобирает.
        открыть_смену(&state);
        configure(&state, None, "192.168.1.55".into(), KKT_ADDRESS.1).expect("настройки те же");
        assert!(состояние(&state).shift_open);
    }

    #[test]
    fn смена_порта_пересобирает_устройство() {
        let state = стенд();
        открыть_смену(&state);

        configure(&state, None, KKT_ADDRESS.0.into(), 5556).expect("порт меняется");
        assert!(!состояние(&state).shift_open);
    }

    #[test]
    fn род_устройства_с_фронта_не_меняется() {
        let state = стенд();
        открыть_смену(&state);

        let ответ = configure(
            &state,
            Some("atol".into()),
            KKT_ADDRESS.0.into(),
            KKT_ADDRESS.1,
        );

        assert!(ответ.is_err(), "род устройства задаётся только при запуске");
        assert!(
            состояние(&state).shift_open,
            "отказ не должен трогать устройство"
        );
    }
}
