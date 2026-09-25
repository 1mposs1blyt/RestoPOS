//! Драйвер АТОЛ через ДТО-10.
//!
//! Вызов идёт не через FFI, а через PowerShell: ДТО-10 поставляется сборкой
//! .NET (`Atol.Drivers10.Fptr.dll`), и грузить её в процесс Tauri пришлось бы
//! через хостинг CLR. PowerShell грузит её рефлексией одной строкой, а цена —
//! запуск процесса на операцию — на фоне печати чека незаметна.
//!
//! # Почему обвязка одна на все операции
//!
//! Настройки связи, `open`, проверка `isOpened` и `finally` с `close` живут
//! в `run` и только там. Скопированные в каждый метод, они разъезжаются
//! на первой правке: так уже было — четыре метода несли по своей копии,
//! и в каждой звался несуществующий `queryOperationParams`.
//!
//! # Чего в ДТО-10 нет, хотя кажется, что есть
//!
//! Проверено рефлексией по самой DLL, а не по памяти:
//!
//! - `queryOperationParams()` не существует. Состояние читается парой
//!   `setParam(LIBFPTR_PARAM_DATA_TYPE, ...)` + `queryData()`;
//! - `closeShift()` не существует. Z-отчёт — это `report()` с типом
//!   `LIBFPTR_RT_CLOSE_SHIFT`, X-отчёт — с `LIBFPTR_RT_X`;
//! - константы `LIBFPTR_PARAM_OPERATOR_NAME` нет. Кассир уезжает тегом ФФД
//!   1021 через `operatorLogin()`. Обращение к отсутствующей статической
//!   константе PowerShell не считает ошибкой — оно тихо даёт `$null`,
//!   и `setParam($null, "Мария")` молча не делает ничего.
//!
//! # Ключи JSON
//!
//! Скрипты печатают **camelCase**: `DeviceStatus`, `ZReport` и `FiscalReceipt`
//! размечены `serde(rename_all = "camelCase")`, и snake_case из скрипта
//! не разберётся даже при полностью исправном железе.

use super::{
    DeviceStatus, FiscalDevice, FiscalError, FiscalReceipt, Kopecks, PaymentKind, ReceiptItem,
    ReceiptKind, ReceiptRequest, TaxSystem, VatRate, ZReport,
};
use std::process::Command;

/// ДТО-10 ставится инсталлятором АТОЛ и лежит по фиксированному пути.
const DRIVER_DLL: &str = r"C:\Program Files\ATOL\Drivers10\KKT\bin\Atol.Drivers10.Fptr.dll";

/*
 * Коды выхода скрипта — способ донести из PowerShell не текст, а *род* отказа.
 *
 * Род отказа решает судьбу денег гостя, и сводить его к строке нельзя:
 * «ККТ отклонила» и «ответ не доехал» требуют противоположных действий
 * (см. `RegistrationOutcome` в `mod.rs`).
 */
mod exit_code {
    /// Связь, питание, занятый порт. Документа точно нет.
    pub const NO_CONNECTION: i32 = 1;
    pub const SHIFT_CLOSED: i32 = 2;
    pub const SHIFT_EXPIRED: i32 = 3;
    /// ККТ ответила отказом: состав чека, переполнение ФН, закрытый архив.
    pub const REJECTED: i32 = 4;
    /// Ответа нет. Документ мог записаться, а мог и нет.
    pub const UNKNOWN: i32 = 5;
}

/// Общее начало скрипта: загрузка ДТО, настройки связи, открытие порта.
///
/// Плейсхолдеры подставляются `replace`, а не `format!`, намеренно: скрипт
/// состоит из фигурных скобок PowerShell почти целиком, и удваивать их
/// в каждом методе — верный способ однажды промахнуться.
const PREAMBLE: &str = r#"
$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Reflection.Assembly]::LoadFrom('@@DLL@@') | Out-Null
$fptr = New-Object Atol.Drivers10.Fptr.Fptr
$C = [Atol.Drivers10.Fptr.Constants]

# Чем считать необработанное исключение. Операции, после которых документ
# мог остаться в ФН, поднимают это значение до UNKNOWN перед опасным шагом.
$GenericFail = 1

function Fail($code, $text) {
    [Console]::Error.WriteLine($text)
    # Out-Null обязателен: несъеденный возврат `close` уезжает в stdout
    # последней строкой, и разбор номера смены прочитает его вместо номера.
    if ($null -ne $fptr -and $fptr.isOpened()) { $fptr.close() | Out-Null }
    exit $code
}

# Отрицательный код возврата ДТО — отказ. Текст ошибки берём у драйвера:
# свой список кодов разъедется с прошивкой.
function Check($res, $what) {
    if ($res -lt 0) { Fail 4 "$what : $($fptr.errorDescription())" }
}

