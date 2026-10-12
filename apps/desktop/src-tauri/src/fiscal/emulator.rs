//! Эмулятор ККТ: тот же трейт, что у настоящего драйвера, но без железа.
//!
//! Нужен не только тестам. Фискальный регистратор стоит денег и живёт
//! в единственном экземпляре на кассе, а разбирать надо в первую очередь
//! не «печатается ли чек», а поведение на обрывах: связь рвётся между
//! регистрацией и ответом, смена перевалила за сутки, ФН отвечает отказом.
//! Воспроизвести это на живой ККТ можно только выдёргиванием кабеля
//! в нужную миллисекунду.
//!
//! Поэтому отказы здесь **вносятся явно** (`fail_next_reply_after_registering`
//! и соседи), а не выпадают случайно: тест, который иногда проходит, хуже
//! отсутствующего.

use std::time::{Duration, SystemTime};

use super::{
    DeviceStatus, FiscalDevice, FiscalError, FiscalReceipt, FiscalResult, PaymentKind, ReceiptKind,
    ReceiptRequest, ZReport,
};

/// Что сделать со следующей регистрацией.
///
/// В релизной сборке варианты, кроме `None`, никем не строятся — сценарии
/// отказов туда не попадают вовсе (`fiscal_simulate` вырезан). Ветки match
/// при этом остаются: так компилятор продолжает следить за полнотой разбора,
/// а сборка не расходится с отладочной по логике.
#[cfg_attr(not(any(test, debug_assertions)), allow(dead_code))]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum NextFailure {
    None,
    /// Обрыв ПОСЛЕ записи в ФН: документ есть, ответа нет. Самый опасный
    /// случай — именно его закрывает восстановление.
    ReplyLostAfterRegistering,
    /// Обрыв ДО записи: документа нет, повторять безопасно.
    ReplyLostBeforeRegistering,
    /// Кабель выдернули: документ записан, ответа нет, и связь не вернулась —
    /// спросить ФН, что там лежит, уже нечем.
    ReplyLostThenDisconnected,
    /// ККТ отвечает отказом по существу.
    Rejected(&'static str),
}

pub struct Emulator {
    connected: bool,
    shift_open: bool,
    shift_number: i64,
    shift_opened_at: SystemTime,
    document_number: i64,
    receipt_number: i64,
    receipts: Vec<FiscalReceipt>,
    /// Итоги текущей смены. Обнуляются Z-отчётом — в этом он и состоит.
    cash_total: i64,
    cashless_total: i64,
    refunds_total: i64,
    shift_receipts: i64,
    next_failure: NextFailure,
}

impl Default for Emulator {
    fn default() -> Self {
        Self::new()
    }
}

impl Emulator {
    pub fn new() -> Self {
        Self {
            connected: true,
            shift_open: false,
            shift_number: 0,
            shift_opened_at: SystemTime::now(),
            document_number: 0,
            receipt_number: 0,
            receipts: Vec::new(),
            cash_total: 0,
            cashless_total: 0,
            refunds_total: 0,
            shift_receipts: 0,
            next_failure: NextFailure::None,
        }
    }

    // ── Внутреннее ──────────────────────────────────────────────────────────

    fn expired(&self) -> bool {
        self.shift_open
            && self
                .shift_opened_at
                .elapsed()
                .map(|elapsed| elapsed > Duration::from_secs(24 * 3600))
                .unwrap_or(false)
    }

    fn ensure_connected(&self) -> FiscalResult<()> {
        if self.connected {
            Ok(())
        } else {
            Err(FiscalError::NotConnected("нет связи с устройством".into()))
        }
    }
}

/// Управление сценарием отказа.
///
/// Отдельным блоком под условием сборки: в проде подсунуть кассе «потеряй
/// следующий ответ» не должно быть возможно ничем. Заодно исчезает мёртвый
/// код в релизе — вместе с самой возможностью.
#[cfg(any(test, debug_assertions))]
impl Emulator {
    pub fn disconnect(&mut self) {
        self.connected = false;
    }

    pub fn connect(&mut self) {
        self.connected = true;
    }

    /// Документ уйдёт в ФН, а ответ до кассы не дойдёт.
    pub fn fail_next_reply_after_registering(&mut self) {
        self.next_failure = NextFailure::ReplyLostAfterRegistering;
    }

    /// Связь оборвётся раньше, чем ФН запишет документ.
    pub fn fail_next_reply_before_registering(&mut self) {
        self.next_failure = NextFailure::ReplyLostBeforeRegistering;
    }

    /// Кабель выдернули посреди регистрации и он остался выдернутым.
    ///
    /// Отличается от `disconnect()` до вызова: там касса узнаёт об обрыве
    /// сразу и чек заведомо не пробит, здесь исход остаётся неизвестным —
    /// и это разные ветки поведения.
    pub fn fail_next_reply_then_disconnect(&mut self) {
        self.next_failure = NextFailure::ReplyLostThenDisconnected;
    }

    pub fn reject_next(&mut self, reason: &'static str) {
        self.next_failure = NextFailure::Rejected(reason);
    }

    /// Состарить смену: проверка «больше 24 часов» иначе требует ждать сутки.
    pub fn age_shift_hours(&mut self, hours: u64) {
        self.shift_opened_at -= Duration::from_secs(hours * 3600);
    }

