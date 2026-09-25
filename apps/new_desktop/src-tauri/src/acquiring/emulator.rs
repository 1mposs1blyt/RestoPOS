//! Эмулятор эквайрингового терминала.
//!
//! Нужен по той же причине, что и эмулятор ККТ: разбирать надо не «списываются
//! ли деньги», а поведение на обрывах — связь падает между одобрением банка
//! и ответом терминалу. На живом железе это воспроизводится выдёргиванием
//! кабеля в нужную миллисекунду, то есть никак.
//!
//! Отказы вносятся явно, случайных здесь нет: тест, который иногда проходит,
//! хуже отсутствующего.

use super::{
    Authorization, OperationKind, PaymentRequest, PaymentTerminal, TerminalError, TerminalResult,
    TerminalStatus,
};

#[cfg_attr(not(any(test, debug_assertions)), allow(dead_code))]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum NextFailure {
    None,
    Declined(&'static str),
    /// Банк одобрил, ответ до кассы не дошёл. Деньги списаны.
    ReplyLostAfterApproving,
    /// Связь оборвалась раньше одобрения. Списания нет.
    ReplyLostBeforeApproving,
    /// Кабель выдернули: исход неизвестен и спросить уже нечем.
    ReplyLostThenDisconnected,
}

pub struct Emulator {
    connected: bool,
    operations: Vec<Authorization>,
    reversals: usize,
    sequence: u32,
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
            operations: Vec::new(),
            reversals: 0,
            sequence: 0,
            next_failure: NextFailure::None,
        }
    }

    fn ensure_connected(&self) -> TerminalResult<()> {
        if self.connected {
            Ok(())
        } else {
            Err(TerminalError::NotConnected("терминал не на связи".into()))
        }
    }

    fn approve(&mut self, request: &PaymentRequest, kind: OperationKind) -> Authorization {
        self.sequence += 1;

        let authorization = Authorization {
            kind,
            amount: request.amount,
            auth_code: format!("{:06}", 100_000 + self.sequence * 37),
            // RRN у банка 12 цифр. Держим формат правдоподобным: он попадает
            // в слип и в платёж заказа, по нему операцию потом и ищут.
            rrn: format!("{:012}", 700_000_000_000u64 + u64::from(self.sequence) * 7919),
            card_mask: "**** 4242".into(),
            client_id: request.client_id.clone(),
        };

        self.operations.push(authorization.clone());
        authorization
    }

    /// Операция под сценарием отказа. Одна на оплату и возврат: разница между
    /// ними в направлении денег, а не в том, как рвётся связь.
    fn perform(
        &mut self,
        request: &PaymentRequest,
        kind: OperationKind,
    ) -> TerminalResult<Authorization> {
        self.ensure_connected()?;

        match std::mem::replace(&mut self.next_failure, NextFailure::None) {
            NextFailure::None => Ok(self.approve(request, kind)),

            NextFailure::Declined(reason) => Err(TerminalError::Declined(reason.into())),

            NextFailure::ReplyLostAfterApproving => {
                // Порядок важен: банк одобрил, и только потом пропал ответ.
                self.approve(request, kind);
                Err(TerminalError::Unknown("ответ терминала не получен".into()))
            }

            NextFailure::ReplyLostBeforeApproving => {
                Err(TerminalError::Unknown("ответ терминала не получен".into()))
            }

            NextFailure::ReplyLostThenDisconnected => {
                self.approve(request, kind);
                self.connected = false;
                Err(TerminalError::Unknown("связь оборвана при ответе".into()))
            }
        }
    }
}

/// Управление сценарием отказа. Отдельным блоком под условием сборки:
/// в проде сказать терминалу «потеряй следующий ответ» не должно быть можно
/// ничем — как и у эмулятора ККТ.
#[cfg(any(test, debug_assertions))]
impl Emulator {
    pub fn disconnect(&mut self) {
        self.connected = false;
    }

    pub fn connect(&mut self) {
        self.connected = true;
    }

    pub fn decline_next(&mut self, reason: &'static str) {
        self.next_failure = NextFailure::Declined(reason);
    }

    pub fn fail_next_reply_after_approving(&mut self) {
        self.next_failure = NextFailure::ReplyLostAfterApproving;
    }

