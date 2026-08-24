//! Стенд: фискальная логика эмулятора и печать на живой ККТ.
//!
//! # Зачем
//!
//! Фискальный накопитель стоит денег и живёт ограниченное время, а отлаживать
//! кассу надо каждый день. Без ФН живая ККТ фискальные команды выполнять
//! отказывается — но **нефискальный документ она печатает всегда**, потому
//! что накопитель в нём не участвует. Отсюда и разделение: смену, чек, номера
//! документов и Z-отчёт считает `Emulator`, а бумага выходит настоящая,
//! из настоящего принтера, с настоящей отрезкой.
//!
//! Так проверяется то, что на эмуляторе в одиночку не видно: ширина ленты,
//! переносы длинных названий, кириллица, порядок строк — и то, что кассир
//! вообще получает на руки.
//!
//! # Чего стенд НЕ проверяет
//!
//! Всё, что делает ФН: подпись документа, передачу в ОФД, реальные счётчики
//! смены, отказы накопителя. Номер ФД и фискальный признак на ленте —
//! **выдуманные эмулятором**, поэтому лента и помечена явно.
//!
//! # Почему это не может попасть в прод
//!
//! Модуль целиком под `debug_assertions`, как и `fiscal_simulate`. Касса,
//! которая молча пробила чек в эмулятор и напечатала правдоподобную ленту, —
//! худший из возможных исходов: продажа есть, документа нет, а выглядит всё
//! нормально. Такой возможности в релизе не должно существовать физически,
//! а не быть спрятанной за флагом.

use super::atol::AtolDevice;
use super::emulator::Emulator;
use super::{
    DeviceStatus, FiscalDevice, FiscalError, FiscalReceipt, Kopecks, PaymentKind, ReceiptKind,
    ReceiptRequest, ZReport,
};

/// Ширина, если спросить ККТ не удалось.
///
/// Узкая намеренно: на широкой ленте текст, свёрстанный под 32, выглядит
/// прижатым влево, а текст под 64 на узкой — рвётся и теряет суммы.
/// Ошибиться в меньшую сторону дешевле.
const FALLBACK_WIDTH: usize = 32;

const MARK: &str = "*** НЕ ФИСКАЛЬНЫЙ ДОКУМЕНТ ***";

pub struct BenchDevice {
    /// Считает смену, номера документов и итоги.
    fiscal: Emulator,
    /// Печатает. Фискальные методы этого устройства не зовутся никогда.
    printer: AtolDevice,
    /// Ширина ленты в символах. Спрашивается у ККТ один раз: смена ленты
    /// без перезапуска кассы — не тот случай, ради которого стоит ходить
    /// в устройство перед каждой печатью.
    width: Option<usize>,
}

impl BenchDevice {
    pub fn new(ip: &str, port: u16) -> Self {
        Self {
            fiscal: Emulator::new(),
            printer: AtolDevice::new(ip, port),
            width: None,
        }
    }

    fn width(&mut self) -> usize {
        if let Some(width) = self.width {
            return width;
        }

        let width = match self.printer.line_length() {
            Ok(width) => width,
            Err(error) => {
                eprintln!("[СТЕНД] ширина ленты не прочитана ({error}), беру {FALLBACK_WIDTH}");
                FALLBACK_WIDTH
            }
        };

        self.width = Some(width);
        width
    }

    /// Строка в две колонки: слева текст, справа сумма.
    ///
    /// Считаем `chars`, а не байты: в UTF-8 кириллица занимает по два байта,
    /// и вёрстка по длине в байтах разъехалась бы ровно на русских названиях.
    fn columns(left: &str, right: &str, width: usize) -> String {
        let used = left.chars().count() + right.chars().count();
        if used >= width {
            // Не влезло — сумма важнее красоты, переносим её на свою строку
            // прижатой вправо, а не обрезаем строку по ширине.
            return format!("{left}\n{}", Self::align_right(right, width));
        }
        format!("{left}{}{right}", " ".repeat(width - used))
    }

    fn align_right(text: &str, width: usize) -> String {
        let len = text.chars().count();
        if len >= width {
            return text.to_string();
        }
        format!("{}{text}", " ".repeat(width - len))
    }

    fn center(text: &str, width: usize) -> String {
        let len = text.chars().count();
        if len >= width {
            return text.to_string();
        }
        format!("{}{text}", " ".repeat((width - len) / 2))
    }

