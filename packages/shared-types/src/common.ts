/** UUID v4 в строковом виде — первичные ключи всех сущностей. */
export type UUID = string;

/** Метка времени ISO-8601 (`TIMESTAMPTZ` на стороне PostgreSQL). */
export type ISODateString = string;

/**
 * Денежная сумма. На бэкенде это `NUMERIC(10,2)`, который драйвер отдаёт строкой,
 * чтобы не терять точность в float. Держим строкой и на клиенте: арифметику
 * делаем только там, где явно приводим к минорным единицам (копейкам).
 */
export type Money = string;

export type PlanCode = "start" | "standard" | "pro";

/**
 * Булевы модули, привязанные к тарифу (таблица `plan_features`).
 * Числовые ограничения (`maxTerminals`, `maxVenues`) — это quota на Plan,
 * а не feature-flag, и проверяются отдельным механизмом.
 */
export type FeatureCode =
  | "warehouse"
  | "kds"
  | "delivery"
  | "reports"
  | "egais"
  | "loyalty"
  | "analytics"
  | "suppliers"
  | "multi_venue";

export type SubscriptionStatus = "active" | "past_due" | "canceled";

export type TerminalKind = "pos" | "kds" | "admin";

export type StaffRole = "waiter" | "cashier" | "manager" | "cook";

export type TableStatus = "free" | "occupied" | "reserved";

export type OrderStatus = "open" | "sent_to_kitchen" | "paid" | "canceled";

export type OrderItemStatus = "new" | "cooking" | "ready" | "served";

export type PaymentMethod = "cash" | "card";

/** Куда позиция уезжает на приготовление — определяет KDS-экран. */
export type PrepStation = "kitchen" | "bar";

export type MeasurementUnit = "kg" | "l" | "pcs";
