//! Эквайринговый терминал: оплата картой, возврат, отмена.
//!
//! Устроено как фискальный слой рядом (`src/fiscal/`): трейт, эмулятор, один
//! порядок операций на все модели. Причина та же — протоколов у банков много
//! (UPOS, Ingenico, PAX), а автомат состояний один, и жить он должен в одном
//! месте.
//!
//! # Чем эквайринг опаснее ФР
//!
//! У обоих есть исход «не знаю»: команда ушла, ответа нет. Но разрешаются они
//! по-разному, и путать их нельзя.
//!
//! У ФР неизвестность **читается**: спросили ФН последний документ, сверили
//! `client_id` — и всё ясно. Терминал же общается с банком, а не с локальной
//! памятью: пока мы не знаем исход, деньги гостя уже могли уйти со счёта.
//!
//! Отсюда правило: **на неизвестном исходе, который не подтвердился запросом
//! статуса, операция отменяется (reversal), а не забывается.** Забыть — значит
//! оставить списание без чека: гость увидит его в банковском приложении, а в
//! кассе не будет ни продажи, ни чека, ни следа. Разбирать это потом придётся
//! по выписке банка за день.
//!
//! Отмена при этом безопасна: reversal операции, которой не было, банк
//! отклоняет как «не найдено», и это штатный ответ, а не ошибка.

pub mod commands;
pub mod emulator;

use serde::{Deserialize, Serialize};

/// Деньги — целые копейки, как и везде (`fiscal::Kopecks`, `lib/money.ts`).
pub type Kopecks = i64;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OperationKind {
    Payment,
    /// Возврат по номеру исходной операции. Отдельная операция, а не отмена:
    /// отменить можно только сегодняшнюю, а возврат делают и через неделю.
    Refund,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentRequest {
    pub amount: Kopecks,
    /// Идемпотентность. По нему запрос статуса узнаёт свою операцию после
    /// обрыва — сумма для этого не годится: два счёта по 420 рублей подряд
    /// в фастфуде обычны.
    pub client_id: String,
    /// Наш номер заказа, уходит в слип терминала для сверки.
    pub order_number: i64,
}

/// Одобренная операция. Поля уезжают в платёж заказа и в фискальный чек:
/// по `rrn` операцию находят в банке при разборе спорной оплаты.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Authorization {
    pub kind: OperationKind,
    pub amount: Kopecks,
    /// Код авторизации банка.
    pub auth_code: String,
    /// Retrieval Reference Number — по нему операцию ищут в банке.
    pub rrn: String,
    /// Маска карты: «**** 4242». Полного номера у кассы нет и быть не должно.
    pub card_mask: String,
    pub client_id: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalStatus {
    pub connected: bool,
    /// Идёт ли операция прямо сейчас: терминал занят, второй запрос он отвергнет.
    pub busy: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", content = "message", rename_all = "snake_case")]
pub enum TerminalError {
    /// Кабель, питание, занятый порт. Операции точно не было.
    NotConnected(String),
    /// Банк отказал: недостаточно средств, карта заблокирована, отказ гостя.
    /// Денег не списано, повторять можно.
    Declined(String),
    /// **Исход неизвестен.** Списание могло произойти.
    Unknown(String),
}

impl std::fmt::Display for TerminalError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotConnected(m) => write!(f, "Терминал не отвечает: {m}"),
            Self::Declined(m) => write!(f, "Банк отклонил операцию: {m}"),
            Self::Unknown(m) => write!(f, "Исход операции неизвестен: {m}"),
        }
    }
}

pub type TerminalResult<T> = Result<T, TerminalError>;

