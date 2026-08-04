import type {
  FeatureCode,
  Permission,
  PlanCode,
  Staff,
  UUID,
  Venue,
} from "@restopos/shared-types";
import { canApprove, permissionsOf } from "@restopos/shared-types";
import { ApiError } from "@restopos/api-client";
import { isNodeConfigured, nodeApi, setSessionToken } from "../api";

/**
 * Откуда терминал берёт сотрудника и его права.
 *
 * Единственное место, которое знает, работаем мы против узла или на демо-данных.
 * Экраны и сторы об этом не знают вовсе — поэтому переход на узел не потребует
 * их править (`docs/plan.md`, этап 0).
 *
 * Пока `VITE_NODE_URL` не задан, работает демо-ветка: PIN-коды зашиты здесь,
 * права выводятся из роли по общей матрице. С узлом права **приходят готовым
 * списком** — клиент их не вычисляет, потому что когда они станут настраиваемыми
 * на организацию, менять придётся только сервер.
 */

export const DEMO_VENUE: Venue = {
  id: "venue-demo",
  organizationId: "org-demo",
  name: "Кафе на Пушкинской",
  address: "ул. Пушкинская, 12",
  serviceMode: "tables",
};

export const DEMO_SHIFT_ID: UUID = "shift-demo";

/**
 * Идентификатор этого терминала. На проде приезжает с регистрации терминала
 * вместе с его типом и отделением (в iiko это видно на экране «Статус»:
 * группа «Главная касса, 1ФР», отделение «Зал»). Кассовая смена принадлежит
 * терминалу, а не заведению: у двух касс в одном зале свои ФР и своя нумерация.
 */
export const DEMO_TERMINAL_ID: UUID = "terminal-demo";

/** Пин-коды живут на сервере хешами (`staff.pin_code_hash`); это только демо. */
const DEMO_STAFF: { pin: string; staff: Staff }[] = [
  {
    pin: "1111",
    staff: {
      id: "staff-1",
      organizationId: DEMO_VENUE.organizationId,
      fullName: "Анна Ковалёва",
      role: "waiter",
    },
  },
  {
    pin: "2222",
    staff: {
      id: "staff-2",
      organizationId: DEMO_VENUE.organizationId,
      fullName: "Игорь Пшеничный",
      role: "cashier",
    },
  },
  {
    pin: "3333",
    staff: {
      id: "staff-3",
      organizationId: DEMO_VENUE.organizationId,
      fullName: "Мария Дёмина",
      role: "manager",
    },
  },
  {
    pin: "4444",
    staff: {
      id: "staff-4",
      organizationId: DEMO_VENUE.organizationId,
      fullName: "Тимур Абдуллаев",
      role: "cook",
    },
  },
  {
    // Вендорский доступ. На узле он не сотрудник организации, а строка
    // в `service_accounts` — иначе попадёт в квоту `max_staff` и будет виден
    // менеджеру в списке персонала (см. `docs/access.md`).
    pin: "9999",
    staff: {
      id: "service-1",
      organizationId: DEMO_VENUE.organizationId,
      fullName: "Тех. поддержка",
      role: "support",
    },
  },
];

export interface AuthResult {
  staff: Staff;
  permissions: ReadonlySet<Permission>;
  /** Приезжают с узла. В демо-режиме `undefined` — берём локальные значения. */
  venue?: Venue;
  entitlements?: { planCode: PlanCode; features: FeatureCode[] };
}

function demoStaff(pin: string): Staff {
  const match = DEMO_STAFF.find((entry) => entry.pin === pin);
  if (!match) throw new Error("Неверный PIN-код");
  return match.staff;
}

/**
 * Список персонала заведения.
 *
 * Нужен экранам, которые показывают **чужие** записи: табель явок, журнал,
 * смена кассира. Явка хранит только `staffId` — имя приходится искать,
 * и хранить его копией в каждой явке нельзя: переименовали сотрудника,
 * и половина табеля осталась со старым именем.
 *
 * На проде приезжает с узла (`GET /staff`), здесь — из демо-набора.
 */
export function staffRoster(): Staff[] {
  return DEMO_STAFF.map((entry) => entry.staff);
}

export function findStaff(staffId: UUID): Staff | undefined {
  return DEMO_STAFF.find((entry) => entry.staff.id === staffId)?.staff;
}

/**
 * Вход по PIN.
 *
 * Отказы наверх уходят исключением с человекочитаемым текстом: `PinPad`
 * по отклонённому промису подсветит поле, а `BlockScreen` покажет причину.
 */
export async function authenticate(pin: string): Promise<AuthResult> {
  if (!isNodeConfigured()) {
    const staff = demoStaff(pin);
    return { staff, permissions: permissionsOf(staff.role) };
  }

  try {
    const session = await nodeApi("pos").signIn(pin);
    setSessionToken(session.token);
    return {
      staff: session.staff,
      permissions: new Set(session.permissions),
      venue: session.venue,
      entitlements: session.entitlements,
    };
  } catch (reason) {
    throw new Error(describeAuthError(reason));
  }
}

/**
 * Подтверждение действия чужим PIN.
 *
 * Подтвердить может любой сотрудник, у которого право есть **по роли**, —
 * не обязательно менеджер: возврат и чужой заказ кассир подтверждает сам.
 * Цепочка подтверждений длиннее одного звена невозможна по построению.
 */
export async function approve(
  pin: string,
  permission: Permission,
  entityId?: UUID,
): Promise<Staff> {
  if (!isNodeConfigured()) {
    const approver = demoStaff(pin);
    if (!canApprove(approver.role, permission)) {
      throw new Error("У этого сотрудника нет такого права");
    }
    return approver;
  }

  try {
    const grant = await nodeApi("pos").requestOverride(pin, permission, entityId);
    return grant.approvedBy;
  } catch (reason) {
    throw new Error(describeAuthError(reason));
  }
}

/**
 * Человекочитаемая причина отказа.
 *
 * Коды различаются намеренно: «нет доступных экранов» — это не то же самое,
 * что неверный пин, и повар у кассы должен понимать, почему его не пустили,
 * иначе решит, что касса сломалась, и пойдёт искать менеджера.
 */
function describeAuthError(reason: unknown): string {
  if (!(reason instanceof ApiError)) {
    return reason instanceof Error ? reason.message : "Не удалось войти";
  }
  if (reason.isOffline) return "Узел заведения недоступен";
  if (reason.isNoScreensForRole) {
    return "На этом терминале нет доступных экранов для вашей роли";
  }
  switch (reason.code) {
    case "invalid_pin":
      return "Неверный PIN-код";
    case "staff_not_in_venue":
      return "Сотрудник не привязан к этому заведению";
    case "override_not_permitted":
    case "permission_denied":
      return "У этого сотрудника нет такого права";
    default:
      return reason.message;
  }
}
