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

use std::sync::Mutex;

use super::atol::AtolDevice;
use super::emulator::Emulator;
use super::{DeviceStatus, FiscalDevice, ReceiptRequest, RegistrationOutcome, ZReport};

/// Живая ККТ подключена по TCP/IP, а не по COM: монопольного захвата порта
/// у неё нет, и утилита АТОЛ открывает кассу параллельно с ней.
const KKT_ADDRESS: (&str, u16) = ("192.168.3.223", 5555);

pub struct FiscalState(pub Mutex<Box<dyn FiscalDevice>>);

impl FiscalState {
    /// Здесь и подменяется реализация.
    ///
    /// По умолчанию — драйвер АТОЛ: терминал стоит рядом с железом, и
    /// «касса молча пробила чек в эмулятор» — худший из возможных исходов.
    /// Без ККТ под рукой (машина разработчика, браузерная отладка) эмулятор
    /// включается переменной окружения `RESTOPOS_KKT=emulator`.
    pub fn new() -> Self {
        let device: Box<dyn FiscalDevice> = match std::env::var("RESTOPOS_KKT").as_deref() {
            Ok("emulator") => Box::new(Emulator::new()),
            _ => Box::new(AtolDevice::new(KKT_ADDRESS.0, KKT_ADDRESS.1)),
        };

        Self(Mutex::new(device))
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
        .0
        .lock()
        .map_err(|_| "Драйвер ККТ в непригодном состоянии, нужен перезапуск кассы".to_string())
}

#[tauri::command]
pub fn fiscal_status(state: tauri::State<'_, FiscalState>) -> Result<DeviceStatus, String> {
    let mut device = lock(&state)?;
    device.status().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fiscal_open_shift(
    state: tauri::State<'_, FiscalState>,
    cashier_name: String,
) -> Result<i64, String> {
    let mut device = lock(&state)?;
    device.open_shift(&cashier_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fiscal_close_shift(
    state: tauri::State<'_, FiscalState>,
    cashier_name: String,
) -> Result<ZReport, String> {
    let mut device = lock(&state)?;
    device.close_shift(&cashier_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fiscal_x_report(state: tauri::State<'_, FiscalState>) -> Result<ZReport, String> {
    let mut device = lock(&state)?;
    device.x_report().map_err(|e| e.to_string())
}

/// Регистрация чека.
///
/// Возвращает **исход**, а не `Result`: «неизвестно» — это не ошибка вызова,
/// а третье состояние, и фронт обязан его различать. Свернув его в `Err`,
/// мы заставили бы кассу гадать между двойным чеком и потерянной выручкой.
#[tauri::command]
pub fn fiscal_register(
    state: tauri::State<'_, FiscalState>,
    request: ReceiptRequest,
) -> Result<RegistrationOutcome, String> {
    let mut device = lock(&state)?;
    Ok(super::register_with_recovery(device.as_mut(), &request))
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

/// Тестовая печать: проверка связи с ККТ, доступная до всякой фискализации.
#[tauri::command]
pub fn fiscal_print_test(state: tauri::State<'_, FiscalState>) -> Result<(), String> {
    let mut device = lock(&state)?;
    device.print_test_receipt()
}

/// Печать картинки на ленте ККТ.
///
/// `path` — путь к файлу на машине терминала (BMP или PNG): картинку читает
/// драйвер, и про раздачу фронта он ничего не знает. `scalePercent` — доля
/// от исходного размера, по умолчанию 100.
#[tauri::command]
pub fn fiscal_print_image(
    state: tauri::State<'_, FiscalState>,
    path: String,
    scale_percent: Option<u32>,
) -> Result<(), String> {
    let mut device = lock(&state)?;
    device.print_image(&path, scale_percent.unwrap_or(100))
}