try {
    <#
      Каждый ключ здесь проверен по самой DLL, и ошибиться в них легко:

      - Model обязателен. Без него setSettings отдаёт -1 «Отсутствует
        обязательная настройка [Model]» и не применяет НИЧЕГО. Драйвер
        при этом продолжает работать на настройках, сохранённых утилитой
        АТОЛ, — то есть касса молча ходит не туда, куда написано в коде,
        и подменённый адрес не даёт никакого эффекта. 500 = ATOL_AUTO,
        модель определяется по ответу ККТ;
      - Port = 2 это TCP/IP. Единица, которая тут стояла, — это USB;
      - порт зовётся IPPort, а не PortNumber: неизвестный ключ ДТО молча
        игнорирует.
    #>
    $settings = @{
        'Model' = 500
        'Port' = 2
        'IPAddress' = '@@IP@@'
        'IPPort' = @@PORT@@
    } | ConvertTo-Json -Compress

    # Возврат проверяем: молча непринятые настройки — худший вид отказа,
    # потому что касса продолжает работать, но с чужой ККТ.
    if ($fptr.setSettings($settings) -lt 0) {
        Fail 1 "Настройки связи не приняты: $($fptr.errorDescription())"
    }

    $fptr.open() | Out-Null
    if (-not $fptr.isOpened()) {
        Fail 1 "ККТ не отвечает по @@IP@@:@@PORT@@ : $($fptr.errorDescription())"
    }

"#;

const EPILOGUE: &str = r#"
} catch {
    Fail $GenericFail "Сбой драйвера: $_"
} finally {
    # Out-Null обязателен: несъеденный возврат `close` уезжает в stdout
    # последней строкой, и разбор номера смены прочитает его вместо номера.
    if ($null -ne $fptr -and $fptr.isOpened()) { $fptr.close() | Out-Null }
}
"#;

/// Строка, которой скрипт регистрации сообщает номер ФД до начала чека.
const BASELINE_MARK: &str = "BASELINE ";

/// Строка, которой скрипт открытия смены сообщает её номер.
const SHIFT_MARK: &str = "SHIFT ";

pub struct AtolDevice {
    pub ip: String,
    pub port: u16,
    /// Что регистрировали последним и каким был номер ФД **до** попытки.
    ///
    /// Нужно ровно для одного: отличить свой чек от чужого при неизвестном
    /// исходе. `client_id` живой ККТ неизвестен — своего поля под него в ФН
    /// нет, — поэтому «наш ли это документ» решается номером: ФД, появившийся
    /// после начала нашей попытки, наш и есть.
    pending: Option<Pending>,
}

struct Pending {
    client_id: String,
    document_before: i64,
}

/// Отказ скрипта: род (код выхода), текст для кассира и то, что он успел
/// напечатать до падения.
struct Failure {
    code: i32,
    message: String,
    /// Нужен из-за `BASELINE`: номер ФД печатается до чека и доезжает даже
    /// тогда, когда сам чек не удался.
    stdout: String,
}

impl Failure {
    /// Перевод в ошибку слоя ККТ.
    ///
    /// `NO_CONNECTION` — это «документа точно нет», а не «неизвестно»:
    /// порт не открылся, команда до ФН не дошла.
    fn into_fiscal(self) -> FiscalError {
        match self.code {
            exit_code::NO_CONNECTION => FiscalError::NotConnected(self.message),
            exit_code::SHIFT_CLOSED => FiscalError::ShiftClosed,
            exit_code::SHIFT_EXPIRED => FiscalError::ShiftExpired,
            exit_code::REJECTED => FiscalError::Rejected(self.message),
            exit_code::UNKNOWN => FiscalError::Unknown(self.message),
            _ => FiscalError::DeviceError(self.message),
        }
    }
}

/// Экранирование для одинарных кавычек PowerShell.
///
/// Внутри `'...'` подстановки `$` нет, поэтому экранировать надо ровно
/// апостроф — удвоением. Имя блюда «Пицца 'Маргарита'» иначе оборвёт строку
/// и превратит остаток чека в синтаксическую ошибку.
fn ps_quote(value: &str) -> String {
    value.replace('\'', "''")
}

/// Копейки — в рубли строкой с двумя знаками.
///
/// Через строку, а не через `as f64`, потому что двоичная дробь не хранит
/// 0.1 точно: на сотне позиций расхождение вылезает в итоге чека, а ККТ
/// требует, чтобы сумма позиций сошлась с суммой платежей до копейки.
fn rubles(amount: Kopecks) -> String {
    let sign = if amount < 0 { "-" } else { "" };
    let abs = amount.abs();
    format!("{}{}.{:02}", sign, abs / 100, abs % 100)
}

/// Тысячные доли — в количество строкой с тремя знаками.
fn quantity(milli: i64) -> String {
    let sign = if milli < 0 { "-" } else { "" };
    let abs = milli.abs();
    format!("{}{}.{:03}", sign, abs / 1000, abs % 1000)
}

/// Ставка НДС в константу ДТО.
fn vat_constant(vat: VatRate) -> &'static str {
    match vat {
        VatRate::None => "LIBFPTR_TAX_NO",
        VatRate::Vat0 => "LIBFPTR_TAX_VAT0",
        VatRate::Vat10 => "LIBFPTR_TAX_VAT10",
        VatRate::Vat20 => "LIBFPTR_TAX_VAT20",
        VatRate::Vat10_110 => "LIBFPTR_TAX_VAT110",
        VatRate::Vat20_120 => "LIBFPTR_TAX_VAT120",
    }
}

/// Система налогообложения в константу ДТО.
fn tax_system_constant(system: TaxSystem) -> &'static str {
    match system {
        TaxSystem::Osn => "LIBFPTR_TT_OSN",
        TaxSystem::UsnIncome => "LIBFPTR_TT_USN_INCOME",
        TaxSystem::UsnIncomeOutcome => "LIBFPTR_TT_USN_INCOME_OUTCOME",
        TaxSystem::Envd => "LIBFPTR_TT_ENVD",
        TaxSystem::Esn => "LIBFPTR_TT_ESN",
        TaxSystem::Patent => "LIBFPTR_TT_PATENT",
    }
}

