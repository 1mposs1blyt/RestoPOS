import type { StaffRole } from "./common";
import {
  CONTRACT_OVERRIDABLE,
  CONTRACT_ROLE_PERMISSIONS,
  type ContractPermission,
  type ContractRole,
} from "./contract.generated";

/**
 * Права доступа: что сотруднику можно делать.
 *
 * Единица проверки — право, а не роль. Роль — это имя пресета прав, и проверять
 * её в коде (`if (role === 'manager')`) нельзя: первое же «нашим кассирам можно
 * сторно» разъедет условия по всему приложению вместо одной правки матрицы.
 *
 * **Источник истины — `contracts/contract.json`**, а не этот файл. Бэкенд пишется
 * на C#/C++ и импортировать TypeScript не может, поэтому матрица лежит в нейтральном
 * JSON, который читают обе стороны. Здесь только производные типы и хелперы.
 * После правки контракта: `pnpm contracts:build`.
 */
export type Permission = ContractPermission;

/**
 * Роли контракта обязаны совпадать с `StaffRole` домена. Если списки разъедутся,
 * этот тип перестанет собираться — а иначе расхождение всплыло бы отказом входа
 * у живого сотрудника.
 */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;
export type RolesMatchContract = Assert<Equals<StaffRole, ContractRole>>;

/**
 * Права, которые можно получить разово — подтверждением сотрудника, у которого
 * они есть по роли. Подтверждать вправе любой такой сотрудник, не обязательно
 * менеджер: возврат и чужой заказ кассир подтверждает сам.
 *
 * Право вне этого списка не подтверждается никем: его либо есть, либо нет.
 */
export const OVERRIDABLE_PERMISSIONS: readonly Permission[] =
  CONTRACT_OVERRIDABLE;

export function isOverridable(permission: Permission): boolean {
  return OVERRIDABLE_PERMISSIONS.includes(permission);
}

/**
 * Роль → её права.
 *
 * Официант и кассир оба забивают заказ и оба принимают оплату, включая наличные
 * со сдачей. Различие в другом: денежный ящик (смена, изъятия, возврат) — зона
 * кассира, а официант работает со своими заказами, чужой открывает только
 * с подтверждения.
 *
 * `support` — вендорский инженер, а не сотрудник заведения: ровно одно право
 * на сервисный экран. Ни денег, ни заказов.
 */
export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> =
  CONTRACT_ROLE_PERMISSIONS;

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
  return isOverridable(permission) && ROLE_PERMISSIONS[role].includes(permission);
}

export {
  CONTRACT_VERSION,
  CONTRACT_ERROR_CODES,
  CONTRACT_PERMISSIONS,
  CONTRACT_ROLES,
  ROOM_PATTERN,
  type ContractErrorCode,
  type ContractEventTopic,
} from "./contract.generated";