/// Драйвер эквайрингового терминала.
pub trait PaymentTerminal: Send {
    fn status(&mut self) -> TerminalResult<TerminalStatus>;
    fn pay(&mut self, request: &PaymentRequest) -> TerminalResult<Authorization>;
    fn refund(&mut self, request: &PaymentRequest) -> TerminalResult<Authorization>;
    /// Отмена операции сегодняшнего дня по `client_id`.
    ///
    /// Отменять по нашему идентификатору, а не по `rrn`: после обрыва `rrn`
    /// нам как раз и неизвестен — ответ с ним не доехал.
    fn reversal(&mut self, client_id: &str) -> TerminalResult<()>;
    /// Чем закончилась операция с этим `client_id`, если терминал о ней знает.
    fn find_operation(&mut self, client_id: &str) -> TerminalResult<Option<Authorization>>;

    /// Сценарии отказов — только у эмулятора (см. `fiscal::FiscalDevice`).
    #[cfg(debug_assertions)]
    fn as_emulator(&mut self) -> Option<&mut emulator::Emulator> {
        None
    }
}

/// Исход оплаты для вызывающего.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "outcome", rename_all = "snake_case")]
pub enum PaymentOutcome {
    /// Деньги списаны. `recovered` — узнали об этом запросом статуса после
    /// обрыва, а не из прямого ответа.
    Approved {
        authorization: Authorization,
        recovered: bool,
    },
    /// Списания не было — банк отказал либо операция отменена нами.
    /// `reversed` отличает второе от первого: гостю их объясняют по-разному.
    Declined { reason: String, reversed: bool },
    /// Ни то ни другое. **Требует человека:** сверить банковскую выписку,
    /// прежде чем повторять оплату.
    NeedsAttention { error: TerminalError },
}

/// Оплата картой с разбором неизвестного исхода.
///
/// Порядок:
///
/// 1. пробуем оплатить;
/// 2. `Unknown` — спрашиваем терминал, что стало с операцией по `client_id`;
/// 3. нашли одобрение — деньги списаны, это успех, повторять нельзя;
/// 4. не нашли — **отменяем** (reversal). Списания либо не было, либо оно
///    отменено; в обоих случаях гость не заплатил, и это честный отказ;
/// 5. отмена не прошла — `NeedsAttention`. Здесь нельзя ни повторить (риск
///    двойного списания), ни закрыть заказ (риск неоплаченной еды).
pub fn pay_with_recovery(
    terminal: &mut dyn PaymentTerminal,
    request: &PaymentRequest,
) -> PaymentOutcome {
    match terminal.pay(request) {
        Ok(authorization) => PaymentOutcome::Approved {
            authorization,
            recovered: false,
        },

        Err(TerminalError::Declined(reason)) => PaymentOutcome::Declined {
            reason,
            reversed: false,
        },

        Err(TerminalError::NotConnected(message)) => PaymentOutcome::Declined {
            // Связи не было вовсе — операции не существует, отменять нечего.
            reason: TerminalError::NotConnected(message).to_string(),
            reversed: false,
        },

        Err(TerminalError::Unknown(message)) => match terminal.find_operation(&request.client_id) {
            Ok(Some(authorization)) => PaymentOutcome::Approved {
                authorization,
                recovered: true,
            },

            // Терминал ответил и операции не знает. Всё равно отменяем: он
            // мог не знать о ней потому, что не получил ответ от банка сам.
            Ok(None) => reverse(terminal, request, &message),

            // Статус спросить не удалось — тем более отменяем.
            Err(_) => reverse(terminal, request, &message),
        },
    }
}

fn reverse(
    terminal: &mut dyn PaymentTerminal,
    request: &PaymentRequest,
    message: &str,
) -> PaymentOutcome {
    match terminal.reversal(&request.client_id) {
        Ok(()) => PaymentOutcome::Declined {
            reason: format!("Операция отменена: {message}"),
            reversed: true,
        },
        Err(error) => PaymentOutcome::NeedsAttention { error },
    }
}

#[cfg(test)]
mod tests {
    use super::emulator::Emulator;
    use super::*;