/// Номер ФД, напечатанный скриптом до начала чека.
fn parse_baseline(payload: &str) -> Option<i64> {
    payload
        .lines()
        .map(str::trim)
        .find_map(|line| line.strip_prefix(BASELINE_MARK))
        .and_then(|value| value.trim().parse::<i64>().ok())
}

impl AtolDevice {
    pub fn new(ip: &str, port: u16) -> Self {
        Self {
            ip: ip.to_string(),
            port,
            pending: None,
        }
    }

    /// Выполнить тело скрипта в общей обвязке и вернуть его stdout.
    ///
    /// `body` вставляется как есть, поэтому подставленные значения (имена,
    /// пути, числа) экранирует вызывающий.
    fn run(&self, body: &str) -> Result<String, Failure> {
        let mut script = PREAMBLE
            .replace("@@DLL@@", DRIVER_DLL)
            .replace("@@IP@@", &self.ip)
            .replace("@@PORT@@", &self.port.to_string());
        script.push_str(body);
        script.push_str(EPILOGUE);

        let output = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .output()
            .map_err(|e| Failure {
                code: exit_code::NO_CONNECTION,
                message: format!("PowerShell не запустился: {e}"),
                stdout: String::new(),
            })?;

        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();

        if output.status.success() {
            return Ok(stdout);
        }

        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(Failure {
            // Скрипт, убитый до `exit`, кода не оставляет — считаем это
            // неизвестностью, а не отказом: он мог упасть после `closeReceipt`.
            code: output.status.code().unwrap_or(exit_code::UNKNOWN),
            message: if stderr.is_empty() {
                "ККТ не ответила".to_string()
            } else {
                stderr
            },
            stdout,
        })
    }

    /// Разбор JSON из stdout скрипта.
    ///
    /// Скрипт может напечатать перед результатом служебные строки (базовый
    /// номер ФД), поэтому берём последнюю, похожую на объект.
    fn parse_json<T: serde::de::DeserializeOwned>(payload: &str) -> Result<T, FiscalError> {
        let line = payload
            .lines()
            .rev()
            .map(str::trim)
            .find(|line| line.starts_with('{'))
            .ok_or_else(|| FiscalError::DeviceError(format!("ККТ вернула не JSON: {payload}")))?;

        serde_json::from_str(line)
            .map_err(|e| FiscalError::DeviceError(format!("Ответ ККТ не разобран: {e}")))
    }

