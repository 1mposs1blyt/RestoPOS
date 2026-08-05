//! Мост между кассой и эквайринговым терминалом.
//!
//! Терминал один на кассу и во время операции занят целиком: гость держит
//! карту у одного устройства. Поэтому состояние приложения под мьютексом,
//! как и у ККТ, — две параллельные оплаты в один терминал невозможны
//! физически, и очередь должна быть явной.
//!
//! Протокол банка подключается **заменой одной строки** в `AcquiringState::new`.
//! Автомат состояний (одобрено / отказ / неизвестно → отмена) живёт
//! в `acquiring::pay_with_recovery` и от банка не зависит.

use std::sync::Mutex;

use super::emulator::Emulator;
use super::{PaymentOutcome, PaymentRequest, PaymentTerminal, TerminalStatus};

pub struct AcquiringState(Mutex<Box<dyn PaymentTerminal>>);

impl AcquiringState {
    /// Здесь и подменяется реализация, когда появится протокол банка.
    pub fn new() -> Self {
        Self(Mutex::new(Box::new(Emulator::new())))
    }
}

impl Default for AcquiringState {
    fn default() -> Self {
        Self::new()
    }
}

fn lock(
    state: &AcquiringState,
) -> Result<std::sync::MutexGuard<'_, Box<dyn PaymentTerminal>>, String> {
    state.0.lock().map_err(|_| {
        "Драйвер терминала в непригодном состоянии, нужен перезапуск кассы".to_string()
    })
}

#[tauri::command]
pub fn acquiring_status(
    state: tauri::State<'_, AcquiringState>,
) -> Result<TerminalStatus, String> {
    let mut terminal = lock(&state)?;
    terminal.status().map_err(|e| e.to_string())
}

/// Оплата картой.
///
/// Возвращает исход, а не `Result`: «требует человека» — это не ошибка вызова,
/// а третье состояние, и касса обязана его показать, а не проглотить.
#[tauri::command]
pub fn acquiring_pay(
    state: tauri::State<'_, AcquiringState>,
    request: PaymentRequest,
) -> Result<PaymentOutcome, String> {
    let mut terminal = lock(&state)?;
    Ok(super::pay_with_recovery(terminal.as_mut(), &request))
}

/// Отмена операции по нашему `client_id`.
///
/// Нужна кассе, а не только внутреннему восстановлению: чек часто делят
/// на две карты, и если вторая не прошла, первую обязаны вернуть. Иначе
/// с гостя списаны деньги за еду, которую он не купил.
///
/// Отмена несуществующей операции — штатный ответ, а не ошибка: именно так
/// она и посылается после обрыва, вслепую.
#[tauri::command]
pub fn acquiring_reversal(
    state: tauri::State<'_, AcquiringState>,
    client_id: String,
) -> Result<(), String> {
    let mut terminal = lock(&state)?;
    terminal.reversal(&client_id).map_err(|e| e.to_string())
}

/// Возврат по карте — отдельная операция, а не отмена оплаты.
#[tauri::command]
pub fn acquiring_refund(
    state: tauri::State<'_, AcquiringState>,
    request: PaymentRequest,
) -> Result<super::Authorization, String> {
    let mut terminal = lock(&state)?;
    terminal.refund(&request).map_err(|e| e.to_string())
}

/// Сценарии отказов терминала для проверки кассы без железа.
#[cfg(debug_assertions)]
#[tauri::command]
pub fn acquiring_simulate(
    state: tauri::State<'_, AcquiringState>,
    scenario: String,
) -> Result<(), String> {
    let mut terminal = lock(&state)?;
    let emulator = terminal
        .as_emulator()
        .ok_or("Сценарии отказов доступны только на эмуляторе терминала")?;

    match scenario.as_str() {
        "declined" => emulator.decline_next("сценарий проверки: отказ банка"),
        "unknown_after_approve" => emulator.fail_next_reply_after_approving(),
        "unknown_before_approve" => emulator.fail_next_reply_before_approving(),
        "unknown_then_disconnect" => emulator.fail_next_reply_then_disconnect(),
        "disconnect" => emulator.disconnect(),
        "connect" => emulator.connect(),
        other => return Err(format!("Неизвестный сценарий: {other}")),
    }

    Ok(())
}