    fn запрос(client_id: &str) -> PaymentRequest {
        PaymentRequest {
            amount: 42000,
            client_id: client_id.into(),
            order_number: 7,
        }
    }

    #[test]
    fn обычная_оплата_проходит() {
        let mut terminal = Emulator::new();
        let outcome = pay_with_recovery(&mut terminal, &запрос("c-1"));

        let PaymentOutcome::Approved { authorization, recovered } = outcome else {
            panic!("ожидалось одобрение: {outcome:?}");
        };
        assert!(!recovered);
        assert_eq!(authorization.amount, 42000);
        assert!(!authorization.rrn.is_empty(), "без RRN операцию не найти в банке");
    }

    #[test]
    fn отказ_банка_не_приводит_к_отмене() {
        let mut terminal = Emulator::new();
        terminal.decline_next("недостаточно средств");

        let outcome = pay_with_recovery(&mut terminal, &запрос("c-1"));
        assert_eq!(
            outcome,
            PaymentOutcome::Declined {
                reason: "недостаточно средств".into(),
                reversed: false,
            }
        );
        // Отменять нечего: списания не было.
        assert_eq!(terminal.reversal_count(), 0);
    }

    #[test]
    fn обрыв_после_одобрения_не_приводит_ко_второму_списанию() {
        let mut terminal = Emulator::new();
        terminal.fail_next_reply_after_approving();

        let outcome = pay_with_recovery(&mut terminal, &запрос("c-42"));
        let PaymentOutcome::Approved { authorization, recovered } = outcome else {
            panic!("деньги списаны, это успех: {outcome:?}");
        };
        assert!(recovered, "успех должен быть помечен как восстановленный");
        assert_eq!(authorization.client_id, "c-42");

        // Списание ровно одно, и отменять его нельзя: гость заплатил.
        assert_eq!(terminal.approved_count(), 1);
        assert_eq!(terminal.reversal_count(), 0);
    }

    #[test]
    fn обрыв_до_одобрения_гасится_отменой() {
        let mut terminal = Emulator::new();
        terminal.fail_next_reply_before_approving();

        let outcome = pay_with_recovery(&mut terminal, &запрос("c-7"));
        let PaymentOutcome::Declined { reversed, .. } = outcome else {
            panic!("списания не было, ожидался отказ: {outcome:?}");
        };
        assert!(reversed, "неизвестную операцию обязаны были отменить");
        assert_eq!(terminal.approved_count(), 0);
        assert_eq!(terminal.reversal_count(), 1);
    }

    #[test]
    fn неудавшаяся_отмена_требует_человека() {
        let mut terminal = Emulator::new();
        terminal.fail_next_reply_then_disconnect();

        let outcome = pay_with_recovery(&mut terminal, &запрос("c-9"));
        assert!(
            matches!(outcome, PaymentOutcome::NeedsAttention { .. }),
            "ни повторять, ни закрывать заказ нельзя: {outcome:?}"
        );
    }

    #[test]
    fn без_связи_операции_не_возникает() {
        let mut terminal = Emulator::new();
        terminal.disconnect();

        let outcome = pay_with_recovery(&mut terminal, &запрос("c-1"));
        let PaymentOutcome::Declined { reversed, .. } = outcome else {
            panic!("ожидался отказ: {outcome:?}");
        };
        // Отменять нечего — команда до терминала не дошла.
        assert!(!reversed);
        assert_eq!(terminal.approved_count(), 0);
    }

    #[test]
    fn возврат_это_своя_операция_а_не_отмена() {
        let mut terminal = Emulator::new();
        let payment = terminal.pay(&запрос("c-1")).expect("оплата");

        let refund = terminal.refund(&запрос("c-2")).expect("возврат");
        assert_eq!(refund.kind, OperationKind::Refund);
        // Исходная операция остаётся: возврат её не отменяет, а дополняет.
        assert_eq!(terminal.approved_count(), 2);
        assert_ne!(refund.rrn, payment.rrn);
    }
}
