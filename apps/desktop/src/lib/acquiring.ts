import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./printer";

/**
 * Мост к эквайринговому терминалу (`src-tauri/src/acquiring/`).
 *
 * Отличие от ККТ, которое определяет всё остальное: терминал общается
 * с банком, а не с локальной памятью. Пока исход операции неизвестен, деньги
 * гостя уже могли уйти со счёта — поэтому неизвестность там гасится отменой
 * (reversal), а не чтением журнала.
 */

export type AcquiringOperationKind = "payment" | "refund";

export interface AcquiringPaymentRequest {
  /** Сумма в копейках. */
  amount: number;
  /** Идемпотентность: по нему операцию ищут после обрыва. */
  clientId: string;
  orderNumber: number;
}

/** Одобренная операция. Уезжает в платёж заказа и в слип. */
export interface Authorization {
  kind: AcquiringOperationKind;
  amount: number;
  authCode: string;
  /** По нему операцию находят в банке при разборе спорной оплаты. */
  rrn: string;
  /** «**** 4242». Полного номера карты у кассы нет и быть не должно. */
  cardMask: string;
  clientId: string;
}

export interface TerminalStatus {
  connected: boolean;
  /** Терминал занят операцией: второй запрос он отвергнет. */
  busy: boolean;
}

export type TerminalErrorKind = "not_connected" | "declined" | "unknown";

export interface TerminalError {
  kind: TerminalErrorKind;
  message?: string;
}

/**
 * Исход оплаты картой.
 *
 * `declined.reversed` отличает отказ банка от нашей отмены: гостю их объясняют
 * по-разному («карта не прошла» против «операция отменена, попробуйте снова»).
 */
export type PaymentOutcome =
  | { outcome: "approved"; authorization: Authorization; recovered: boolean }
  | { outcome: "declined"; reason: string; reversed: boolean }
  | { outcome: "needs_attention"; error: TerminalError };

/** Сценарии отказов терминала. Есть только в отладочной сборке. */
export type AcquiringScenario =
  | "declined"
  | "unknown_after_approve"
  | "unknown_before_approve"
  | "unknown_then_disconnect"
  | "disconnect"
  | "connect";

function requireTauri(): void {
  if (!isTauri()) {
    throw new Error(
      "Эквайринг доступен только в приложении кассы, не в браузере",
    );
  }
}

export async function acquiringStatus(): Promise<TerminalStatus> {
  requireTauri();
  return invoke<TerminalStatus>("acquiring_status");
}

export async function acquiringPay(
  request: AcquiringPaymentRequest,
): Promise<PaymentOutcome> {
  requireTauri();
  return invoke<PaymentOutcome>("acquiring_pay", { request });
}

/**
 * Отменить авторизацию по `clientId`.
 *
 * Нужна, когда чек делят на две карты и вторая не прошла: первую обязаны
 * вернуть, иначе с гостя списаны деньги за еду, которую он не купил.
 * Отмена несуществующей операции — штатный ответ, а не ошибка.
 */
export async function acquiringReversal(clientId: string): Promise<void> {
  requireTauri();
  await invoke("acquiring_reversal", { clientId });
}

/**
 * Возврат по карте — своя операция, а не отмена оплаты: отменить можно только
 * сегодняшнюю, а возврат делают и через неделю.
 *
 * Исход такой же трёхсоставный, как у оплаты, и по той же причине: «не знаю»
 * означает деньги, возможно ушедшие гостю без встречной строки в кассе.
 */
export async function acquiringRefund(
  request: AcquiringPaymentRequest,
): Promise<PaymentOutcome> {
  requireTauri();
  return invoke<PaymentOutcome>("acquiring_refund", { request });
}

export async function acquiringSimulate(
  scenario: AcquiringScenario,
): Promise<void> {
  requireTauri();
  await invoke("acquiring_simulate", { scenario });
}

export function describeTerminalError(error: TerminalError): string {
  switch (error.kind) {
    case "not_connected":
      return "Терминал не отвечает — проверьте кабель и питание";
    case "declined":
      return error.message ?? "Банк отклонил операцию";
    case "unknown":
      return "Исход операции неизвестен";
  }
}
