import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ServiceMode,
  Staff,
  StaffRole,
  TerminalKind,
  UUID,
  Venue,
} from "@restopos/shared-types";
import { loadState, saveState } from "../lib/storage";

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
];

async function authenticate(pin: string): Promise<Staff> {
  const match = DEMO_STAFF.find((entry) => entry.pin === pin);
  if (!match) {
    throw new Error("Неверный PIN-код");
  }
  return match.staff;
}

interface SessionValue {
  venue: Venue;
  shiftId: UUID;
  staff: Staff | null;
  terminalKind: TerminalKind;
  /** Экран заблокирован, пока смену не открыл сотрудник. */
  isLocked: boolean;
  signIn: (pin: string) => Promise<void>;
  lock: () => void;
  setTerminalKind: (kind: TerminalKind) => void;
  /** Только для дев-панели: на проде режим приезжает с заведением. */
  setServiceMode: (mode: ServiceMode) => void;
  /** Роль сотрудника: что человеку можно. Проверяется отдельно от тарифа. */
  hasRole: (...roles: StaffRole[]) => boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

const TERMINAL_KIND_KEY = "terminal.kind";
const SERVICE_MODE_KEY = "venue.serviceMode";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [terminalKind, setTerminalKindState] = useState<TerminalKind>(() =>
    loadState<TerminalKind>(TERMINAL_KIND_KEY, "pos"),
  );
  const [serviceMode, setServiceModeState] = useState<ServiceMode>(() =>
    loadState<ServiceMode>(SERVICE_MODE_KEY, DEMO_VENUE.serviceMode),
  );

  const signIn = useCallback(async (pin: string) => {
    // Исключение наверх не гасим: `PinPad` по отклонённому промису
    // сам подсветит поле и очистит ввод.
    setStaff(await authenticate(pin));
  }, []);

  const lock = useCallback(() => setStaff(null), []);

  const setTerminalKind = useCallback((kind: TerminalKind) => {
    setTerminalKindState(kind);
    saveState(TERMINAL_KIND_KEY, kind);
  }, []);

  const setServiceMode = useCallback((mode: ServiceMode) => {
    setServiceModeState(mode);
    saveState(SERVICE_MODE_KEY, mode);
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
      isLocked: staff === null,
      signIn,
      lock,
      setTerminalKind,
      setServiceMode,
      hasRole,
    }),
    [
      staff,
      terminalKind,
      serviceMode,
      signIn,
      lock,
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
