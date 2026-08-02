import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Permission,
  ServiceMode,
  Staff,
  StaffRole,
  TerminalKind,
  UUID,
  Venue,
} from "@restopos/shared-types";
import { permissionsOf } from "@restopos/shared-types";
import { loadState, saveState } from "../lib/storage";
import { useEntitlements } from "./entitlements";
import { routesFor } from "./navigation";

/**
 * Смена терминала: кто за кассой, какое заведение, какой тип терминала.
 *
 * Проверка пин-кода здесь — заглушка (см. `authenticate`). Когда появится
 * `POST /auth/pin`, меняется только тело этой функции: наружу она уже сейчас
 * асинхронная и падает исключением при отказе, как и будет с сервером.
 */

const DEMO_VENUE: Venue = {
  id: "venue-demo",
  organizationId: "org-demo",
  name: "Кафе на Пушкинской",
  address: "ул. Пушкинская, 12",
  serviceMode: "tables",
};

const DEMO_SHIFT_ID: UUID = "shift-demo";

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
    // Вендорский доступ. На бэкенде он не сотрудник организации, а строка
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

async function authenticate(pin: string): Promise<Staff> {
  const match = DEMO_STAFF.find((entry) => entry.pin === pin);
  if (!match) {
    throw new Error("Неверный PIN-код");
  }
  return match.staff;
}

const ROLE_LABELS: Record<StaffRole, string> = {
  waiter: "Официант",
  cashier: "Кассир",
  manager: "Менеджер",
  cook: "Повар",
  support: "Тех. поддержка",
};

export function roleLabel(role: StaffRole): string {
  return ROLE_LABELS[role];
}

interface SessionValue {
  venue: Venue;
  shiftId: UUID;
  staff: Staff | null;
  terminalKind: TerminalKind;
  /**
   * Станция, которую обслуживает этот кухонный монитор. `null` — показывать
   * все, что уместно только пока станция одна: бар не должен видеть стейки.
   * На проде это `terminals.prep_station_id` из регистрации терминала.
   */
  stationId: UUID | null;
  setStationId: (stationId: UUID | null) => void;
  /** Права вошедшего сотрудника. Пустой набор, пока терминал заблокирован. */
  permissions: ReadonlySet<Permission>;
  /** Экран заблокирован, пока смену не открыл сотрудник. */
  isLocked: boolean;
  signIn: (pin: string) => Promise<void>;
  lock: () => void;
  /**
   * Проверка чужого PIN без смены сотрудника за терминалом — для подтверждения
   * «дорогих» действий (см. `access.tsx`). Вход и подтверждение разведены
   * намеренно: подтверждение не должно превращаться в режим «менеджер за спиной».
   */
  verifyPin: (pin: string) => Promise<Staff>;
  setTerminalKind: (kind: TerminalKind) => void;
  /** Только для дев-панели: на проде режим приезжает с заведением. */
  setServiceMode: (mode: ServiceMode) => void;
  /** Роль сотрудника: что человеку можно. Проверяется отдельно от тарифа. */
  hasRole: (...roles: StaffRole[]) => boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

const TERMINAL_KIND_KEY = "terminal.kind";
const SERVICE_MODE_KEY = "venue.serviceMode";
const STATION_KEY = "terminal.stationId";

export function SessionProvider({ children }: { children: ReactNode }) {
  const { features } = useEntitlements();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [terminalKind, setTerminalKindState] = useState<TerminalKind>(() =>
    loadState<TerminalKind>(TERMINAL_KIND_KEY, "pos"),
  );
  const [serviceMode, setServiceModeState] = useState<ServiceMode>(() =>
    loadState<ServiceMode>(SERVICE_MODE_KEY, DEMO_VENUE.serviceMode),
  );
  const [stationId, setStationIdState] = useState<UUID | null>(() =>
    loadState<UUID | null>(STATION_KEY, null),
  );

  const signIn = useCallback(
    async (pin: string) => {
      // Исключение наверх не гасим: `PinPad` по отклонённому промису
      // сам подсветит поле и очистит ввод.
      const authenticated = await authenticate(pin);

      /*
       * Пустое пересечение прав и терминала — это отказ входа, а не пустой
       * экран. Повар, приложивший PIN к кассе у бара, и официант у кухонного
       * монитора должны получить внятную причину: иначе оба решат, что касса
       * сломалась, и пойдут искать менеджера.
       *
       * На бэкенде это будет 403 `no_screens_for_role` в ответе `/auth/pin` —
       * проверка обязана быть и там: вход мимо интерфейса не должен выдавать
       * токен смены тому, кому на этом терминале делать нечего.
       */
      const available = routesFor({
        kind: terminalKind,
        serviceMode,
        permissions: permissionsOf(authenticated.role),
        features,
      });

      if (available.length === 0) {
        throw new Error(
          `${roleLabel(authenticated.role)}: на этом терминале нет доступных экранов`,
        );
      }

      setStaff(authenticated);
    },
    [terminalKind, serviceMode, features],
  );

  /**
   * Проверка чужого PIN. Сотрудника за терминалом не меняет — возвращает того,
   * кому принадлежит пин, и на этом всё.
   */
  const verifyPin = useCallback((pin: string) => authenticate(pin), []);

  const lock = useCallback(() => setStaff(null), []);

  const setTerminalKind = useCallback((kind: TerminalKind) => {
    setTerminalKindState(kind);
    saveState(TERMINAL_KIND_KEY, kind);
  }, []);

  const setServiceMode = useCallback((mode: ServiceMode) => {
    setServiceModeState(mode);
    saveState(SERVICE_MODE_KEY, mode);
  }, []);

  const setStationId = useCallback((next: UUID | null) => {
    setStationIdState(next);
    saveState(STATION_KEY, next);
  }, []);

  const hasRole = useCallback(
    (...roles: StaffRole[]) => (staff ? roles.includes(staff.role) : false),
    [staff],
  );

  const value = useMemo<SessionValue>(
    () => ({
      venue: { ...DEMO_VENUE, serviceMode },
      shiftId: DEMO_SHIFT_ID,
      staff,
      terminalKind,
      stationId,
      setStationId,
      // На проде список прав приезжает с сервера в ответе на вход по PIN,
      // а не выводится из роли здесь: когда права станут настраиваемыми
      // на организацию, менять придётся только бэкенд.
      permissions: staff ? permissionsOf(staff.role) : new Set<Permission>(),
      isLocked: staff === null,
      signIn,
      lock,
      verifyPin,
      setTerminalKind,
      setServiceMode,
      hasRole,
    }),
    [
      staff,
      terminalKind,
      serviceMode,
      stationId,
      setStationId,
      signIn,
      lock,
      verifyPin,
      setTerminalKind,
      setServiceMode,
      hasRole,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession вызван вне SessionProvider");
  }
  return value;
}
