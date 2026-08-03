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
import { loadState, saveState } from "../lib/storage";
import {
  DEMO_SHIFT_ID,
  DEMO_VENUE,
  approve,
  authenticate,
} from "../data/session-source";
import { useEntitlements } from "./entitlements";
import { routesFor } from "./navigation";

/**
 * Смена терминала: кто за кассой, какое заведение, какой тип терминала.
 *
 * Откуда берутся сотрудник и его права, знает только `data/session-source`:
 * узел, если он настроен, иначе демо-данные. Сюда это приходит уже одинаковой
 * формы, поэтому появление узла не потребует править ни сессию, ни экраны.
 */

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
   * Подтверждение действия чужим PIN — без смены сотрудника за терминалом
   * (см. `access.tsx`). Вход и подтверждение разведены намеренно: подтверждение
   * не должно превращаться в режим «менеджер за спиной».
   *
   * Проверку «есть ли у предъявителя это право» делает источник: в демо-режиме
   * локально, с узлом — сервер, выдавая одноразовый токен на конкретное
   * действие. Экранам разница не видна.
   */
  approve: (
    pin: string,
    permission: Permission,
    entityId?: UUID,
  ) => Promise<Staff>;
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

const EMPTY_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>();

export function SessionProvider({ children }: { children: ReactNode }) {
  const { features } = useEntitlements();
  const [staff, setStaff] = useState<Staff | null>(null);
  /*
   * Права держим отдельным состоянием, а не выводим из роли на месте: с узлом
   * они приезжают готовым списком, и когда права станут настраиваемыми
   * на организацию, здесь не изменится ничего.
   */
  const [permissions, setPermissions] =
    useState<ReadonlySet<Permission>>(EMPTY_PERMISSIONS);
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
        permissions: authenticated.permissions,
        features,
      });

      if (available.length === 0) {
        throw new Error(
          `${roleLabel(authenticated.staff.role)}: на этом терминале нет доступных экранов`,
        );
      }

      setStaff(authenticated.staff);
      setPermissions(authenticated.permissions);
    },
    [terminalKind, serviceMode, features],
  );

  const lock = useCallback(() => {
    setStaff(null);
    setPermissions(EMPTY_PERMISSIONS);
  }, []);

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
      permissions,
      isLocked: staff === null,
      signIn,
      lock,
      approve,
      setTerminalKind,
      setServiceMode,
      hasRole,
    }),
    [
      staff,
      permissions,
      terminalKind,
      serviceMode,
      stationId,
      setStationId,
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