    pub fn fail_next_reply_before_approving(&mut self) {
        self.next_failure = NextFailure::ReplyLostBeforeApproving;
    }

    pub fn fail_next_reply_then_disconnect(&mut self) {
        self.next_failure = NextFailure::ReplyLostThenDisconnected;
    }

    /// Сколько операций одобрено. Только для тестов: у настоящего терминала
    /// такого вопроса не задать.
    #[cfg(test)]
    pub fn approved_count(&self) -> usize {
        self.operations.len()
    }

    #[cfg(test)]
    pub fn reversal_count(&self) -> usize {
        self.reversals
    }
}

impl PaymentTerminal for Emulator {
    fn status(&mut self) -> TerminalResult<TerminalStatus> {
        self.ensure_connected()?;
        Ok(TerminalStatus {
            connected: self.connected,
            busy: false,
        })
    }

    fn pay(&mut self, request: &PaymentRequest) -> TerminalResult<Authorization> {
        self.perform(request, OperationKind::Payment)
    }

    fn refund(&mut self, request: &PaymentRequest) -> TerminalResult<Authorization> {
        // Возврат идёт теми же сценариями, что и оплата: связь рвётся
        // одинаково в обе стороны, а деньги, ушедшие гостю без нашего ведома,
        // ищутся по выписке ровно так же, как списанные без чека.
        self.perform(request, OperationKind::Refund)
    }

    fn reversal(&mut self, client_id: &str) -> TerminalResult<()> {
        self.ensure_connected()?;

        /*
         * Отмена операции, которой терминал не знает, — штатный ответ, а не
         * ошибка: именно ради этого случая её и посылают вслепую после обрыва.
         * Возвращать здесь отказ значило бы гнать кассу в `NeedsAttention`
         * каждый раз, когда обрыв случился до списания.
         */
        self.operations.retain(|op| op.client_id != client_id);
        self.reversals += 1;
        Ok(())
    }

    fn find_operation(&mut self, client_id: &str) -> TerminalResult<Option<Authorization>> {
        self.ensure_connected()?;
        Ok(self
            .operations
            .iter()
            .find(|op| op.client_id == client_id)
            .cloned())
    }

    #[cfg(debug_assertions)]
    fn as_emulator(&mut self) -> Option<&mut Emulator> {
        Some(self)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn запрос(client_id: &str) -> PaymentRequest {
        PaymentRequest {
            amount: 15000,
            client_id: client_id.into(),
            order_number: 1,
        }
    }

    #[test]
    fn отмена_неизвестной_операции_это_не_ошибка() {
        let mut terminal = Emulator::new();
        // Именно так отмена и посылается после обрыва — вслепую.
        assert!(terminal.reversal("никогда-не-было").is_ok());
    }

    #[test]
    fn отмена_убирает_операцию_из_терминала() {
        let mut terminal = Emulator::new();
        terminal.pay(&запрос("c-1")).expect("оплата");
        assert!(terminal.find_operation("c-1").expect("поиск").is_some());

        terminal.reversal("c-1").expect("отмена");
        assert!(terminal.find_operation("c-1").expect("поиск").is_none());
    }

    #[test]
    fn без_связи_терминал_отвечает_отказом_а_не_молчанием() {
        let mut terminal = Emulator::new();
        terminal.disconnect();

        assert!(matches!(
            terminal.status().unwrap_err(),
            TerminalError::NotConnected(_)
        ));
        assert!(matches!(
            terminal.pay(&запрос("c-1")).unwrap_err(),
            TerminalError::NotConnected(_)
        ));
        assert!(matches!(
            terminal.reversal("c-1").unwrap_err(),
            TerminalError::NotConnected(_)
        ));
    }

    #[test]
    fn коды_операций_не_повторяются() {
        let mut terminal = Emulator::new();
        let first = terminal.pay(&запрос("c-1")).expect("оплата 1");
        let second = terminal.pay(&запрос("c-2")).expect("оплата 2");

        // Совпавший RRN означал бы, что две операции в банке неотличимы.
        assert_ne!(first.rrn, second.rrn);
        assert_ne!(first.auth_code, second.auth_code);
    }
}
