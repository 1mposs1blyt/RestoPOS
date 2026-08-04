import type { ISODateString, Money, UUID } from "./common";

/**
 * Смены. Их **две**, и они независимы.
 *
 * Это не удвоение одной сущности, а разные факты о разных субъектах:
 *
 * - `StaffShift` — личная смена сотрудника: он пришёл, отработал, ушёл.
 *   Из неё считаются отработанное время, личные продажи и расчёт по зарплате.
 * - `CashShift` — кассовая смена фискального регистратора: своя сквозная
 *   нумерация, X-отчёт, инкассация, закрытие дня.
 *
 * Одна не влечёт другую. Официант уходит домой, не закрывая кассовый день;
 * кассовая смена закрывается один раз за сутки, пока через терминал прошло
 * четверо сотрудников. Свести их в одну «смену» — значит потерять либо табель,
 * либо фискальную отчётность.
 *
 * Обе append-only по духу инварианта №6: закрытая смена не редактируется,
 * исправление — это отдельный документ, а не правка факта.
 */

export type StaffShiftStatus = "open" | "closed";

/**
 * Личная смена (явка) сотрудника.
 *
 * `acceptedAt`/`acceptedUntil` — то, что зачтено к оплате, против фактических
 * `openedAt`/`closedAt`. Расхождение между ними и есть «серая зона» из табеля
 * iiko: человек пробил приход за час до начала смены по расписанию.
 */
export interface StaffShift {
  id: UUID;
  venueId: UUID;
  staffId: UUID;
  status: StaffShiftStatus;
  openedAt: ISODateString;
  closedAt: ISODateString | null;
  /** Зачтённое начало, если отличается от фактического. */
  acceptedAt: ISODateString | null;
  /** Зачтённый конец, если отличается от фактического. */
  acceptedUntil: ISODateString | null;
  /** Кто подтвердил расхождение с расписанием. */
  approvedBy: UUID | null;
  clientId?: string;
}

export type CashShiftStatus = "open" | "closed";

/**
 * Кассовая смена фискального регистратора.
 *
 * `number` сквозной по терминалу и не переиспользуется: это то, на что
 * ссылается закрытый чек (`Order.cashShiftNumber`) и по чему налоговая
 * сопоставляет Z-отчёты.
 */
export interface CashShift {
  id: UUID;
  venueId: UUID;
  terminalId: UUID;
  /** Номер смены по фискальному регистратору, сквозной. */
  number: number;
  status: CashShiftStatus;
  /** Кто открыл смену — это менеджер смены, а не обязательно текущий кассир. */
  openedBy: UUID;
  closedBy: UUID | null;
  openedAt: ISODateString;
  closedAt: ISODateString | null;
  /** Наличные в ящике на момент открытия (разменный фонд). */
  openingFloat: Money;
  clientId?: string;
}

/**
 * Движение по денежному ящику.
 *
 * Отдельный класс сущностей: это не заказ и не платёж. Внесение размена утром
 * и инкассация вечером не связаны ни с одним чеком, но обязаны сходиться
 * с наличными в ящике — иначе X-отчёт не бьётся, и непонятно, недостача это
 * или невнесённый размен.
 *
 * Append-only и иммутабельно, как `payments` (инвариант №6): ошибочное
 * изъятие исправляется встречным внесением, а не правкой суммы.
 */
export type CashOperationKind =
  | "deposit"
  | "withdrawal"
  /** Размен при открытии смены. Отличается от внесения только смыслом в отчёте. */
  | "opening_float"
  /** Инкассация: деньги ушли из заведения, а не просто из ящика. */
  | "collection";

export interface CashOperation {
  id: UUID;
  cashShiftId: UUID;
  kind: CashOperationKind;
  /** Всегда положительная. Направление задаёт `kind`, а не знак суммы. */
  amount: Money;
  /** Кто провёл. Изъятие без имени — это не операция, а пропажа. */
  staffId: UUID;
  /** Кто подтвердил, если право побиваемое. */
  approvedBy: UUID | null;
  comment: string;
  createdAt: ISODateString;
  clientId?: string;
}

/** Итоги смены для X-отчёта и «итого по смене». */
export interface CashShiftTotals {
  /** Выручка по типам оплаты. */
  byPaymentType: { paymentTypeId: UUID; label: string; amount: Money }[];
  /** Сумма всех продаж. */
  revenue: Money;
  deposits: Money;
  withdrawals: Money;
  /** Сколько наличных должно быть в ящике: размен + наличная выручка − изъятия. */
  expectedCash: Money;
  ordersCount: number;
  /** Средний чек. `null`, если продаж не было — делить не на что. */
  averageCheck: Money | null;
}