    /// Перенос длинного названия по словам.
    ///
    /// Драйвер обрезал бы его по краю ленты молча, и кассир увидел бы
    /// «Пицца Четыре сы» без остатка строки.
    fn wrap(text: &str, width: usize) -> Vec<String> {
        let mut lines = Vec::new();
        let mut current = String::new();

        for word in text.split_whitespace() {
            let addition = if current.is_empty() {
                word.chars().count()
            } else {
                current.chars().count() + 1 + word.chars().count()
            };

            if addition > width && !current.is_empty() {
                lines.push(std::mem::take(&mut current));
            }

            if !current.is_empty() {
                current.push(' ');
            }
            current.push_str(word);

            // Слово длиннее ленты целиком: режем по символам, иначе оно
            // утащит за собой всю строку.
            while current.chars().count() > width {
                let head: String = current.chars().take(width).collect();
                let tail: String = current.chars().skip(width).collect();
                lines.push(head);
                current = tail;
            }
        }

        if !current.is_empty() {
            lines.push(current);
        }
        if lines.is_empty() {
            lines.push(String::new());
        }

        lines
    }

    fn money(amount: Kopecks) -> String {
        let sign = if amount < 0 { "-" } else { "" };
        let abs = amount.abs();
        format!("{}{}.{:02}", sign, abs / 100, abs % 100)
    }

    fn quantity(milli: i64) -> String {
        if milli % 1000 == 0 {
            return (milli / 1000).to_string();
        }
        format!("{}.{:03}", milli / 1000, (milli % 1000).abs())
    }

    /// Раскладка чека по строкам ленты.
    fn render(request: &ReceiptRequest, receipt: &FiscalReceipt, width: usize) -> Vec<String> {
        let mut lines = Vec::new();
        let rule = "-".repeat(width);

        /*
         * Пометка стоит первой и повторяется в конце намеренно. Лента,
         * оторванная посередине, не должна выглядеть как настоящий чек:
         * по ней рассчитывают гостя, и спутать её с фискальной нельзя.
         */
        lines.push(Self::center(MARK, width));
        lines.push(Self::center("СТЕНД RestoPOS, ФН НЕ УЧАСТВУЕТ", width));
        lines.push(rule.clone());

        lines.push(Self::center(
            match request.kind {
                ReceiptKind::Sale => "ПРИХОД",
                ReceiptKind::Refund => "ВОЗВРАТ ПРИХОДА",
            },
            width,
        ));
        lines.push(Self::columns(
            "Заказ",
            &request.order_number.to_string(),
            width,
        ));
        lines.push(rule.clone());

        for item in &request.items {
            lines.extend(Self::wrap(&item.name, width));
            lines.push(Self::columns(
                &format!(
                    "  {} x {}",
                    Self::quantity(item.quantity_milli),
                    Self::money(item.price)
                ),
                &Self::money(item.total()),
                width,
            ));
        }

        lines.push(rule.clone());
        lines.push(Self::columns("ИТОГ", &Self::money(receipt.total), width));

        for payment in &request.payments {
            let name = match payment.kind {
                PaymentKind::Cash => "Наличными",
                PaymentKind::Cashless => "Картой",
            };
            lines.push(Self::columns(name, &Self::money(payment.amount), width));
        }

        lines.push(rule.clone());
        lines.push(Self::columns(
            "Смена",
            &receipt.shift_number.to_string(),
            width,
        ));
        lines.push(Self::columns("Чек", &receipt.receipt_number.to_string(), width));
        // Номер и признак выдуманы эмулятором — про это и сказано на ленте.
        lines.push(Self::columns(
            "ФД",
            &receipt.document_number.to_string(),
            width,
        ));
        lines.push(Self::columns("ФП", &receipt.fiscal_sign, width));
        lines.push(Self::columns("Кассир", &request.cashier_name, width));
        lines.push(rule);
        lines.push(Self::center("Номер ФД и ФП выданы эмулятором.", width));
        lines.push(Self::center("В ФНС документ НЕ передан.", width));
        lines.push(Self::center(MARK, width));

        lines
    }