    /// Чтение состояния смены. Кусок скрипта, общий для чека и отчётов.
    fn shift_state_body() -> &'static str {
        r#"
    $fptr.setParam($C::LIBFPTR_PARAM_DATA_TYPE, $C::LIBFPTR_DT_SHIFT_STATE)
    $r = $fptr.queryData()
    Check $r "Состояние смены"
    $shiftState = $fptr.getParamInt($C::LIBFPTR_PARAM_SHIFT_STATE)
    $shiftNumber = $fptr.getParamInt($C::LIBFPTR_PARAM_SHIFT_NUMBER)
"#
    }

    /// Позиции и платежи чека.
    fn receipt_body(request: &ReceiptRequest) -> String {
        let mut body = String::new();

        for item in &request.items {
            body.push_str(&Self::position_body(item));
        }

        for payment in &request.payments {
            let kind = match payment.kind {
                PaymentKind::Cash => "LIBFPTR_PT_CASH",
                PaymentKind::Cashless => "LIBFPTR_PT_ELECTRONICALLY",
            };
            body.push_str("\n    $fptr.setParam($C::LIBFPTR_PARAM_PAYMENT_TYPE, $C::");
            body.push_str(kind);
            body.push_str(")\n    $fptr.setParam($C::LIBFPTR_PARAM_PAYMENT_SUM, ");
            body.push_str(&rubles(payment.amount));
            body.push_str(")\n    $r = $fptr.payment()\n    Check $r \"Оплата\"\n");
        }

        body
    }

    fn position_body(item: &ReceiptItem) -> String {
        let mut body = String::new();
        let name = ps_quote(&item.name);

        body.push_str("\n    $fptr.setParam($C::LIBFPTR_PARAM_COMMODITY_NAME, '");
        body.push_str(&name);
        body.push_str("')\n    $fptr.setParam($C::LIBFPTR_PARAM_PRICE, ");
        body.push_str(&rubles(item.price));
        body.push_str(")\n    $fptr.setParam($C::LIBFPTR_PARAM_QUANTITY, ");
        body.push_str(&quantity(item.quantity_milli));
        /*
         * Стоимость строки задаётся явно (тег 1043), а не считается ККТ
         * перемножением. Скидка раскидывается по позициям, и цена за единицу
         * после этого перестаёт быть целым числом копеек: треть порции
         * со скидкой 7% не выражается ни в каком `price`. Перемножение
         * тогда разойдётся с суммой платежей, и ФН отклонит документ.
         */
        body.push_str(")\n    $fptr.setParam($C::LIBFPTR_PARAM_POSITION_SUM, ");
        body.push_str(&rubles(item.total()));
        body.push_str(")\n    $fptr.setParam($C::LIBFPTR_PARAM_TAX_TYPE, $C::");
        body.push_str(vat_constant(item.vat));
        /*
         * Название уезжает в сообщение об ошибке в ОДИНАРНЫХ кавычках, как
         * и в сам чек. В двойных PowerShell раскрывает `$` и обрывается
         * на `"`: блюдо «Кофе "по-турецки"» или «Сет $5» превратило бы
         * остаток чека в синтаксическую ошибку, а выглядело бы это как
         * отказ ККТ.
         */
        body.push_str(")\n    $r = $fptr.registration()\n    Check $r 'Позиция ");
        body.push_str(&name);
        body.push_str("'\n");

        body
    }

    /// Сколько символов помещается в строку ленты.
    ///
    /// Спрашиваем ККТ, а не задаём константой: у 80-мм ленты это 64 символа,
    /// у 58-мм — 32, и зависит это ещё и от шрифта. Захардкоженная ширина
    /// уже дала перекос — правая колонка упиралась в середину бумаги,
    /// потому что в коде стояло 32 вместо фактических 64.
    // Единственный потребитель — стенд (`bench.rs`), а он только в отладочной
    // сборке. В релизе метод остаётся невостребованным, и это не мусор:
    // ширина ленты понадобится, как только чек начнём верстать сами.
    #[cfg_attr(not(debug_assertions), allow(dead_code))]
    pub(crate) fn line_length(&self) -> Result<usize, String> {
        let body = r#"
    $fptr.setParam($C::LIBFPTR_PARAM_DATA_TYPE, $C::LIBFPTR_DT_RECEIPT_LINE_LENGTH)
    $r = $fptr.queryData()
    Check $r "Ширина ленты"
    [Console]::WriteLine("WIDTH " + $fptr.getParamInt($C::LIBFPTR_PARAM_RECEIPT_LINE_LENGTH))
"#;

        let payload = self.run(body).map_err(|failure| failure.message)?;

        payload
            .lines()
            .map(str::trim)
            .find_map(|line| line.strip_prefix("WIDTH "))
            .and_then(|value| value.trim().parse::<usize>().ok())
            .filter(|width| *width > 0)
            .ok_or_else(|| format!("Ширина ленты не разобрана: {payload}"))
    }

    /// Печать произвольных строк нефискальным документом.
    ///
    /// Нефискальный документ ФН не касается вовсе — печатает даже ККТ
    /// с исчерпанным или закрытым накопителем. На этом стоит стенд
    /// (`fiscal/bench.rs`): фискальную часть считает эмулятор, а бумага
    /// выходит настоящая.
    pub(crate) fn print_lines(&self, lines: &[String]) -> Result<(), String> {
        let mut body = String::from("\n    $fptr.beginNonFiscalDocument() | Out-Null\n");

        for line in lines {
            // Строка уезжает в одинарных кавычках, как и название блюда:
            // в двойных PowerShell раскрыл бы `$` и оборвался на `"`.
            body.push_str("    $fptr.setParam($C::LIBFPTR_PARAM_TEXT, '");
            body.push_str(&ps_quote(line));
            body.push_str("')\n    $fptr.printText() | Out-Null\n");
        }

        body.push_str("    $fptr.endNonFiscalDocument() | Out-Null\n");

        self.run(&body).map(|_| ()).map_err(|failure| failure.message)
    }

    /// Снятие отчёта: X или Z — различаются одной константой.
    ///
    /// Итоги читаются **до** снятия: закрытие смены обнуляет счётчики,
    /// и Z-отчёт с нулями было бы нечем отличить от честного нуля.
    fn report(&mut self, report_type: &str, cashier: &str) -> Result<ZReport, FiscalError> {
        let mut body = String::from(Self::shift_state_body());
        body.push_str(
            r#"
    if ($shiftState -eq $C::LIBFPTR_SS_CLOSED) { Fail 2 "Смена в ККТ закрыта" }

    $fptr.setParam(1021, '@@CASHIER@@')
    $r = $fptr.operatorLogin()
    Check $r "Регистрация кассира"

    # Счётчики смены. Читаются до отчёта: Z-отчёт их обнуляет.
    # Недоступный счётчик даёт ноль, а не роняет отчёт: закрыть смену важнее,
    # чем показать её итог, — незакрытая смена блокирует следующий день.
    function PaymentSum($receiptType, $paymentType) {
        $fptr.setParam($C::LIBFPTR_PARAM_DATA_TYPE, $C::LIBFPTR_DT_PAYMENT_SUM)
        $fptr.setParam($C::LIBFPTR_PARAM_RECEIPT_TYPE, $receiptType)
        $fptr.setParam($C::LIBFPTR_PARAM_PAYMENT_TYPE, $paymentType)
        if ($fptr.queryData() -lt 0) { return 0.0 }
        return $fptr.getParamDouble($C::LIBFPTR_PARAM_SUM)
    }

    $cash = PaymentSum $C::LIBFPTR_RT_SELL $C::LIBFPTR_PT_CASH
    $cashless = PaymentSum $C::LIBFPTR_RT_SELL $C::LIBFPTR_PT_ELECTRONICALLY
    # Возврат копится своей строкой, а не вычитается из выручки: «продали 0»
    # и «продали 1000, вернули 1000» обязаны различаться.
    $refunds = (PaymentSum $C::LIBFPTR_RT_SELL_RETURN $C::LIBFPTR_PT_CASH) +
               (PaymentSum $C::LIBFPTR_RT_SELL_RETURN $C::LIBFPTR_PT_ELECTRONICALLY)

    $fptr.setParam($C::LIBFPTR_PARAM_DATA_TYPE, $C::LIBFPTR_DT_RECEIPT_COUNT)
    $receipts = 0
    if ($fptr.queryData() -ge 0) {
        $receipts = $fptr.getParamInt($C::LIBFPTR_PARAM_DOCUMENTS_COUNT)
    }

    # Сам отчёт. После него счётчики уже недостоверны.
    $GenericFail = 5
    $fptr.setParam($C::LIBFPTR_PARAM_REPORT_TYPE, $C::@@REPORT@@)
    $r = $fptr.report()
    Check $r "Снятие отчёта"
    $GenericFail = 1

    $fptr.setParam($C::LIBFPTR_PARAM_DATA_TYPE, $C::LIBFPTR_DT_STATUS)
    $documentNumber = 0
    if ($fptr.queryData() -ge 0) {
        $documentNumber = $fptr.getParamInt($C::LIBFPTR_PARAM_DOCUMENT_NUMBER)
    }

    function Kop($value) {
        return [long][Math]::Round([double]$value * 100, 0, [MidpointRounding]::AwayFromZero)
    }

    [Console]::WriteLine((@{
        'shiftNumber' = $shiftNumber
        'documentNumber' = $documentNumber
        'receipts' = $receipts
        'cashTotal' = (Kop $cash)
        'cashlessTotal' = (Kop $cashless)
        'refundsTotal' = (Kop $refunds)
    } | ConvertTo-Json -Compress))
"#,
        );

        let body = body
            .replace("@@CASHIER@@", &ps_quote(cashier))
            .replace("@@REPORT@@", report_type);

        let payload = self.run(&body).map_err(Failure::into_fiscal)?;
        Self::parse_json(&payload)
    }
}

