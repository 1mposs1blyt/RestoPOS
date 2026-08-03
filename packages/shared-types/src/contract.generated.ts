/*
 * СГЕНЕРИРОВАННЫЙ ФАЙЛ — не редактировать.
 * Источник: contracts/contract.json, генератор: scripts/build-contract.mjs.
 * Пересобрать: pnpm contracts:build
 *
 * Контракт нейтрален по языку намеренно: бэкенд пишется на C#/C++ и читает
 * тот же JSON. Матрица прав, продублированная руками в двух языках, разъедется
 * на первой правке, а расхождение здесь — это дыра в доступе.
 */

export const CONTRACT_VERSION = 1;

/** Шаблон имени комнаты realtime. Должен совпадать байт-в-байт с бэкендом. */
export const ROOM_PATTERN = "venue:{venueId}:{terminalKind}";

export type ContractRole =
  | "waiter"
  | "cashier"
  | "manager"
  | "cook"
  | "support";

export type ContractPermission =
  | "order.view"
  | "order.create"
  | "order.item.add"
  | "order.send"
  | "order.item.serve"
  | "order.item.void"
  | "order.discount"
  | "order.cancel"
  | "order.foreign"
  | "payment.accept"
  | "payment.refund"
  | "cash.drawer"
  | "shift.open"
  | "shift.close"
  | "report.x"
  | "report.z"
  | "kitchen.view"
  | "kitchen.item.status"
  | "print.reprint"
  | "station.manage"
  | "hall.layout.edit"
  | "menu.stoplist"
  | "menu.edit"
  | "staff.manage"
  | "warehouse.view"
  | "warehouse.edit"
  | "terminal.service";

export type ContractErrorCode =
  | "invalid_pin"
  | "staff_not_in_venue"
  | "no_screens_for_role"
  | "permission_denied"
  | "override_required"
  | "override_invalid"
  | "feature_not_available"
  | "quota_exceeded"
  | "shift_not_open"
  | "order_not_editable";

export type ContractEventTopic =
  | "order.created"
  | "order.updated"
  | "order_item.status_changed"
  | "table.status_changed"
  | "print_job.failed"
  | "stoplist.changed";

export const CONTRACT_ROLES: readonly ContractRole[] = [
  "waiter",
  "cashier",
  "manager",
  "cook",
  "support",
];

export const CONTRACT_PERMISSIONS: readonly ContractPermission[] = [
  "order.view",
  "order.create",
  "order.item.add",
  "order.send",
  "order.item.serve",
  "order.item.void",
  "order.discount",
  "order.cancel",
  "order.foreign",
  "payment.accept",
  "payment.refund",
  "cash.drawer",
  "shift.open",
  "shift.close",
  "report.x",
  "report.z",
  "kitchen.view",
  "kitchen.item.status",
  "print.reprint",
  "station.manage",
  "hall.layout.edit",
  "menu.stoplist",
  "menu.edit",
  "staff.manage",
  "warehouse.view",
  "warehouse.edit",
  "terminal.service",
];

export const CONTRACT_ERROR_CODES: readonly ContractErrorCode[] = [
  "invalid_pin",
  "staff_not_in_venue",
  "no_screens_for_role",
  "permission_denied",
  "override_required",
  "override_invalid",
  "feature_not_available",
  "quota_exceeded",
  "shift_not_open",
  "order_not_editable",
];

export const CONTRACT_EVENT_TOPICS: readonly ContractEventTopic[] = [
  "order.created",
  "order.updated",
  "order_item.status_changed",
  "table.status_changed",
  "print_job.failed",
  "stoplist.changed",
];

/** Права, которые можно получить разово — подтверждением старшего сотрудника. */
export const CONTRACT_OVERRIDABLE: readonly ContractPermission[] = [
  "order.item.void",
  "order.discount",
  "order.cancel",
  "order.foreign",
  "payment.refund",
];

export const CONTRACT_ROLE_PERMISSIONS: Record<
  ContractRole,
  readonly ContractPermission[]
> = {
  waiter: [
    "order.view",
    "order.create",
    "order.item.add",
    "order.send",
    "order.item.serve",
    "payment.accept",
  ],
  cashier: [
    "order.view",
    "order.create",
    "order.item.add",
    "order.send",
    "order.item.serve",
    "order.cancel",
    "order.foreign",
    "payment.accept",
    "payment.refund",
    "cash.drawer",
    "shift.open",
    "shift.close",
    "report.x",
    "kitchen.item.status",
    "print.reprint",
    "menu.stoplist",
  ],
  manager: [
    "order.view",
    "order.create",
    "order.item.add",
    "order.send",
    "order.item.serve",
    "order.item.void",
    "order.discount",
    "order.cancel",
    "order.foreign",
    "payment.accept",
    "payment.refund",
    "cash.drawer",
    "shift.open",
    "shift.close",
    "report.x",
    "report.z",
    "kitchen.view",
    "kitchen.item.status",
    "print.reprint",
    "station.manage",
    "hall.layout.edit",
    "menu.stoplist",
    "menu.edit",
    "staff.manage",
    "warehouse.view",
    "warehouse.edit",
  ],
  cook: [
    "kitchen.view",
    "kitchen.item.status",
    "print.reprint",
    "menu.stoplist",
  ],
  support: [
    "terminal.service",
  ],
};
