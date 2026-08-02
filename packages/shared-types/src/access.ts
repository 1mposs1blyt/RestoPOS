import type { StaffRole } from "./common";

/**
 * Права доступа: что сотруднику можно делать.
 *
 * Единица проверки — право, а не роль. Роль — это имя пресета прав, и проверять
 * её в коде (`if (role === 'manager')`) нельзя: первое же «нашим кассирам можно
 * сторно» разъедет условия по всему приложению вместо одной правки матрицы.
 *
 * Матрица общая для фронта и бэкенда намеренно — коды прав обязаны совпадать
 * с теми, что проверяет `requirePermission` (см. `docs/access.md`). Источником
 * истины при этом остаётся сервер: клиент получает готовый список в ответе
 * на вход по PIN, а эта таблица — то, из чего сервер его строит.
 */
export type Permission =
  // Заказы
  | "order.view"
  | "order.create"
  | "order.item.add"
  | "order.send"
  /**
   * Отдать позицию гостю. Отдельно от `kitchen.item.status`: «готово» отмечает
   * кухня, «отдано» — тот, кто донёс до стола или выдал на прилавке. Без этого
   * права у станции без экрана позиции некому закрыть, и очередь растёт вечно.
   */
  | "order.item.serve"
  | "order.item.void"
  | "order.discount"
  | "order.cancel"
  | "order.foreign"
  // Деньги
  | "payment.accept"
  | "payment.refund"
  | "cash.drawer"
  | "shift.open"
  | "shift.close"
  | "report.x"
  | "report.z"
  // Кухня
  | "kitchen.view"
  | "kitchen.item.status"
  // Кухонная печать
  | "print.reprint"
  | "station.manage"
  // Настройка заведения
  | "hall.layout.edit"
  | "menu.stoplist"
  | "menu.edit"
  | "staff.manage"
  | "warehouse.view"
  | "warehouse.edit"
  // Терминал
  | "terminal.service";

/**
 * Права, которые можно получить разово — подтверждением сотрудника, у которого
 * они есть по роли. Подтверждать вправе любой такой сотрудник, не обязательно
 * менеджер: возврат и чужой заказ кассир подтверждает сам.
 *
 * Право вне этого списка не подтверждается никем: его либо есть, либо нет.
 */
export const OVERRIDABLE_PERMISSIONS: readonly Permission[] = [
  "order.item.void",
  "order.discount",
  "order.cancel",
  "order.foreign",
  "payment.refund",
];

export function isOverridable(permission: Permission): boolean {
  return OVERRIDABLE_PERMISSIONS.includes(permission);
}

/**
 * Роль → её права.
 *
 * Официант и кассир оба забивают заказ и оба принимают оплату, включая наличные
 * со сдачей. Различие в другом: денежный ящик (смена, изъятия, возврат) — зона
 * кассира, а официант работает со своими заказами, чужой открывает только
 * с подтверждения. Слить их в одну роль означало бы либо раздать официантам
 * гашение смены, либо отобрать у кассира чужие столы.
 *
 * `support` — вендорский инженер, а не сотрудник заведения: ровно одно право
 * на сервисный экран. Ни денег, ни заказов — чужие люди с правом сторно в чужой
 * кассе это не техподдержка.
 */
export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
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
    /*
     * Кухня прилавка — это очередь выдачи у самой кассы: там кассир сам
     * и готовит, и отдаёт, и кончившийся продукт замечает первым. Доступа
     * к кухонному экрану это ему не даёт — `kitchen.view` остаётся за поваром,
     * и в заведении с залом кассир по-прежнему никакой кухни не видит.
     */
    "kitchen.item.status",
    // Лента зажевала марку — переть за менеджером через весь зал незачем.
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

  support: ["terminal.service"],
};

/** Набор прав роли. Сравнение по множеству, а не поиск по массиву. */
export function permissionsOf(role: StaffRole): ReadonlySet<Permission> {
  return new Set(ROLE_PERMISSIONS[role]);
}

/**
 * Может ли обладатель роли подтвердить чужое действие.
 * Подтверждает тот, у кого право есть **по роли**, — цепочка подтверждений
 * длиной больше одного звена невозможна по построению.
 */
export function canApprove(role: StaffRole, permission: Permission): boolean {
  return (
    isOverridable(permission) &&
    ROLE_PERMISSIONS[role].includes(permission)
  );
}