impl FiscalDevice for AtolDevice {
    fn status(&mut self) -> Result<DeviceStatus, FiscalError> {
        let mut body = String::from(Self::shift_state_body());
        body.push_str(
            r#"
    $fptr.setParam($C::LIBFPTR_PARAM_DATA_TYPE, $C::LIBFPTR_DT_STATUS)
    $r = $fptr.queryData()
    Check $r "Статус ККТ"
    $documentNumber = $fptr.getParamInt($C::LIBFPTR_PARAM_DOCUMENT_NUMBER)

    [Console]::WriteLine((@{
        'connected' = $true
        'shiftOpen' = ($shiftState -ne $C::LIBFPTR_SS_CLOSED)
        'shiftNumber' = $shiftNumber
        'shiftExpired' = ($shiftState -eq $C::LIBFPTR_SS_EXPIRED)
        'lastDocumentNumber' = $documentNumber
    } | ConvertTo-Json -Compress))
"#,
        );

        let payload = self.run(&body).map_err(Failure::into_fiscal)?;
        Self::parse_json(&payload)
    }

    fn open_shift(&mut self, cashier: &str) -> Result<i64, FiscalError> {
        let mut body = String::from(Self::shift_state_body());
        body.push_str(
            r#"
    if ($shiftState -eq $C::LIBFPTR_SS_OPENED) { Fail 4 "Смена в ККТ уже открыта" }
    # Просроченную смену открывать нечем — её сперва закрывают Z-отчётом.
    if ($shiftState -eq $C::LIBFPTR_SS_EXPIRED) { Fail 3 "Смена идёт больше 24 часов" }

    $fptr.setParam(1021, '@@CASHIER@@')
    $r = $fptr.operatorLogin()
    Check $r "Регистрация кассира"

    # Открытие смены — фискальный документ, обрыв на нём тоже неизвестность.
    $GenericFail = 5
    $r = $fptr.openShift()
    Check $r "Открытие смены"
    $GenericFail = 1

    $fptr.setParam($C::LIBFPTR_PARAM_DATA_TYPE, $C::LIBFPTR_DT_SHIFT_STATE)
    $r = $fptr.queryData()
    Check $r "Номер смены"
    [Console]::WriteLine("SHIFT " + $fptr.getParamInt($C::LIBFPTR_PARAM_SHIFT_NUMBER))
"#,
        );

        let body = body.replace("@@CASHIER@@", &ps_quote(cashier));
        let payload = self.run(&body).map_err(Failure::into_fiscal)?;

        /*
         * По метке, а не по «последней непустой строке»: методы ДТО возвращают
         * коды, и невыброшенный возврат уезжает в stdout сам. Разбор
         * по позиции строки ломался бы от каждой такой протечки.
         */
        payload
            .lines()
            .map(str::trim)
            .find_map(|line| line.strip_prefix(SHIFT_MARK))
            .and_then(|value| value.trim().parse::<i64>().ok())
            .ok_or_else(|| FiscalError::DeviceError(format!("Номер смены не разобран: {payload}")))
    }

    fn close_shift(&mut self, cashier: &str) -> Result<ZReport, FiscalError> {
        self.report("LIBFPTR_RT_CLOSE_SHIFT", cashier)
    }

    fn x_report(&mut self) -> Result<ZReport, FiscalError> {
        /*
         * X-отчёт фискальным документом не является и кассира в ФФД
         * не требует, но `operatorLogin` в общем теле отчёта стоит до снятия:
         * ККТ с включённым требованием кассира откажет и на X-отчёте.
         */
        self.report("LIBFPTR_RT_X", "Кассир")
    }

