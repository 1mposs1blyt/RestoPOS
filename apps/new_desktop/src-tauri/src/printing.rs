//! Печать кухонных марок на ESC/POS-принтер по сети (порт 9100).
//!
//! Почему здесь, а не во фронте: кириллицу принтер понимает только в своей
//! кодовой странице (CP866), а в браузере нет ни кодировщика под неё, ни
//! сырого TCP. Плюс печать обязана иметь таймаут и не вешать интерфейс —
//! кассир не должен ждать принтер, до которого не дотянулась сеть.
//!
//! Границы: фронт решает, ЧТО печатать (состав марки), Rust — КАК (кодировка,
//! команды, сокет). Обратное разделение потребовало бы тащить сюда домен.

use std::io::Write;
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;

use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TicketLine {
    text: String,
    #[serde(default)]
    bold: bool,
    /// Двойная ширина и высота — для номера заказа и стола.
    #[serde(default)]
    big: bool,
    #[serde(default)]
    center: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrintRequest {
    host: String,
    port: u16,
    lines: Vec<TicketLine>,
    #[serde(default = "default_cut")]
    cut: bool,
    /// 0 — взять значение по умолчанию.
    #[serde(default)]
    timeout_ms: u64,
}

fn default_cut() -> bool {
    true
}

/// Принтер за кассой отвечает мгновенно; всё, что дольше, — это оборванная
/// сеть или спящее устройство, и ждать его смысла нет.
const DEFAULT_TIMEOUT_MS: u64 = 4000;

// ── ESC/POS ─────────────────────────────────────────────────────────────────

const ESC: u8 = 0x1B;
const GS: u8 = 0x1D;

/// Номер кодовой страницы CP866 в таблице ESC/POS (`ESC t n`).
const CODEPAGE_CP866: u8 = 17;

fn render(req: &PrintRequest) -> Vec<u8> {
    let mut out = Vec::with_capacity(512);

    out.extend_from_slice(&[ESC, b'@']); // сброс настроек предыдущей марки
    out.extend_from_slice(&[ESC, b't', CODEPAGE_CP866]);

    for line in &req.lines {
        out.extend_from_slice(&[ESC, b'a', if line.center { 1 } else { 0 }]);
        out.extend_from_slice(&[ESC, b'E', u8::from(line.bold)]);
        // GS ! n: старший полубайт — ширина, младший — высота.
        out.extend_from_slice(&[GS, b'!', if line.big { 0x11 } else { 0x00 }]);

        for ch in line.text.chars() {
            out.push(cp866(ch));
        }
        out.push(b'\n');
    }

    // Отступ, чтобы марка вылезла за нож и её можно было оторвать,
    // даже если резака нет.
    out.extend_from_slice(b"\n\n\n");

    if req.cut {
        // GS V 66 0 — неполный рез с подачей.
        out.extend_from_slice(&[GS, b'V', 66, 0]);
    }

    out
}

/// Кодировка символа в CP866.
///
/// Отдельной таблицей, а не крейтом: нужна ровно кириллица плюс ASCII, и это
/// три диапазона подряд — тянуть ради них зависимость (и лишние крейты
/// в каждую сборку) не стоит.
fn cp866(ch: char) -> u8 {
    let code = ch as u32;
    match code {
        0x20..=0x7E => code as u8,                       // ASCII
        0x0410..=0x042F => (0x80 + (code - 0x0410)) as u8, // А..Я
        0x0430..=0x043F => (0xA0 + (code - 0x0430)) as u8, // а..п
        0x0440..=0x044F => (0xE0 + (code - 0x0440)) as u8, // р..я
        0x0401 => 0xF0,                                   // Ё
        0x0451 => 0xF1,                                   // ё
        0x2116 => b'N',                                   // № — глифа нет
        0x00D7 | 0x2715 => b'x',                          // ×
        0x2014 | 0x2013 => b'-',                          // — –
        0x00B7 | 0x2022 => b'*',                          // · •
        _ => b'?',
    }
}

// ── Отправка ────────────────────────────────────────────────────────────────

fn send(req: PrintRequest) -> Result<(), String> {
    let timeout = Duration::from_millis(if req.timeout_ms == 0 {
        DEFAULT_TIMEOUT_MS
    } else {
        req.timeout_ms
    });

    let address = format!("{}:{}", req.host, req.port)
        .to_socket_addrs()
        .map_err(|e| format!("Не удалось разрешить адрес {}: {e}", req.host))?
        .next()
        .ok_or_else(|| format!("Адрес {} ни во что не разрешился", req.host))?;

    let mut stream = TcpStream::connect_timeout(&address, timeout)
        .map_err(|e| format!("Принтер {address} не отвечает: {e}"))?;

    stream
        .set_write_timeout(Some(timeout))
        .map_err(|e| format!("Не удалось выставить таймаут записи: {e}"))?;

    let payload = render(&req);
    stream
        .write_all(&payload)
        .map_err(|e| format!("Обрыв при передаче марки: {e}"))?;
    stream
        .flush()
        .map_err(|e| format!("Не удалось дописать марку: {e}"))?;

    Ok(())
}

/// Печать марки. Ошибку возвращаем текстом: она уезжает в очередь заданий
/// и показывается человеку, а не в консоль.
#[tauri::command]
pub async fn print_ticket(request: PrintRequest) -> Result<(), String> {
    // Сокет блокирующий, поэтому уводим его с потока рантайма: иначе
    // недоступный принтер подвесит интерфейс кассы на таймаут.
    tauri::async_runtime::spawn_blocking(move || send(request))
        .await
        .map_err(|e| format!("Не удалось запустить печать: {e}"))?
}

/// Импульс открытия денежного ящика: `ESC p m t1 t2`.
///
/// Ящик подключён к принтеру, а не к компьютеру, поэтому «драйвера ящика»
/// не существует — открывает его команда, уходящая тому же сокету, что и марки.
/// Длительности импульса заданы в единицах по 2 мс: 50 мс на замыкание,
/// 50 мс на размыкание. Меньше — соленоид не успевает сработать, больше —
/// греется впустую.
fn drawer_pulse() -> [u8; 5] {
    [ESC, b'p', 0x00, 25, 25]
}

fn kick_drawer(host: String, port: u16) -> Result<(), String> {
    let timeout = Duration::from_millis(DEFAULT_TIMEOUT_MS);

    let address = format!("{host}:{port}")
        .to_socket_addrs()
        .map_err(|e| format!("Не удалось разрешить адрес {host}: {e}"))?
        .next()
        .ok_or_else(|| format!("Адрес {host} ни во что не разрешился"))?;

    let mut stream = TcpStream::connect_timeout(&address, timeout)
        .map_err(|e| format!("Принтер {address} не отвечает: {e}"))?;

    stream
        .set_write_timeout(Some(timeout))
        .map_err(|e| format!("Не удалось выставить таймаут записи: {e}"))?;

    stream
        .write_all(&drawer_pulse())
        .map_err(|e| format!("Обрыв при открытии ящика: {e}"))?;
    stream
        .flush()
        .map_err(|e| format!("Не удалось дописать импульс: {e}"))?;

    Ok(())
}

/// Открыть денежный ящик.
#[tauri::command]
pub async fn open_cash_drawer(host: String, port: u16) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || kick_drawer(host, port))
        .await
        .map_err(|e| format!("Не удалось открыть ящик: {e}"))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Read;
    use std::net::TcpListener;

    #[test]
    fn импульс_ящика_это_esc_p_с_двумя_длительностями() {
        // ESC p — стандартная ESC/POS-команда; ноль это первый разъём ящика.
        assert_eq!(drawer_pulse(), [0x1B, b'p', 0x00, 25, 25]);
    }

    #[test]
    fn кириллица_кодируется_в_cp866() {
        assert_eq!(cp866('А'), 0x80);
        assert_eq!(cp866('Я'), 0x9F);
        assert_eq!(cp866('а'), 0xA0);
        assert_eq!(cp866('п'), 0xAF);
        assert_eq!(cp866('р'), 0xE0);
        assert_eq!(cp866('я'), 0xEF);
        assert_eq!(cp866('Ё'), 0xF0);
        assert_eq!(cp866('ё'), 0xF1);
        assert_eq!(cp866('A'), b'A');
        assert_eq!(cp866(' '), b' ');
    }

    #[test]
    fn марка_начинается_сбросом_и_кончается_резом() {
        let request = PrintRequest {
            host: "127.0.0.1".into(),
            port: 9100,
            lines: vec![TicketLine {
                text: "Борщ".into(),
                bold: true,
                big: false,
                center: false,
            }],
            cut: true,
            timeout_ms: 0,
        };

        let bytes = render(&request);
        assert_eq!(&bytes[..2], &[ESC, b'@']);
        assert_eq!(&bytes[2..5], &[ESC, b't', CODEPAGE_CP866]);
        assert_eq!(&bytes[bytes.len() - 4..], &[GS, b'V', 66, 0]);
        // «Борщ» в CP866: Б=0x81, о=0xAE, р=0xE0, щ=0xE9.
        assert!(bytes
            .windows(4)
            .any(|w| w == [0x81, 0xAE, 0xE0, 0xE9]));
    }

    /// Проверка всего пути до сокета: подключение, кодировка, запись.
    /// Настоящего принтера у сборки нет, поэтому его роль играет слушатель
    /// на случайном порту — для ESC/POS это ровно тот же сырой TCP.
    #[test]
    fn марка_уходит_в_сокет_целиком() {
        let listener = TcpListener::bind("127.0.0.1:0").expect("слушатель");
        let port = listener.local_addr().unwrap().port();

        let printer = std::thread::spawn(move || {
            let (mut socket, _) = listener.accept().expect("подключение");
            let mut received = Vec::new();
            socket.read_to_end(&mut received).expect("чтение");
            received
        });

        send(PrintRequest {
            host: "127.0.0.1".into(),
            port,
            lines: vec![TicketLine {
                text: "2 x Фо Бо".into(),
                bold: true,
                big: false,
                center: false,
            }],
            cut: true,
            timeout_ms: 2000,
        })
        .expect("печать не должна упасть");

        let received = printer.join().expect("поток принтера");
        assert_eq!(&received[..2], &[ESC, b'@']);
        assert_eq!(&received[received.len() - 4..], &[GS, b'V', 66, 0]);
        // «Фо Бо»: Ф=0x94, о=0xAE, Б=0x81, о=0xAE.
        assert!(received
            .windows(5)
            .any(|w| w == [0x94, 0xAE, b' ', 0x81, 0xAE]));
    }

    #[test]
    fn недоступный_принтер_возвращает_ошибку_а_не_виснет() {
        // Порт, который никто не слушает: соединение должно отвалиться
        // по таймауту, а не подвесить кассу.
        let result = send(PrintRequest {
            host: "127.0.0.1".into(),
            port: 1,
            lines: vec![],
            cut: false,
            timeout_ms: 500,
        });
        assert!(result.is_err());
    }
}
