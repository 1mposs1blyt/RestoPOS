import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./printer";

/**
 * Мост к фискальному регистратору (`src-tauri/src/fiscal/`).
 *
 * Разделение то же, что у печати: здесь решается, ЧТО пробивать, там — КАК.
 * Драйвер ККТ — нативная библиотека, из браузера её не вызвать.
 *
 * Типы объявлены зеркально Rust-структурам: `serde` уже отдаёт поля
 * в camelCase, поэтому переименовывать ничего не нужно. Разъехаться они могут
 * только вместе с правкой Rust — и тогда `invoke` вернёт ошибку разбора,
 * а не молча подсунет `undefined`.
 */

export type ReceiptKind = "sale" | "refund";

export type VatRate =
  | "none"
  | "vat0"
  | "vat10"
  | "vat20"
  | "vat10_110"
  | "vat20_120";

export type TaxSystem =
  | "osn"
  | "usn_income"
  | "usn_income_outcome"
  | "envd"
  | "esn"
  | "patent";

/** Род оплаты для ККТ. Карта и любой безнал для неё одно и то же. */
export type FiscalPaymentKind = "cash" | "cashless";

export interface FiscalReceiptItem {
  name: string;
  /** Количество в тысячных: 0,5 порции — это 500. */
  quantityMilli: number;
  /** Цена за единицу в копейках, до скидки. */
  price: number;
  vat: VatRate;
  /**
   * Стоимость строки в копейках — уже со скидкой (`lib/receipt-lines.ts`).
   * `null` — считать перемножением, случай без скидки.
   */
  lineTotal: number | null;
}

export interface FiscalReceiptPayment {
  kind: FiscalPaymentKind;
  amount: number;
}

export interface FiscalReceiptRequest {
  kind: ReceiptKind;
  items: FiscalReceiptItem[];
  payments: FiscalReceiptPayment[];
  taxSystem: TaxSystem;
  cashierName: string;
  orderNumber: number;
  /** Идемпотентность: по нему ККТ узнают свой чек после обрыва. */
  clientId: string;
}

export interface FiscalReceipt {
  documentNumber: number;
  fiscalSign: string;
  shiftNumber: number;
  receiptNumber: number;
  total: number;
  clientId: string;
}

export interface ZReport {
  shiftNumber: number;
  documentNumber: number;
  receipts: number;
  /** Наличная выручка — с ней и только с ней сверяют денежный ящик. */
  cashTotal: number;
  cashlessTotal: number;
  refundsTotal: number;
}

export interface FiscalDeviceStatus {
  connected: boolean;
  shiftOpen: boolean;
  shiftNumber: number;
  /** Смена идёт больше 24 часов: чек ККТ уже не пробьёт, нужен Z-отчёт. */
  shiftExpired: boolean;
  lastDocumentNumber: number;
}

export type FiscalErrorKind =
  | "not_connected"
  | "shift_closed"
  | "shift_expired"
  | "rejected"
  | "unknown";

export interface FiscalError {
  kind: FiscalErrorKind;
  message?: string;
}

/**
 * Исход регистрации чека. Три состояния, а не два.
 *
 * `needs_attention` — связь оборвалась, и спросить ФН не удалось: чек мог
 * записаться, а мог и нет. Ни повторять, ни закрывать заказ нельзя,
 * решает человек.
 */
export type RegistrationOutcome =
  | { outcome: "registered"; receipt: FiscalReceipt; recovered: boolean }
  | { outcome: "failed"; error: FiscalError }
  | { outcome: "needs_attention"; error: FiscalError };

/** Сценарии отказов ККТ. Есть только в отладочной сборке. */
export type FiscalScenario =
  | "lost_reply_after"
  | "lost_reply_before"
  | "lost_reply_then_disconnect"
  | "reject"
  | "disconnect"
  | "connect"
  | "age_shift";

function requireTauri(): void {
  if (!isTauri()) {
    /*
     * Ошибка, а не молчаливый успех. Молчание здесь означало бы «чек пробит»
     * при отсутствующей ККТ — то есть закрытый заказ без фискального
     * документа. Решение «работать без ККТ» принимает слой выше
     * (`state/checkout.tsx`), явно и с пометкой.
     */
    throw new Error("ККТ доступна только в приложении кассы, не в браузере");
  }
}

/**
 * Вызов команды ККТ с внятной ошибкой.
 *
 * `invoke` отклоняет промис **сырым значением** — для `Result<T, String>`
 * в Rust это обычная строка, а не `Error`. Экраны же проверяют
 * `error instanceof Error` и на строке сваливались в общую подпись:
 * кассир видел «Смена в ККТ не открыта» вместо «Ресурс хранения ФД исчерпан».
 * Причина отказа терялась ровно там, где она единственно и нужна.
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

/**
 * Сказать драйверу, по какому адресу стоит ККТ.
 *
 * Без этого поле «порт» в карточке ККМ было бы декоративным: драйвер брал бы
 * адрес из константы в Rust, а кассир, поменявший IP на экране оборудования,
 * не увидел бы никакого эффекта и пошёл бы искать причину в кабеле.
 *
 * Молчит в браузере намеренно — в отличие от остальных вызовов. Настройка
 * это не расчёт гостя: падать здесь значило бы ронять экран оборудования
 * при отладке фронта без Tauri.
 */
export async function fiscalConfigure(ip: string, port: number): Promise<void> {
  if (!isTauri()) return;
  await call("fiscal_configure", { ip, port });
}

/**
 * Тестовая печать: проверка связи с ККТ до всякой фискализации.
 *
 * Нефискальный документ, поэтому проходит и на кассе с пустым или закрытым
 * накопителем — это единственный способ отличить «нет связи» от «ФН не даёт
 * пробить чек», не разбирая коды ошибок.
 */
export async function fiscalPrintTest(): Promise<void> {
  requireTauri();
  await call("fiscal_print_test");
}

export async function fiscalStatus(): Promise<FiscalDeviceStatus> {
  requireTauri();
  return call<FiscalDeviceStatus>("fiscal_status");
}

export async function fiscalOpenShift(cashierName: string): Promise<number> {
  requireTauri();
  return call<number>("fiscal_open_shift", { cashierName });
}

export async function fiscalCloseShift(cashierName: string): Promise<ZReport> {
  requireTauri();
  return call<ZReport>("fiscal_close_shift", { cashierName });
}

/** X-отчёт: срез без гашения, смену не закрывает. */
export async function fiscalXReport(): Promise<ZReport> {
  requireTauri();
  return call<ZReport>("fiscal_x_report");
}

export async function fiscalRegister(
  request: FiscalReceiptRequest,
): Promise<RegistrationOutcome> {
  requireTauri();
  return call<RegistrationOutcome>("fiscal_register", { request });
}

/** Только для дев-панели: в релизной сборке команды не существует. */
export async function fiscalSimulate(scenario: FiscalScenario): Promise<void> {
  requireTauri();
  await call("fiscal_simulate", { scenario });
}

/** Человекочитаемая причина отказа ККТ. */
export function describeFiscalError(error: FiscalError): string {
  switch (error.kind) {
    case "not_connected":
      return "ККТ не отвечает — проверьте кабель и питание";
    case "shift_closed":
      return "Кассовая смена в ККТ закрыта";
    case "shift_expired":
      return "Смена идёт больше 24 часов — нужен Z-отчёт";
    case "rejected":
      return error.message ?? "ККТ отклонила чек";
    case "unknown":
      return "Исход регистрации неизвестен";
  }
}