    fn register(&mut self, request: &ReceiptRequest) -> Result<FiscalReceipt, FiscalError> {
        // Несведённый чек дешевле поймать здесь, чем получить отказ ФН
        // посреди расчёта гостя.
        super::validate(request)?;

        let receipt_type = match request.kind {
            ReceiptKind::Sale => "LIBFPTR_RT_SELL",
            ReceiptKind::Refund => "LIBFPTR_RT_SELL_RETURN",
        };

        let mut body = String::from(Self::shift_state_body());
        body.push_str(
            r#"
    if ($shiftState -eq $C::LIBFPTR_SS_CLOSED) { Fail 2 "Смена в ККТ закрыта" }
    if ($shiftState -eq $C::LIBFPTR_SS_EXPIRED) { Fail 3 "Смена идёт больше 24 часов" }

    # Базовый номер ФД. Печатается ДО чека и остаётся в stdout даже при
    # отказе — по нему восстановление отличит наш документ от чужого.
    $fptr.setParam($C::LIBFPTR_PARAM_DATA_TYPE, $C::LIBFPTR_DT_STATUS)
    $r = $fptr.queryData()
    Check $r "Статус ККТ"
    [Console]::WriteLine("BASELINE " + $fptr.getParamInt($C::LIBFPTR_PARAM_DOCUMENT_NUMBER))

    $fptr.setParam(1021, '@@CASHIER@@')
    $r = $fptr.operatorLogin()
    Check $r "Регистрация кассира"

    $fptr.setParam($C::LIBFPTR_PARAM_RECEIPT_TYPE, $C::@@RECEIPT_TYPE@@)
    $fptr.setParam($C::LIBFPTR_PARAM_TAX_MODE, $C::@@TAX_SYSTEM@@)
    $r = $fptr.openReceipt()
    Check $r "Открытие чека"
@@LINES@@
    # Дальше начинается зона неизвестности: закрытие чека — это запись в ФН,
    # и обрыв ровно здесь оставляет документ записанным без ответа. Считать
    # такое отказом — пробить второй чек на те же деньги.
    $GenericFail = 5
    $closeRes = $fptr.closeReceipt()
    if ($closeRes -lt 0) {
        # Единственный штатный способ узнать, записался документ или нет.
        if ($fptr.checkDocumentClosed() -lt 0) {
            Fail 5 "Чек не закрыт, состояние документа неизвестно: $($fptr.errorDescription())"
        }
        if (-not $fptr.getParamBool($C::LIBFPTR_PARAM_DOCUMENT_CLOSED)) {
            # Документа нет — открытый чек надо снять, иначе ККТ останется
            # занятой и следующий расчёт не начнётся.
            $fptr.cancelReceipt() | Out-Null
            Fail 4 "ККТ отклонила чек: $($fptr.errorDescription())"
        }
        # Документ записан, но лента не допечатана — это не отказ.
        if (-not $fptr.getParamBool($C::LIBFPTR_PARAM_DOCUMENT_PRINTED)) {
            $fptr.continuePrint() | Out-Null
        }
    }

    $fptr.setParam($C::LIBFPTR_PARAM_FN_DATA_TYPE, $C::LIBFPTR_FNDT_LAST_RECEIPT)
    $r = $fptr.fnQueryData()
    Check $r "Чтение записанного чека"

    # Фискальный признак у разных ФФД приезжает то строкой, то числом.
    $sign = $fptr.getParamString($C::LIBFPTR_PARAM_FISCAL_SIGN)
    if ([string]::IsNullOrWhiteSpace($sign)) {
        $sign = [string]$fptr.getParamInt($C::LIBFPTR_PARAM_FISCAL_SIGN)
    }

    [Console]::WriteLine((@{
        'documentNumber' = $fptr.getParamInt($C::LIBFPTR_PARAM_DOCUMENT_NUMBER)
        'fiscalSign' = $sign
        'shiftNumber' = $shiftNumber
        'receiptNumber' = $fptr.getParamInt($C::LIBFPTR_PARAM_RECEIPT_NUMBER)
        'total' = [long][Math]::Round($fptr.getParamDouble($C::LIBFPTR_PARAM_RECEIPT_SUM) * 100, 0, [MidpointRounding]::AwayFromZero)
        'clientId' = '@@CLIENT_ID@@'
    } | ConvertTo-Json -Compress))
"#,
        );

        let body = body
            .replace("@@CASHIER@@", &ps_quote(&request.cashier_name))
            .replace("@@RECEIPT_TYPE@@", receipt_type)
            .replace("@@TAX_SYSTEM@@", tax_system_constant(request.tax_system))
            .replace("@@CLIENT_ID@@", &ps_quote(&request.client_id))
            .replace("@@LINES@@", &Self::receipt_body(request));

        match self.run(&body) {
            Ok(payload) => {
                self.pending = None;
                Self::parse_json(&payload)
            }
            Err(failure) => {
                /*
                 * Заметку для восстановления оставляем только на неизвестном
                 * исходе. На отказе и обрыве связи документа заведомо нет,
                 * и `last_receipt` не должен принять за наш чужой чек,
                 * оставшийся в ФН с прошлой продажи.
                 */
                self.pending = if failure.code == exit_code::UNKNOWN {
                    parse_baseline(&failure.stdout).map(|document_before| Pending {
                        client_id: request.client_id.clone(),
                        document_before,
                    })
                } else {
                    None
                };

                Err(failure.into_fiscal())
            }
        }
    }

