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
  | "order.item.split"
  | "payment.accept"
  | "payment.refund"
  | "cash.drawer"
  | "cash.deposit"
  | "cash.withdraw"
  | "cashier.change"
  | "shift.open"
  | "shift.close"
  | "report.x"
  | "report.z"
  | "report.view"
  | "audit.view"
  | "kitchen.view"
  | "kitchen.item.status"
  | "print.reprint"
  | "station.manage"
  | "hall.layout.edit"
  | "menu.stoplist"
  | "menu.edit"
  | "staff.manage"
  | "staff.attendance"
  | "staff.self"
  | "guest.manage"
  | "delivery.view"
  | "delivery.manage"
  | "document.view"
  | "document.create"
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
  | "order_not_editable"
  | "cash_shift_not_open"
  | "cash_shift_already_open"
  | "cash_insufficient"
  | "staff_shift_not_open";

export type ContractEventTopic =
  | "order.created"
  | "order.updated"
  | "order_item.status_changed"
  | "table.status_changed"
  | "print_job.failed"
  | "stoplist.changed"
  | "cash_shift.opened"
  | "cash_shift.closed"
  | "cash_operation.created"
  | "staff_shift.changed"
  | "delivery.status_changed"
  | "audit.recorded";

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
  "order.item.split",
  "payment.accept",
  "payment.refund",
  "cash.drawer",
  "cash.deposit",
  "cash.withdraw",
  "cashier.change",
  "shift.open",
  "shift.close",
  "report.x",
  "report.z",
  "report.view",
  "audit.view",
  "kitchen.view",
  "kitchen.item.status",
  "print.reprint",
  "station.manage",
  "hall.layout.edit",
  "menu.stoplist",
  "menu.edit",
  "staff.manage",
  "staff.attendance",
  "staff.self",
  "guest.manage",
  "delivery.view",
  "delivery.manage",
  "document.view",
  "document.create",
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
  "cash_shift_not_open",
  "cash_shift_already_open",
  "cash_insufficient",
  "staff_shift_not_open",
];

export const CONTRACT_EVENT_TOPICS: readonly ContractEventTopic[] = [
  "order.created",
  "order.updated",
  "order_item.status_changed",
  "table.status_changed",
  "print_job.failed",
  "stoplist.changed",
  "cash_shift.opened",
  "cash_shift.closed",
  "cash_operation.created",
  "staff_shift.changed",
  "delivery.status_changed",
  "audit.recorded",
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
    "order.item.split",
    "payment.accept",
    "guest.manage",
    "delivery.view",
    "staff.self",
  ],
  cashier: [
    "order.view",
    "order.create",
    "order.item.add",
    "order.send",
    "order.item.serve",
    "order.item.split",
    "order.cancel",
    "order.foreign",
    "payment.accept",
    "payment.refund",
    "cash.drawer",
    "cash.deposit",
    "cash.withdraw",
    "cashier.change",
    "shift.open",
    "shift.close",
    "report.x",
    "report.view",
    "kitchen.item.status",
    "print.reprint",
    "menu.stoplist",
    "guest.manage",
    "delivery.view",
    "delivery.manage",
    "document.view",
    "staff.self",
  ],
  manager: [
    "order.view",
    "order.create",
    "order.item.add",
    "order.send",
    "order.item.serve",
    "order.item.void",
    "order.item.split",
    "order.discount",
    "order.cancel",
    "order.foreign",
    "payment.accept",
    "payment.refund",
    "cash.drawer",
    "cash.deposit",
    "cash.withdraw",
    "cashier.change",
    "shift.open",
    "shift.close",
    "report.x",
    "report.z",
    "report.view",
    "audit.view",
    "kitchen.view",
    "kitchen.item.status",
    "print.reprint",
    "station.manage",
    "hall.layout.edit",
    "menu.stoplist",
    "menu.edit",
    "staff.manage",
    "staff.attendance",
    "guest.manage",
    "delivery.view",
    "delivery.manage",
    "document.view",
    "document.create",
    "warehouse.view",
    "warehouse.edit",
    "staff.self",
  ],
  cook: [
    "kitchen.view",
    "kitchen.item.status",
    "print.reprint",
    "menu.stoplist",
    "staff.self",
  ],
  support: [
    "terminal.service",
  ],
};
