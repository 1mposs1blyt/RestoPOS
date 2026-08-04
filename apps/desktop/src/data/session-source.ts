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
import {
  isNodeConfigured,
  nodeApi,
  setSessionToken,
  setSessionVenueId,
} from "../api";

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
/**
 * Что узел отдаёт **на самом деле** — форма его ответа, а не наша.
 *
 * Она пока расходится с `SessionInfo` из `api-client`, который написан
 * по контракту (`docs/plan.md` §4.1). Держим разницу здесь, в единственном
 * месте, знающем про узел, и явно перечисляем расхождения — чтобы их было
 * видно и чтобы их можно было убрать, а не забыть.
 */
interface NodeSession {
  staff: Staff;
  permissions: Permission[];
  venue: { id: UUID; name: string; serviceMode: Venue["serviceMode"] };
  terminal: { id: UUID; kind: string; label: string };
  /** Контракт ждёт `entitlements: { planCode, features }`. */
  plan: { code: PlanCode; name: string };
  /** Контракт ждёт `shift`. */
  currentShift: { id: UUID; openedAt: string } | null;
  activeStaffShift: { id: UUID } | null;
  availableRoutes: string[];
  /** Токена узел пока не выдаёт вовсе — авторизации на нём ещё нет. */
  token?: string;
}

/**
 * Модули тарифа по его коду.
 *
 * Узел отдаёт только код тарифа, без списка фич, поэтому раскрываем его здесь
 * по той же таблице, что и локальный режим. Когда узел начнёт отдавать
 * `entitlements` целиком, это место исчезнет — оно временное и намеренно
 * дублирует `app/entitlements.tsx`, а не притворяется источником истины.
 */
function featuresOfPlan(code: PlanCode): FeatureCode[] {
  const standard: FeatureCode[] = ["warehouse", "kds", "reports", "delivery"];
  if (code === "start") return [];
  if (code === "standard") return standard;
  return [
    ...standard,
    "egais",
    "loyalty",
    "analytics",
    "suppliers",
    "multi_venue",
  ];
}

export async function authenticate(pin: string): Promise<AuthResult> {
  if (!isNodeConfigured()) {
    const staff = demoStaff(pin);
    return { staff, permissions: permissionsOf(staff.role) };
  }

  try {
    const session = (await nodeApi("pos").signIn(pin)) as unknown as NodeSession;
    // Токена узел пока не выдаёт; когда начнёт — строка заработает сама.
    setSessionToken(session.token ?? null);
    // Заведение уходит заголовком на всех следующих запросах.
    setSessionVenueId(session.venue.id);

    return {
      staff: session.staff,
      permissions: new Set(session.permissions),
      venue: {
        ...session.venue,
        // Организация в ответе не приходит: узел работает в одном заведении,
        // и мультитенантность режется на его стороне.
        organizationId: "",
        address: null,
      },
      entitlements: {
        planCode: session.plan.code,
        features: featuresOfPlan(session.plan.code),
      },
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
    const grant = (await nodeApi("pos").requestOverride(
      pin,
      permission,
      entityId,
    )) as unknown as { approvedBy?: Staff; temporaryToken?: string };

    /*
     * Узел пока отвечает только `{ temporaryToken, expiresInSeconds }` и не
     * говорит, КТО подтвердил. Журнал опасных операций без этого бессмыслен:
     * «сторно подтверждено» без имени не отвечает ни на один вопрос при разборе
     * смены. Поэтому подставляем заглушку и не притворяемся, что знаем имя.
     */
    return (
      grant.approvedBy ?? {
        id: "unknown",
        organizationId: "",
        fullName: "подтверждено на узле",
        role: "manager",
      }
    );
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