    fn last_receipt(&mut self) -> Result<Option<FiscalReceipt>, FiscalError> {
        let body = r#"
    $fptr.setParam($C::LIBFPTR_PARAM_DATA_TYPE, $C::LIBFPTR_DT_SHIFT_STATE)
    $r = $fptr.queryData()
    Check $r "Состояние смены"
    $shiftNumber = $fptr.getParamInt($C::LIBFPTR_PARAM_SHIFT_NUMBER)

    $fptr.setParam($C::LIBFPTR_PARAM_FN_DATA_TYPE, $C::LIBFPTR_FNDT_LAST_RECEIPT)
    $r = $fptr.fnQueryData()
    Check $r "Чтение последнего чека"

    $sign = $fptr.getParamString($C::LIBFPTR_PARAM_FISCAL_SIGN)
    if ([string]::IsNullOrWhiteSpace($sign)) {
        $sign = [string]$fptr.getParamInt($C::LIBFPTR_PARAM_FISCAL_SIGN)
    }

    [Console]::WriteLine((@{
        'documentNumber' = $fptr.getParamInt($C::LIBFPTR_PARAM_DOCUMENT_NUMBER)
        'fiscalSign' = $sign
        'shiftNumber' = $shiftNumber
        'receiptNumber' = $fptr.getParamInt($C::LIBFPTR_PARAM_RECEIPT_NUMBER)
        'total' = [long][Math]::Round($fptr.getParamDouble($C::LIBFPTR_PARAM_RECEIPT_SUM) * 100, 0, [MidpointRounding]::AwayFromZero)
        'clientId' = ''
    } | ConvertTo-Json -Compress))
"#;

        let payload = self.run(body).map_err(Failure::into_fiscal)?;
        let mut receipt: FiscalReceipt = Self::parse_json(&payload)?;

        /*
         * `client_id` в ФН не хранится: своего поля под него там нет. Поэтому
         * «наш ли это документ» решается номером ФД — документ, появившийся
         * после начала нашей попытки, наш и есть.
         *
         * Не совпало — `client_id` остаётся пустым, и `register_with_recovery`
         * честно скажет «чек не зарегистрирован», а не подставит чужой.
         */
        if let Some(pending) = &self.pending {
            if receipt.document_number > pending.document_before {
                receipt.client_id = pending.client_id.clone();
            }
        }

        Ok(Some(receipt))
    }

    fn print_test_receipt(&mut self) -> Result<(), String> {
        self.print_lines(&[
            "================================".to_string(),
            "   RestoPOS — СВЯЗЬ С ККТ ЕСТЬ".to_string(),
            "================================".to_string(),
        ])
    }

