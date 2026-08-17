//! Фискальный регистратор: смена, чек, возврат, отчёты.
//!
//! Почему в Rust, а не во фронте: драйвер ККТ — это нативная библиотека
//! (у АТОЛ — ДТО-10), из браузера её не вызвать. Плюс регистрация чека
//! обязана иметь таймаут и восстановление после обрыва — из JS этим
//! управлять нечем.
//!
//! Границы те же, что у печати марок: фронт решает, ЧТО пробивать (состав
//! чека, суммы, налоги), Rust — КАК (драйвер, порядок команд, восстановление).
//!
//! # Главное правило порядка
//!
//! `эквайринг → фискальный чек → заказ оплачен`, и переставлять нельзя:
//!
//! - деньги списывает банк, а не касса. Пробить чек до эквайринга значит
//!   выдать фискальный документ на платёж, которого может не случиться:
//!   гость уйдёт с чеком, денег не будет, и расхождение всплывёт на сверке
//!   итогов в конце дня;
//! - пометить заказ оплаченным до чека значит закрыть счёт без фискального
//!   документа — с точки зрения налоговой продажи не было.
//!
//! Отсюда же и третье состояние. Ответ «не знаю» — это не ошибка, а нормальный
//! исход: связь с ККТ рвётся ровно в тот миг, когда чек уже зарегистрирован,
//! а ответ не доехал. Считать такое ошибкой — пробить второй чек на те же
//! деньги; считать успехом — потерять фискальный документ. Поэтому
//! `register_receipt` при неизвестном исходе идёт спрашивать сам ФР, что
//! он записал последним (см. `recover_unknown`).

pub mod commands;
pub mod emulator;

use serde::{Deserialize, Serialize};

/// Деньги — целые копейки, как и во фронте (`lib/money.ts`).
///
/// Плавающая точка в кассе недопустима: 0.1 + 0.2 в двоичной дроби не равно
/// 0.3, и на сотне позиций расхождение вылезает в итоге чека.
pub type Kopecks = i64;

/// Система налогообложения. Номера — из ФФД, драйвер ждёт именно их.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaxSystem {
    Osn,
    UsnIncome,
    UsnIncomeOutcome,
    Envd,
    Esn,
    Patent,
}

/// Ставка НДС позиции.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VatRate {
    None,
    Vat0,
    Vat10,
    Vat20,
    /// Расчётные ставки для авансов и агентских схем.
    Vat10_110,
    Vat20_120,
}

/// Род оплаты в фискальном чеке.
///
/// ККТ различает наличные и безналичные, и на этом строится Z-отчёт: сверять
/// ящик надо только с наличной частью (та же причина, что у `lib/cash-totals.ts`
/// во фронте).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PaymentKind {
    Cash,
    Cashless,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptItem {
    pub name: String,
    /// Количество в тысячных: 0.5 порции — это 500. Дробные доли появляются
    /// при делении блюда (`lib/split-quantity.ts`).
    pub quantity_milli: i64,
    /// Цена за единицу.
    pub price: Kopecks,
    pub vat: VatRate,
    /// Стоимость строки, заданная явно (в ФФД это отдельный реквизит —
    /// «стоимость предмета расчёта», тег 1043).
    ///
    /// Нужна из-за скидок. Скидка на заказ раскидывается по позициям, и цена
    /// за единицу после этого перестаёт быть целым числом копеек: треть
    /// порции со скидкой 7% не выражается ни в каком `price`. Считать
    /// стоимость перемножением тогда значит расходиться с итогом чека
    /// на копейки — а сумма позиций обязана сойтись с суммой платежей
    /// до копейки, иначе ККТ отклонит документ.
    ///
    /// `None` — обычный случай без скидки: стоимость считается перемножением.
    #[serde(default)]
    pub line_total: Option<Kopecks>,
}

