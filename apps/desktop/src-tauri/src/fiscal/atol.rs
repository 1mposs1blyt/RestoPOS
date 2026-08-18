use super::{DeviceStatus, FiscalDevice, FiscalError, FiscalReceipt, ReceiptRequest, ZReport};
use std::process::Command;

/// ДТО-10 ставится инсталлятором АТОЛ и лежит по фиксированному пути.
const DRIVER_DLL: &str = r"C:\Program Files\ATOL\Drivers10\KKT\bin\Atol.Drivers10.Fptr.dll";

pub struct AtolDevice {
    pub ip: String,
    pub port: u16,
}

impl AtolDevice {
    pub fn new(ip: &str, port: u16) -> Self {
        Self {
            ip: ip.to_string(),
            port,
        }
    }

    /// Выполнение команд драйвера с общей обвязкой: загрузка ДТО-10, настройки
    /// связи, открытие порта и гарантированное закрытие в `finally`.
    ///
    /// Обвязка одна на все операции намеренно. Скопированная в каждый метод,
    /// она разъедется на первой правке настроек связи, и симптом будет нелепый:
    /// тестовая печать идёт, картинка — нет.
    ///
    /// `body` вставляется в скрипт как есть, поэтому подставленные в него
    /// значения (пути, числа) обязан экранировать вызывающий.
    fn run_script(&self, body: &str) -> Result<(), String> {
        let script = format!(
            r#"
            $OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
            [Reflection.Assembly]::LoadFrom("{dll}") | Out-Null
            $fptr = New-Object Atol.Drivers10.Fptr.Fptr

            try {{
                $jsonConfig = @{{
                    "Port" = 1; # 1 = TCPIP
                    "IPAddress" = "{ip}";
                    "PortNumber" = {port}
                }} | ConvertTo-Json -Compress

                $fptr.setSettings($jsonConfig)
                $res = $fptr.open()
                if (-not $fptr.isOpened()) {{
                    $err = $fptr.errorDescription()
                    [Console]::Error.WriteLine("Код $($res): $($err)")
                    exit 1
                }}

{body}

            }} finally {{
                if ($fptr -ne $null -and $fptr.isOpened()) {{
                    $fptr.close()
                }}
            }}
            "#,
            dll = DRIVER_DLL,
            ip = self.ip,
            port = self.port,
        );

        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command", &script])
            .output()
            .map_err(|e| format!("Ошибка запуска PowerShell: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            Err(format!("Ошибка АТОЛ: {}", error_msg.trim()))
        }
    }
}

impl FiscalDevice for AtolDevice {
    fn status(&mut self) -> Result<DeviceStatus, FiscalError> {
        todo!("Реализация статуса ККТ")
    }

    fn open_shift(&mut self, _cashier: &str) -> Result<i64, FiscalError> {
        todo!("Реализация открытия смены")
    }

    fn close_shift(&mut self, _cashier: &str) -> Result<ZReport, FiscalError> {
        todo!("Реализация закрытия смены (Z-отчет)")
    }

    fn x_report(&mut self) -> Result<ZReport, FiscalError> {
        todo!("Реализация X-отчета")
    }

    fn register(&mut self, _request: &ReceiptRequest) -> Result<FiscalReceipt, FiscalError> {
        todo!("Реализация регистрации чека")
    }

    fn last_receipt(&mut self) -> Result<Option<FiscalReceipt>, FiscalError> {
        todo!("Реализация получения последнего чека")
    }

    fn print_test_receipt(&mut self) -> Result<(), String> {
        self.run_script(
            r#"
                # Звуковой сигнал
                $fptr.beep()

                # Открытие нефискального документа
                $fptr.beginNonFiscalDocument()

                # Печать тестовых строк
                
                $fptr.setParam([Atol.Drivers10.Fptr.Constants]::LIBFPTR_PARAM_TEXT, "================================================================================================================================")
                $fptr.printText()

                $fptr.setParam([Atol.Drivers10.Fptr.Constants]::LIBFPTR_PARAM_TEXT, "         RestoPOS POS SYSTEM - ТЕСТОВАЯ ПЕЧАТЬ УСПЕШНА!  ")
                $fptr.printText()

                $fptr.setParam([Atol.Drivers10.Fptr.Constants]::LIBFPTR_PARAM_TEXT, "       ТЕСТОВАЯ ПЕЧАТЬ УСПЕШНА! - ТЕСТОВАЯ ПЕЧАТЬ УСПЕШНА! ")
                $fptr.printText()

                $fptr.setParam([Atol.Drivers10.Fptr.Constants]::LIBFPTR_PARAM_TEXT, "================================================================================================================================")
                $fptr.printText()

                # Закрытие нефискального документа (выполняет прогон и отрезку)
                $fptr.endNonFiscalDocument()
            "#,
        )
    }

    fn print_image(&mut self, path: &str, scale_percent: u32) -> Result<(), String> {
        // Файл проверяем здесь, а не в драйвере: на отсутствующую картинку ДТО
        // отвечает кодом ошибки, по которому кассиру не понять, что дело в пути,
        // а не в кассе.
        let file = std::path::Path::new(path)
            .canonicalize()
            .map_err(|e| format!("Картинку {} не открыть: {}", path, e))?;
        let file = file.to_string_lossy().into_owned();
        // `canonicalize` под Windows отдаёт путь с префиксом `\\?\`, которого
        // ДТО не понимает.
        let file = file.strip_prefix(r"\\?\").unwrap_or(&file);
        // Путь уезжает в PowerShell строкой в одинарных кавычках: подстановки
        // `$` там нет, и экранировать надо только сам апостроф.
        let file = file.replace('\'', "''");

        // Ноль процентов — пустая лента, больше ста ДТО всё равно не растянет.
        let scale = scale_percent.clamp(1, 100);

        let body = format!(
            r#"
                $fptr.beginNonFiscalDocument()

                $fptr.setParam([Atol.Drivers10.Fptr.Constants]::LIBFPTR_PARAM_FILENAME, '{file}')
                $fptr.setParam([Atol.Drivers10.Fptr.Constants]::LIBFPTR_PARAM_ALIGNMENT, [Atol.Drivers10.Fptr.Constants]::LIBFPTR_ALIGNMENT_CENTER)
                $fptr.setParam([Atol.Drivers10.Fptr.Constants]::LIBFPTR_PARAM_SCALE_PERCENT, {scale})

                if ($fptr.printPicture() -lt 0) {{
                    $err = $fptr.errorDescription()
                    # Документ закрываем и на отказе: открытый нефискальный
                    # документ держит принтер и не даёт напечатать следующий.
                    $fptr.endNonFiscalDocument() | Out-Null
                    [Console]::Error.WriteLine("Картинка не напечатана: $($err)")
                    exit 1
                }}

                # Закрытие нефискального документа (выполняет прогон и отрезку)
                $fptr.endNonFiscalDocument()
            "#,
            file = file,
            scale = scale,
        );

        self.run_script(&body)
    }
}
