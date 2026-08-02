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

export async function printTicket(request: PrintTicketRequest): Promise<void> {
  if (!isTauri()) {
    // Ошибка, а не молчаливый успех: задание должно осесть в очереди
    // как непечатанное, иначе в браузерной отладке всё выглядит рабочим,
    // а на кассе марки не выходят.
    throw new Error(
      "Печать доступна только в приложении кассы, не в браузере",
    );
  }

  await invoke("print_ticket", { request });
}
