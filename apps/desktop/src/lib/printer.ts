import { invoke } from "@tauri-apps/api/core";

/**
 * Мост к печати на стороне Rust (`src-tauri/src/printing.rs`).
 *
 * Разделение обязанностей: здесь решается, ЧТО печатать, там — КАК. Кодировка
 * CP866, ESC/POS-команды и сырой TCP живут в Rust, потому что в браузере нет
 * ни того, ни другого, ни третьего.
 */

export interface TicketLine {
  text: string;
  bold?: boolean;
  /** Двойная ширина и высота: номер заказа, стол. */
  big?: boolean;
  center?: boolean;
}

export interface PrintTicketRequest {
  host: string;
  port: number;
  lines: TicketLine[];
  cut?: boolean;
  timeoutMs?: number;
}

/**
 * Запущено ли приложение под Tauri.
 *
 * Проверяем наличие моста, а не user-agent: фронт поднимается и в обычном
 * браузере (`pnpm --filter @restopos/desktop dev`), где печатать физически
 * нечем, и падение `invoke` там ничем не отличалось бы от сломанного принтера.
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Импульс открытия денежного ящика.
 *
 * Ящик подключён к чековому принтеру, а не к компьютеру: открывает его
 * ESC/POS-команда, уходящая тому же принтеру. Отдельного «драйвера ящика»
 * не существует — поэтому и хост с портом те же, что у печати.
 */
/**
 * Вызов команды печати с внятной ошибкой.
 *
 * `invoke` отклоняет промис сырым значением из `Err(String)` — строкой,
 * а не `Error`. Экраны проверяют `error instanceof Error`, и без этой обёртки
 * причина отказа теряется: в очереди печати вместо «принтер не отвечает»
 * оседает общая подпись.
 */
async function call<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (reason) {
    throw reason instanceof Error ? reason : new Error(String(reason));
  }
}

export async function openCashDrawer(host: string, port: number): Promise<void> {
  if (!isTauri()) {
    throw new Error(
      "Денежный ящик доступен только в приложении кассы, не в браузере",
    );
  }

  await call("open_cash_drawer", { host, port });
}

/**
 * Порт, на котором у АТОЛ слушает драйвер ККТ.
 *
 * Признак того, что за адресом стоит касса, а не сырой чековый принтер:
 * ESC/POS в этот порт не уедет, печатать надо драйвером.
 */
export const ATOL_DRIVER_PORT = 5555;

/**
 * Нефискальная печать строк на ККТ АТОЛ.
 *
 * Для кухонных марок на точках, где отдельного принтера нет и печатает
 * та же касса. Скрипт драйвера собирает Rust — фронт отдаёт только строки,
 * и это та же граница, что у чека: фронт решает ЧТО печатать, Rust — КАК.
 */
export async function printAtolLines(
  host: string,
  port: number,
  lines: string[],
): Promise<void> {
  if (!isTauri()) {
    throw new Error("Печать доступна только в приложении кассы, не в браузере");
  }

  await call("atol_print_lines", { host, port, lines });
}

export async function printTicket(request: PrintTicketRequest): Promise<void> {
  if (!isTauri()) {
    // Ошибка, а не молчаливый успех: задание должно осесть в очереди
    // как непечатанное, иначе в браузерной отладке всё выглядит рабочим,
    // а на кассе марки не выходят.
    throw new Error(
      "Печать доступна только в приложении кассы, не в браузере",
    );
  }

  await call("print_ticket", { request });
}