    /// Раскладка отчёта.
    fn render_report(title: &str, report: &ZReport, width: usize) -> Vec<String> {
        let rule = "-".repeat(width);
        vec![
            Self::center(MARK, width),
            Self::center(&format!("СТЕНД: {title}"), width),
            rule.clone(),
            Self::columns("Смена", &report.shift_number.to_string(), width),
            Self::columns("Чеков", &report.receipts.to_string(), width),
            Self::columns("Наличными", &Self::money(report.cash_total), width),
            Self::columns("Картой", &Self::money(report.cashless_total), width),
            // Возврат отдельной строкой, а не вычетом из выручки: «продали 0»
            // и «продали 1000, вернули 1000» обязаны различаться.
            Self::columns("Возвраты", &Self::money(report.refunds_total), width),
            rule,
            Self::center(MARK, width),
        ]
    }

    /// Печать, которая не может провалить операцию.
    ///
    /// Документ у эмулятора уже записан, и вернуть отсюда ошибку значило бы
    /// заставить `checkout` откатывать деньги из-за кончившейся бумаги.
    /// Отказ печати — это отказ печати, а не отказ регистрации.
    fn print_quietly(&self, lines: &[String]) {
        /*
         * `columns` при нехватке места отдаёт две строки одним куском —
         * разворачиваем, иначе перевод строки уехал бы в драйвер внутри
         * одной команды печати и лента разъехалась бы непредсказуемо.
         */
        let flat: Vec<String> = lines
            .iter()
            .flat_map(|line| line.split('\n').map(str::to_string))
            .collect();

        if let Err(error) = self.printer.print_lines(&flat) {
            eprintln!("[СТЕНД] лента не напечатана: {error}");
        }
    }
}

impl FiscalDevice for BenchDevice {
    fn status(&mut self) -> Result<DeviceStatus, FiscalError> {
        self.fiscal.status()
    }

    fn open_shift(&mut self, cashier: &str) -> Result<i64, FiscalError> {
        let number = self.fiscal.open_shift(cashier)?;
        let width = self.width();
        self.print_quietly(&[
            Self::center(MARK, width),
            Self::center("СТЕНД: ОТКРЫТИЕ СМЕНЫ", width),
            "-".repeat(width),
            Self::columns("Смена", &number.to_string(), width),
            Self::columns("Кассир", cashier, width),
        ]);
        Ok(number)
    }

    fn close_shift(&mut self, cashier: &str) -> Result<ZReport, FiscalError> {
        let report = self.fiscal.close_shift(cashier)?;
        let width = self.width();
        self.print_quietly(&Self::render_report("Z-ОТЧЁТ", &report, width));
        Ok(report)
    }

    fn x_report(&mut self) -> Result<ZReport, FiscalError> {
        let report = self.fiscal.x_report()?;
        let width = self.width();
        self.print_quietly(&Self::render_report("X-ОТЧЁТ", &report, width));
        Ok(report)
    }

    fn register(&mut self, request: &ReceiptRequest) -> Result<FiscalReceipt, FiscalError> {
        let receipt = self.fiscal.register(request)?;
        let width = self.width();
        self.print_quietly(&Self::render(request, &receipt, width));
        Ok(receipt)
    }

    fn last_receipt(&mut self) -> Result<Option<FiscalReceipt>, FiscalError> {
        self.fiscal.last_receipt()
    }

    /// Сценарии отказов остаются доступны: за трейтом стоит тот же эмулятор,
    /// и «потеряй следующий ответ» на стенде работает как обычно.
    fn as_emulator(&mut self) -> Option<&mut Emulator> {
        Some(&mut self.fiscal)
    }

    fn print_test_receipt(&mut self) -> Result<(), String> {
        self.printer.print_test_receipt()
    }

    fn print_image(&mut self, path: &str, scale_percent: u32) -> Result<(), String> {
        self.printer.print_image(path, scale_percent)
    }
}

#[cfg(test)]
mod tests {
    use super::super::{ReceiptItem, ReceiptPayment, TaxSystem, VatRate};
    use super::*;

    /// Фактическая ширина ленты FPrint-22 на 80 мм — проверено запросом
    /// `LIBFPTR_DT_RECEIPT_LINE_LENGTH` к живой ККТ.
    const ЛЕНТА: usize = 64;

    fn чек() -> ReceiptRequest {
        ReceiptRequest {
            kind: ReceiptKind::Sale,
            items: vec![ReceiptItem {
                name: "Чизкейк Нью-Йорк".into(),
                quantity_milli: 2000,
                price: 38000,
                vat: VatRate::Vat20,
                line_total: None,
            }],
            payments: vec![ReceiptPayment {
                kind: PaymentKind::Cash,
                amount: 76000,
            }],
            tax_system: TaxSystem::UsnIncome,
            cashier_name: "Мария Дёмина".into(),
            order_number: 12,
            client_id: "bench-1".into(),
        }
    }