impl ReceiptItem {
    /// Стоимость позиции. Округление — половина вверх, как в `lib/money.ts`:
    /// расходиться с фронтом на копейку в итоге чека нельзя.
    pub fn total(&self) -> Kopecks {
        if let Some(total) = self.line_total {
            return total;
        }
        let raw = self.price as i128 * self.quantity_milli as i128;
        ((raw + 500) / 1000) as Kopecks
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptPayment {
    pub kind: PaymentKind,
    pub amount: Kopecks,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReceiptKind {
    Sale,
    /// Возврат прихода. Отдельный документ, а не отмена: чек иммутабелен
    /// (инвариант №6), и «отменить» его нельзя ни в кассе, ни в налоговой.
    Refund,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptRequest {
    pub kind: ReceiptKind,
    pub items: Vec<ReceiptItem>,
    pub payments: Vec<ReceiptPayment>,
    pub tax_system: TaxSystem,
    pub cashier_name: String,
    /// Наш номер заказа. Уходит в чек, чтобы фискальный документ можно было
    /// сопоставить с заказом при разборе смены.
    pub order_number: i64,
    /// Идемпотентность: то же значение при повторе после обрыва. По нему
    /// восстановление узнаёт свой чек в памяти ККТ.
    pub client_id: String,
}

impl ReceiptRequest {
    pub fn items_total(&self) -> Kopecks {
        self.items.iter().map(ReceiptItem::total).sum()
    }

    pub fn payments_total(&self) -> Kopecks {
        self.payments.iter().map(|p| p.amount).sum()
    }
}

/// Зарегистрированный фискальный документ.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FiscalReceipt {
    /// Номер фискального документа, сквозной по ФН.
    pub document_number: i64,
    /// Фискальный признак — подпись документа в ФН.
    pub fiscal_sign: String,
    pub shift_number: i64,
    /// Номер чека внутри смены.
    pub receipt_number: i64,
    pub total: Kopecks,
    pub client_id: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZReport {
    pub shift_number: i64,
    pub document_number: i64,
    pub receipts: i64,
    /// Наличная выручка — с ней и только с ней сверяют денежный ящик.
    pub cash_total: Kopecks,
    pub cashless_total: Kopecks,
    pub refunds_total: Kopecks,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStatus {
    pub connected: bool,
    pub shift_open: bool,
    pub shift_number: i64,
    /// Смена открыта дольше 24 часов: ККТ откажется пробивать чек, пока
    /// её не закроют. Знать об этом надо заранее, а не в момент расчёта гостя.
    pub shift_expired: bool,
    pub last_document_number: i64,
}

/// Отказ фискального регистратора.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", content = "message", rename_all = "snake_case")]
pub enum FiscalError {
    /// Кабель, питание, занятый порт. Чек точно не зарегистрирован.
    NotConnected(String),
    /// Смена закрыта — чек пробивать нельзя.
    ShiftClosed,
    /// Смена идёт больше 24 часов, нужен Z-отчёт.
    ShiftExpired,
    /// ККТ ответила отказом: неверный состав чека, переполнение ФН, архив
    /// закрыт. Чек не зарегистрирован, повтор с тем же составом не поможет.
    Rejected(String),
    /// **Исход неизвестен.** Команда ушла, ответа нет. Чек мог быть
    /// зарегистрирован, а мог и нет — решать по состоянию ФН, а не гаданием.
    Unknown(String),
}

impl std::fmt::Display for FiscalError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotConnected(m) => write!(f, "ККТ не отвечает: {m}"),
            Self::ShiftClosed => write!(f, "Кассовая смена закрыта"),
            Self::ShiftExpired => write!(f, "Смена идёт больше 24 часов, нужен Z-отчёт"),
            Self::Rejected(m) => write!(f, "ККТ отклонила чек: {m}"),
            Self::Unknown(m) => write!(f, "Исход регистрации неизвестен: {m}"),
        }
    }
}

pub type FiscalResult<T> = Result<T, FiscalError>;

/// Драйвер фискального регистратора.
///
/// Трейт, а не конкретный тип, ровно по одной причине: моделей ККТ много
/// (АТОЛ, ШТРИХ, Эвотор), протоколы у них разные, а порядок операций один.
/// Порядок живёт здесь, в `register_with_recovery`, и при смене модели
/// не переписывается.
pub trait FiscalDevice: Send {
    fn status(&mut self) -> FiscalResult<DeviceStatus>;
    fn open_shift(&mut self, cashier_name: &str) -> FiscalResult<i64>;
    fn close_shift(&mut self, cashier_name: &str) -> FiscalResult<ZReport>;
    /// X-отчёт: срез без гашения, смену не закрывает.
    fn x_report(&mut self) -> FiscalResult<ZReport>;
    fn register_receipt(&mut self, request: &ReceiptRequest) -> FiscalResult<FiscalReceipt>;
    /// Последний документ в памяти ФН. Единственный способ узнать, что
    /// успела записать ККТ до обрыва.
    fn last_receipt(&mut self) -> FiscalResult<Option<FiscalReceipt>>;

    /// Доступ к сценариям отказов — есть только у эмулятора.
    ///
    /// Явным методом, а не приведением типа через `Any`: у настоящей ККТ
    /// «потеряй следующий ответ» не существует, и `None` здесь — это
    /// содержательный ответ, а не неудачный каст. В релизной сборке метода
    /// нет вовсе.
    #[cfg(debug_assertions)]
    fn as_emulator(&mut self) -> Option<&mut emulator::Emulator> {
        None
    }
}

/// Исход регистрации для вызывающего.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "outcome", rename_all = "snake_case")]
pub enum RegistrationOutcome {
    /// Чек зарегистрирован — этой попыткой или предыдущей, что для кассы
    /// одно и то же.
    Registered { receipt: FiscalReceipt, recovered: bool },
    /// Чек точно не зарегистрирован. Заказ оплаченным помечать нельзя,
    /// но и деньги возвращать не нужно — эквайринг сюда не дошёл.
    Failed { error: FiscalError },
    /// Ни то ни другое: спросить ФН не удалось. **Требует человека.**
    NeedsAttention { error: FiscalError },
}

/// Регистрация чека с восстановлением после обрыва.
///
/// Это и есть «отдельная ветка неизвестного результата» из плана. Схема:
///
/// 1. пробуем зарегистрировать;
/// 2. получили `Unknown` — идём читать последний документ ФН;
/// 3. если его `client_id` совпал с нашим, чек уже пробит: возвращаем
///    его как успех, второй раз не регистрируем;
/// 4. если не совпал — чек до ФН не доехал, можно повторять;
/// 5. если и прочитать не удалось — исход остаётся неизвестным, и решать
///    должен человек. Автоматически повторять здесь нельзя: это лотерея
///    между двойным чеком и потерянной выручкой.
///
/// Сравнение идёт по `client_id`, а не по сумме: два одинаковых заказа
/// на 420 рублей подряд — обычное дело в фастфуде, и по сумме свой чек
/// от чужого не отличить.
pub fn register_with_recovery(
    device: &mut dyn FiscalDevice,
    request: &ReceiptRequest,
) -> RegistrationOutcome {
    match device.register_receipt(request) {
        Ok(receipt) => RegistrationOutcome::Registered { receipt, recovered: false },

        Err(FiscalError::Unknown(message)) => match device.last_receipt() {
            Ok(Some(last)) if last.client_id == request.client_id => {
                RegistrationOutcome::Registered { receipt: last, recovered: true }
            }
            // ФН ответил, и наш чек до него не доехал — значит его нет.
            Ok(_) => RegistrationOutcome::Failed {
                error: FiscalError::Unknown(message),
            },
            Err(probe_error) => RegistrationOutcome::NeedsAttention { error: probe_error },
        },

        Err(error) => RegistrationOutcome::Failed { error },
    }
}

/// Проверка состава чека до отправки в ККТ.
///
/// Дешевле поймать расхождение здесь, чем получить отказ ФН посреди расчёта
/// гостя: ККТ на несведённый чек отвечает кодом ошибки, который кассиру
/// ничего не говорит.
pub fn validate(request: &ReceiptRequest) -> FiscalResult<()> {
    if request.items.is_empty() {
        return Err(FiscalError::Rejected("В чеке нет позиций".into()));
    }
    if request.items.iter().any(|item| item.quantity_milli <= 0) {
        return Err(FiscalError::Rejected(
            "Позиция с нулевым количеством".into(),
        ));
    }

    let items = request.items_total();
    let payments = request.payments_total();
    if items != payments {
        // Именно сумма платежей, а не внесённых денег: сдача в чек не идёт
        // (та же граница, что в `lib/payment-split.ts` во фронте).
        return Err(FiscalError::Rejected(format!(
            "Сумма позиций {items} не сходится с суммой платежей {payments}"
        )));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::emulator::Emulator;
    use super::*;

    fn чек(client_id: &str) -> ReceiptRequest {
        ReceiptRequest {
            kind: ReceiptKind::Sale,
            items: vec![ReceiptItem {
                name: "Борщ с говядиной".into(),
                quantity_milli: 1000,
                price: 42000,
                vat: VatRate::Vat20,
                line_total: None,
            }],
            payments: vec![ReceiptPayment {
                kind: PaymentKind::Cash,
                amount: 42000,
            }],
            tax_system: TaxSystem::UsnIncome,
            cashier_name: "Мария Дёмина".into(),
            order_number: 7,
            client_id: client_id.into(),
        }
    }

    #[test]
    fn стоимость_позиции_округляется_как_во_фронте() {
        // Треть порции по 420,00 — 140,00 ровно.
        let item = ReceiptItem {
            name: "доля".into(),
            quantity_milli: 333,
            price: 42000,
            vat: VatRate::Vat20,
            line_total: None,
        };
        // 42000 * 333 / 1000 = 13986, половина вверх ничего не меняет.
        assert_eq!(item.total(), 13986);

        // Ровно половина копейки идёт вверх, а не в пол: иначе доли блюда
        // недосчитываются, и итог чека расходится с тем, что показал фронт.
        let half = ReceiptItem {
            name: "половина".into(),
            quantity_milli: 500,
            price: 5,
            vat: VatRate::Vat20,
            line_total: None,
        };
        assert_eq!(half.total(), 3, "2,5 копейки округляются до 3");
    }

    #[test]
    fn явная_стоимость_строки_побеждает_перемножение() {
        // Так приезжает позиция со скидкой: цена за единицу осталась прежней
        // (её видно в чеке), а стоимость посчитана раскладкой на фронте.
        let item = ReceiptItem {
            name: "доля со скидкой".into(),
            quantity_milli: 333,
            price: 42000,
            vat: VatRate::Vat20,
            line_total: Some(13000),
        };
        assert_eq!(item.total(), 13000);
    }

    #[test]
    fn несведённый_чек_не_уходит_в_кассу() {
        let mut request = чек("c-1");
        request.payments[0].amount = 50000; // гость дал больше — это сдача, а не платёж
        let error = validate(&request).unwrap_err();
        assert!(matches!(error, FiscalError::Rejected(_)));
    }

    #[test]
    fn пустой_чек_отклоняется() {
        let mut request = чек("c-1");
        request.items.clear();
        request.payments.clear();
        assert!(validate(&request).is_err());
    }

    #[test]
    fn чек_без_открытой_смены_не_пробивается() {
        let mut device = Emulator::new();
        let outcome = register_with_recovery(&mut device, &чек("c-1"));
        assert_eq!(
            outcome,
            RegistrationOutcome::Failed {
                error: FiscalError::ShiftClosed
            }
        );
    }

    #[test]
    fn обрыв_после_регистрации_не_даёт_второго_чека() {
        let mut device = Emulator::new();
        device.open_shift("Мария").expect("смена");

        // ККТ запишет документ, но ответ до кассы не дойдёт — ровно тот случай,
        // ради которого существует восстановление.
        device.fail_next_reply_after_registering();

        let outcome = register_with_recovery(&mut device, &чек("c-42"));
        let RegistrationOutcome::Registered { receipt, recovered } = outcome else {
            panic!("чек уже в ФН, исход обязан быть успехом: {outcome:?}");
        };
        assert!(recovered, "успех должен быть помечен как восстановленный");
        assert_eq!(receipt.client_id, "c-42");

        // И главное: документ в ФН ровно один.
        assert_eq!(device.registered_count(), 1);
    }

    #[test]
    fn обрыв_до_регистрации_это_отказ_а_не_успех() {
        let mut device = Emulator::new();
        device.open_shift("Мария").expect("смена");
        device.fail_next_reply_before_registering();

        let outcome = register_with_recovery(&mut device, &чек("c-7"));
        assert!(
            matches!(outcome, RegistrationOutcome::Failed { .. }),
            "чека в ФН нет, заказ оплаченным считать нельзя: {outcome:?}"
        );
        assert_eq!(device.registered_count(), 0);
    }

    #[test]
    fn молчащая_ккт_после_обрыва_требует_человека() {
        let mut device = Emulator::new();
        device.open_shift("Мария").expect("смена");
        // Кабель выдернули посреди регистрации: документ мог записаться,
        // а спросить ФН уже нечем.
        device.fail_next_reply_then_disconnect();

        let outcome = register_with_recovery(&mut device, &чек("c-9"));
        assert!(
            matches!(outcome, RegistrationOutcome::NeedsAttention { .. }),
            "гадать между двойным чеком и потерянной выручкой нельзя: {outcome:?}"
        );
    }

    #[test]
    fn z_отчёт_считает_наличные_отдельно_от_безнала() {
        let mut device = Emulator::new();
        device.open_shift("Мария").expect("смена");

        device.register_receipt(&чек("c-1")).expect("наличный чек");

        let mut картой = чек("c-2");
        картой.payments = vec![ReceiptPayment {
            kind: PaymentKind::Cashless,
            amount: 42000,
        }];
        device.register_receipt(&картой).expect("чек картой");

        let z = device.close_shift("Мария").expect("Z-отчёт");
        assert_eq!(z.receipts, 2);
        // В ящике лежит только наличная часть — по ней и сверяют.
        assert_eq!(z.cash_total, 42000);
        assert_eq!(z.cashless_total, 42000);
    }

    #[test]
    fn возврат_не_вычитается_из_выручки_а_идёт_своей_строкой() {
        let mut device = Emulator::new();
        device.open_shift("Мария").expect("смена");
        device.register_receipt(&чек("c-1")).expect("продажа");

        let mut возврат = чек("c-2");
        возврат.kind = ReceiptKind::Refund;
        device.register_receipt(&возврат).expect("возврат");

        let z = device.close_shift("Мария").expect("Z-отчёт");
        // Возврат — отдельный род документа: свернув его с приходом, мы
        // потеряли бы и сам факт возврата, и сходимость с ОФД.
        assert_eq!(z.cash_total, 42000);
        assert_eq!(z.refunds_total, 42000);
    }

    #[test]
    fn смена_старше_суток_требует_z_отчёта() {
        let mut device = Emulator::new();
        device.open_shift("Мария").expect("смена");
        device.age_shift_hours(25);

        let outcome = register_with_recovery(&mut device, &чек("c-1"));
        assert_eq!(
            outcome,
            RegistrationOutcome::Failed {
                error: FiscalError::ShiftExpired
            }
        );

        // Закрыть просроченную смену Z-отчётом при этом обязано получаться,
        // иначе касса встанет насмерть.
        assert!(device.close_shift("Мария").is_ok());
    }

    #[test]
    fn номера_чеков_идут_подряд_а_документов_сквозь_смены() {
        let mut device = Emulator::new();
        device.open_shift("Мария").expect("смена 1");
        let first = device.register_receipt(&чек("c-1")).expect("чек 1");
        let second = device.register_receipt(&чек("c-2")).expect("чек 2");
        assert_eq!((first.receipt_number, second.receipt_number), (1, 2));

        device.close_shift("Мария").expect("Z");
        device.open_shift("Мария").expect("смена 2");
        let third = device.register_receipt(&чек("c-3")).expect("чек 3");

        // Номер чека — внутри смены, поэтому обнулился.
        assert_eq!(third.receipt_number, 1);
        // Номер фискального документа сквозной по ФН и обнуляться не имеет
        // права: по нему документ ищут в ОФД.
        assert!(third.document_number > second.document_number);
    }
}