    /// Сколько документов реально лежит в ФН.
    ///
    /// Только для тестов, и не из экономии: у настоящей ККТ такого вопроса
    /// не задать — есть лишь «последний документ». Утечь в рабочий код это
    /// не должно, иначе на живом железе оно окажется недоступно.
    #[cfg(test)]
    pub fn registered_count(&self) -> usize {
        self.receipts.len()
    }
}

impl Emulator {
    fn write_document(&mut self, request: &ReceiptRequest) -> FiscalReceipt {
        self.document_number += 1;
        self.receipt_number += 1;
        self.shift_receipts += 1;

        let total = request.items_total();

        match request.kind {
            ReceiptKind::Sale => {
                for payment in &request.payments {
                    match payment.kind {
                        PaymentKind::Cash => self.cash_total += payment.amount,
                        PaymentKind::Cashless => self.cashless_total += payment.amount,
                    }
                }
            }
            /*
             * Возврат копится своей строкой, а не вычитается из выручки.
             * Свернув их, мы потеряли бы сам факт возврата: в Z-отчёте
             * «продали на 0» и «продали на 1000 и вернули 1000» обязаны
             * различаться, иначе сверка с ОФД не сойдётся, а по кассе
             * не найти, кто и что возвращал.
             */
            ReceiptKind::Refund => self.refunds_total += total,
        }

        let receipt = FiscalReceipt {
            document_number: self.document_number,
            // У настоящей ККТ это подпись ФН. Формат — 10 цифр, и держать
            // его правдоподобным полезно: фронт печатает признак в чеке.
            fiscal_sign: format!("{:010}", 1_000_000_000 + self.document_number * 7919),
            shift_number: self.shift_number,
            receipt_number: self.receipt_number,
            total,
            client_id: request.client_id.clone(),
        };

        self.receipts.push(receipt.clone());
        receipt
    }
}

impl FiscalDevice for Emulator {
    fn print_test_receipt(&mut self) -> Result<(), String> {
        println!("[ЭМУЛЯТОР ККТ] Печать тестового чека: Связь есть!");
        Ok(())
    }

    fn print_image(&mut self, path: &str, scale_percent: u32) -> Result<(), String> {
        println!("[ЭМУЛЯТОР ККТ] Печать картинки {path} ({scale_percent}%)");
        Ok(())
    }

    fn status(&mut self) -> FiscalResult<DeviceStatus> {
        self.ensure_connected()?;
        Ok(DeviceStatus {
            connected: self.connected,
            shift_open: self.shift_open,
            shift_number: self.shift_number,
            shift_expired: self.expired(),
            last_document_number: self.document_number,
        })
    }

    fn open_shift(&mut self, _cashier_name: &str) -> FiscalResult<i64> {
        self.ensure_connected()?;
        if self.shift_open {
            return Err(FiscalError::Rejected("Смена уже открыта".into()));
        }

        self.shift_open = true;
        self.shift_number += 1;
        self.shift_opened_at = SystemTime::now();
        self.receipt_number = 0;
        self.shift_receipts = 0;
        self.cash_total = 0;
        self.cashless_total = 0;
        self.refunds_total = 0;

        Ok(self.shift_number)
    }

    fn close_shift(&mut self, _cashier_name: &str) -> FiscalResult<ZReport> {
        self.ensure_connected()?;
        if !self.shift_open {
            return Err(FiscalError::ShiftClosed);
        }

        self.document_number += 1;
        let report = ZReport {
            shift_number: self.shift_number,
            document_number: self.document_number,
            receipts: self.shift_receipts,
            cash_total: self.cash_total,
            cashless_total: self.cashless_total,
            refunds_total: self.refunds_total,
        };

        self.shift_open = false;
        Ok(report)
    }

    fn x_report(&mut self) -> FiscalResult<ZReport> {
        self.ensure_connected()?;
        if !self.shift_open {
            return Err(FiscalError::ShiftClosed);
        }

        Ok(ZReport {
            shift_number: self.shift_number,
            document_number: self.document_number,
            receipts: self.shift_receipts,
            cash_total: self.cash_total,
            cashless_total: self.cashless_total,
            refunds_total: self.refunds_total,
        })
    }

    fn register(&mut self, request: &ReceiptRequest) -> FiscalResult<FiscalReceipt> {
        self.ensure_connected()?;
        if !self.shift_open {
            return Err(FiscalError::ShiftClosed);
        }
        if self.expired() {
            return Err(FiscalError::ShiftExpired);
        }
        super::validate(request)?;

        match std::mem::replace(&mut self.next_failure, NextFailure::None) {
            NextFailure::None => Ok(self.write_document(request)),

            NextFailure::ReplyLostAfterRegistering => {
                self.write_document(request);
                Err(FiscalError::Unknown("ответ ККТ не получен".into()))
            }

            NextFailure::ReplyLostBeforeRegistering => {
                Err(FiscalError::Unknown("ответ ККТ не получен".into()))
            }

            NextFailure::ReplyLostThenDisconnected => {
                self.write_document(request);
                self.connected = false;
                Err(FiscalError::Unknown("связь оборвана при ответе".into()))
            }

            NextFailure::Rejected(reason) => Err(FiscalError::Rejected(reason.into())),
        }
    }

    fn last_receipt(&mut self) -> FiscalResult<Option<FiscalReceipt>> {
        self.ensure_connected()?;
        Ok(self.receipts.last().cloned())
    }

    #[cfg(debug_assertions)]
    fn as_emulator(&mut self) -> Option<&mut Emulator> {
        Some(self)
    }
}