    /// Прогон по живой ККТ: смена, чек и Z-отчёт выходят на настоящей ленте.
    /// ФН не участвует, поэтому работает и на кассе без накопителя.
    ///
    ///   cargo test --lib bench::tests::живая_лента -- --ignored --nocapture
    #[test]
    #[ignore]
    fn живая_лента() {
        let mut device = BenchDevice::new("192.168.1.223", 5555);
        println!("ширина ленты: {}", device.width());

        let number = device.open_shift("Мария Дёмина").expect("смена");
        println!("смена на стенде: {number}");

        let receipt = device.register(&чек()).expect("чек");
        println!("{receipt:#?}");

        let report = device.close_shift("Мария Дёмина").expect("Z-отчёт");
        println!("{report:#?}");
    }

    #[test]
    fn колонки_считаются_в_символах_а_не_в_байтах() {
        // Кириллица в UTF-8 занимает два байта: вёрстка по длине в байтах
        // укоротила бы каждую русскую строку вдвое.
        let line = BenchDevice::columns("Наличными", "760.00", ЛЕНТА);
        assert_eq!(line.chars().count(), ЛЕНТА);
        assert!(line.starts_with("Наличными"));
        assert!(line.ends_with("760.00"));
    }

    #[test]
    fn сумма_не_теряется_когда_строка_не_влезла() {
        // Обрезка по ширине съела бы именно сумму — она справа.
        let line = BenchDevice::columns(&"я".repeat(70), "1.00", ЛЕНТА);
        assert!(line.contains("1.00"));
        assert!(line.contains('\n'), "сумма обязана уйти на свою строку");
    }

    #[test]
    fn длинное_название_переносится_по_словам() {
        let lines = BenchDevice::wrap("Пицца Четыре сыра на тонком тесте", 16);
        assert!(lines.len() > 1);
        for line in &lines {
            assert!(line.chars().count() <= 16, "строка шире ленты: {line}");
        }
        // Слова не должны потеряться при переносе.
        assert!(lines.join(" ").contains("тесте"));
    }

    #[test]
    fn слово_длиннее_ленты_режется_а_не_теряется() {
        let lines = BenchDevice::wrap(&"я".repeat(40), 16);
        assert_eq!(lines.iter().map(|l| l.chars().count()).sum::<usize>(), 40);
        for line in &lines {
            assert!(line.chars().count() <= 16);
        }
    }

    #[test]
    fn ни_одна_строка_чека_не_шире_ленты() {
        let request = чек();
        let mut device = BenchDevice::new("127.0.0.1", 5555);
        device.open_shift("Мария Дёмина").unwrap();
        let receipt = device.fiscal.register(&request).unwrap();

        for line in BenchDevice::render(&request, &receipt, ЛЕНТА) {
            for part in line.split('\n') {
                assert!(
                    part.chars().count() <= ЛЕНТА,
                    "строка шире ленты ({}): {part}",
                    part.chars().count()
                );
            }
        }
    }

    #[test]
    fn лента_помечена_нефискальной_с_обеих_сторон() {
        let request = чек();
        let mut device = BenchDevice::new("127.0.0.1", 5555);
        // Смена нужна: без неё эмулятор чек не примет — как и живая ККТ.
        device.open_shift("Мария Дёмина").unwrap();
        let receipt = device.fiscal.register(&request).unwrap();

        let lines = BenchDevice::render(&request, &receipt, ЛЕНТА);
        assert!(lines.first().unwrap().contains("НЕ ФИСКАЛЬНЫЙ"));
        assert!(lines.last().unwrap().contains("НЕ ФИСКАЛЬНЫЙ"));
        assert!(lines.iter().any(|line| line.contains("НЕ передан")));
    }

    #[test]
    fn итог_на_ленте_совпадает_с_чеком() {
        let request = чек();
        let mut device = BenchDevice::new("127.0.0.1", 5555);
        device.open_shift("Мария Дёмина").unwrap();
        let receipt = device.fiscal.register(&request).unwrap();

        let lines = BenchDevice::render(&request, &receipt, ЛЕНТА);
        // 2 порции по 380,00 — 760,00, и на ленте обязано стоять то же самое.
        assert!(lines.iter().any(|line| line.contains("760.00")));
        assert_eq!(receipt.total, 76000);
    }
}