    fn print_image(&mut self, path: &str, scale_percent: u32) -> Result<(), String> {
        // Файл проверяем здесь, а не в драйвере: на отсутствующую картинку ДТО
        // отвечает кодом ошибки, по которому кассиру не понять, что дело в пути,
        // а не в кассе.
        let file = std::path::Path::new(path)
            .canonicalize()
            .map_err(|e| format!("Картинку {path} не открыть: {e}"))?;
        let file = file.to_string_lossy().into_owned();
        // `canonicalize` под Windows отдаёт путь с префиксом `\\?\`, которого
        // ДТО не понимает.
        let file = file.strip_prefix(r"\\?\").unwrap_or(&file);
        let file = ps_quote(file);

        // Ноль процентов — пустая лента, больше ста ДТО всё равно не растянет.
        let scale = scale_percent.clamp(1, 100);

        let body = r#"
    $fptr.beginNonFiscalDocument() | Out-Null
    # Реквизиты внизу (ИНН, дата, шифрование) для картинки лишние.
    $fptr.setParam($C::LIBFPTR_PARAM_PRINT_FOOTER, [bool]$false)
    $fptr.setParam($C::LIBFPTR_PARAM_FILENAME, '@@FILE@@')
    $fptr.setParam($C::LIBFPTR_PARAM_ALIGNMENT, $C::LIBFPTR_ALIGNMENT_CENTER)
    $fptr.setParam($C::LIBFPTR_PARAM_SCALE_PERCENT, @@SCALE@@)

    if ($fptr.printPicture() -lt 0) {
        $err = $fptr.errorDescription()
        # Документ закрываем и на отказе: открытый нефискальный документ
        # держит принтер и не даёт напечатать следующий.
        $fptr.endNonFiscalDocument() | Out-Null
        Fail 4 "Картинка не напечатана: $err"
    }

    $fptr.endNonFiscalDocument() | Out-Null
"#
        .replace("@@FILE@@", &file)
        .replace("@@SCALE@@", &scale.to_string());

        self.run(&body).map(|_| ()).map_err(|failure| failure.message)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn копейки_переводятся_в_рубли_без_плавающей_точки() {
        assert_eq!(rubles(42000), "420.00");
        assert_eq!(rubles(7), "0.07");
        assert_eq!(rubles(100), "1.00");
        assert_eq!(rubles(-250), "-2.50");
    }

    #[test]
    fn количество_печатается_тысячными() {
        assert_eq!(quantity(1000), "1.000");
        assert_eq!(quantity(333), "0.333");
        assert_eq!(quantity(2500), "2.500");
    }

    #[test]
    fn апостроф_в_названии_блюда_не_рвёт_скрипт() {
        // Одинарная кавычка внутри `'...'` PowerShell закрывает строку:
        // неэкранированная «Маргарита» превратила бы остаток чека в мусор.
        assert_eq!(ps_quote("Пицца 'Маргарита'"), "Пицца ''Маргарита''");
    }

    #[test]
    fn стоимость_строки_уходит_в_чек_явно() {
        // Тег 1043 обязателен из-за скидок: перемножение цены на количество
        // разошлось бы с суммой платежей, и ФН отклонил бы документ.
        let item = ReceiptItem {
            name: "доля".into(),
            quantity_milli: 333,
            price: 42000,
            vat: VatRate::Vat20,
            line_total: Some(13900),
        };

        let body = AtolDevice::position_body(&item);
        assert!(body.contains("LIBFPTR_PARAM_POSITION_SUM, 139.00"));
        assert!(body.contains("LIBFPTR_PARAM_PRICE, 420.00"));
        assert!(body.contains("LIBFPTR_PARAM_QUANTITY, 0.333"));
    }

    #[test]
    fn название_блюда_не_подставляется_в_двойные_кавычки() {
        /*
         * `ps_quote` умеет экранировать только апостроф, и это верно для
         * одинарных кавычек PowerShell. Внутри двойных он бессилен: там
         * раскрывается `$` и обрывает строку `"`. Поэтому название обязано
         * попадать только в `'...'` — и в сам чек, и в текст ошибки.
         */
        let item = ReceiptItem {
            name: "Кофе \"по-турецки\" за $5".into(),
            quantity_milli: 1000,
            price: 10000,
            vat: VatRate::Vat20,
            line_total: None,
        };

        let body = AtolDevice::position_body(&item);
        for line in body.lines().filter(|line| line.contains("Кофе")) {
            let quote = line.find('\'').expect("название вне одинарных кавычек");
            assert!(
                !line[..quote].contains('"'),
                "название уехало в двойные кавычки: {line}"
            );
        }
    }

    #[test]
    fn базовый_номер_фд_вычитается_из_вывода_скрипта() {
        assert_eq!(parse_baseline("BASELINE 417\n{\"a\":1}"), Some(417));
        assert_eq!(parse_baseline("{\"a\":1}"), None);
    }
}

/*
 * Прогон по живой ККТ.
 *
 * Под `#[ignore]`: обычный `cargo test` железа не касается, а на машине без
 * ККТ эти тесты просто нечем выполнить. Запускаются руками, по одному:
 *
 *   cargo test --lib live::статус -- --ignored --nocapture
 *
 * Смысл держать их в репозитории, а не гонять разовыми скриптами, ровно
 * один: проверяется тот же код, который выполняет касса. Переписанный
 * вручную PowerShell проверяет переписанный вручную PowerShell.
 */
#[cfg(test)]
mod live {
    use super::super::{register_with_recovery, ReceiptPayment, RegistrationOutcome};
    use super::*;

    /// Адрес тот же, что в `fiscal/commands.rs`.
    fn устройство() -> AtolDevice {
        AtolDevice::new("192.168.1.223", 5555)
    }

    #[test]
    #[ignore]
    fn статус() {
        let status = устройство().status().expect("статус не прочитан");
        println!("{status:#?}");
    }

    #[test]
    #[ignore]
    fn открыть_смену() {
        let number = устройство()
            .open_shift("Мария Дёмина")
            .expect("смена не открыта");
        println!("смена в ККТ: {number}");
    }

    #[test]
    #[ignore]
    fn x_отчёт() {
        let report = устройство().x_report().expect("X-отчёт не снят");
        println!("{report:#?}");
    }

    #[test]
    #[ignore]
    fn пробить_чек() {
        let request = ReceiptRequest {
            kind: ReceiptKind::Sale,
            items: vec![ReceiptItem {
                name: "Эспрессо".into(),
                quantity_milli: 1000,
                price: 100,
                vat: VatRate::Vat20,
                line_total: None,
            }],
            payments: vec![ReceiptPayment {
                kind: PaymentKind::Cash,
                amount: 100,
            }],
            tax_system: TaxSystem::UsnIncome,
            cashier_name: "Мария Дёмина".into(),
            order_number: 1,
            client_id: "live-test-1".into(),
        };

        let mut device = устройство();
        match register_with_recovery(&mut device, &request) {
            RegistrationOutcome::Registered { receipt, recovered } => {
                println!("чек пробит (восстановлен: {recovered}):\n{receipt:#?}");
            }
            RegistrationOutcome::Failed { error } => panic!("чек не пробит: {error}"),
            RegistrationOutcome::NeedsAttention { error } => {
                panic!("нужен человек: {error}")
            }
        }
    }

    /// Печать нефискального документа. От состояния ФН не зависит —
    /// проверяет саму обвязку связи после переписывания.
    #[test]
    #[ignore]
    fn тестовая_печать() {
        устройство().print_test_receipt().expect("не напечатано");
        println!("лента вышла");
    }

    #[test]
    #[ignore]
    fn закрыть_смену() {
        let report = устройство()
            .close_shift("Мария Дёмина")
            .expect("смена не закрыта");
        println!("{report:#?}");
    }
}
