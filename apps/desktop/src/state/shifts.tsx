import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  CashOperationKind,
  CashShift,
  Money,
  StaffShift,
  UUID,
} from "@restopos/shared-types";
import { loadState, newId, saveState } from "../lib/storage";
import {
  EMPTY_SHIFTS,
  openCashShiftOf,
  openStaffShiftOf,
  reducer,
  type ShiftsState,
} from "./shifts-reducer";

/**
 * Две смены терминала.
 *
 * Разделение личной и кассовой смены — не удобство, а требование предметной
 * области (см. `docs/iiko-reference.md`): официант уходит домой, не закрывая
 * кассовый день, а кассовая смена закрывается один раз за сутки, пока через
 * терминал прошло четверо. Свести их в одну «смену» — потерять либо табель,
 * либо фискальную отчётность.
 *
 * Личная смена открывается **входом**, а не кнопкой: приложил PIN — значит,
 * пришёл на работу. Закрывается явно, с личной страницы, потому что уход
 * с работы это решение, а не побочный эффект блокировки экрана.
 */

const STORAGE_KEY = "shifts";

interface ShiftsValue {
  state: ShiftsState;
  /** Открытая кассовая смена или `undefined`, если день не начат. */
  cashShift: CashShift | undefined;
  /** Личная смена того, кто сейчас за терминалом. `undefined` — не открыта. */
  myShift: StaffShift | undefined;
  /** Ведётся ли для этого входа табель. Ложь у вендорского `support`. */
  tracksAttendance: boolean;
  /** Отметить приход. Явку заводит человек, а не факт входа по PIN. */
  openMyShift: () => void;
  /** Все открытые личные смены — для табеля и «сменить кассира». */
  openStaffShifts: StaffShift[];
  /** Отработано текущим сотрудником, в минутах. */
  workedMinutes: (shift: StaffShift, now?: Date) => number;

  openCashShift: (openingFloat: Money) => void;
  closeCashShift: () => void;
  /** Движение по ящику. `approvedBy` — если право подтверждалось чужим PIN. */
  recordCash: (
    kind: CashOperationKind,
    amount: Money,
    comment: string,
    approvedBy?: UUID | null,
  ) => void;
  closeMyShift: () => void;
  acceptStaffShift: (
    shiftId: UUID,
    acceptedAt: string | null,
    acceptedUntil: string | null,
  ) => void;
}

const ShiftsContext = createContext<ShiftsValue | null>(null);

export function ShiftsProvider({
  venueId,
  terminalId,
  staffId,
  tracksAttendance,
  children,
}: {
  venueId: UUID;
  terminalId: UUID;
  /** Кто за терминалом. Провайдер живёт внутри разблокированной сессии. */
  staffId: UUID;
  /**
   * Заводить ли этому входу личную смену. Ложь для вендорского `support`:
   * он не сотрудник организации (`docs/access.md`), и его визит не должен
   * попадать в табель и в расчёт по зарплате. Решается правом `staff.self`,
   * а не сравнением роли — роль в коде не проверяем.
   */
  tracksAttendance: boolean;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    loadState<ShiftsState>(STORAGE_KEY, EMPTY_SHIFTS),
  );

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  /*
   * Личная смена открывается КНОПКОЙ, а не входом по PIN.
   *
   * Раньше она открывалась автоматически: приложил пин — значит пришёл
   * на работу. Это неверно. За терминал подходят и между делом: посмотреть
   * заказ, подтвердить чужое сторно, глянуть отчёт — и каждый такой заход
   * заводил бы явку, из которой потом считается зарплата. Отработанное время
   * должно начинаться там, где человек это подтвердил.
   *
   * Дедупликация всё равно живёт в редьюсере: двойное касание по кнопке
   * на сенсорном экране — норма, и оба обработчика видят один снимок состояния.
   */
  const openMyShift = useCallback(() => {
    if (!tracksAttendance) return;
    dispatch({
      type: "staffShift/open",
      shift: {
        id: newId(),
        venueId,
        staffId,
        status: "open",
        openedAt: new Date().toISOString(),
        closedAt: null,
        acceptedAt: null,
        acceptedUntil: null,
        approvedBy: null,
        clientId: newId(),
      },
    });
  }, [venueId, staffId, tracksAttendance]);

  const cashShift = useMemo(() => openCashShiftOf(state), [state]);
  const myShift = useMemo(
    () => openStaffShiftOf(state, staffId),
    [state, staffId],
  );

  const openStaffShifts = useMemo(
    () =>
      Object.values(state.staffShifts)
        .filter((shift) => shift.status === "open")
        .sort((a, b) => a.openedAt.localeCompare(b.openedAt)),
    [state.staffShifts],
  );

  const openCashShift = useCallback(
    (openingFloat: Money) => {
      const shiftId = newId();
      dispatch({
        type: "cashShift/open",
        shift: {
          id: shiftId,
          venueId,
          terminalId,
          // Номер присвоит редьюсер: здесь он не известен, и два вызова подряд
          // выдали бы один и тот же.
          number: 0,
          status: "open",
          openedBy: staffId,
          closedBy: null,
          openedAt: new Date().toISOString(),
          closedAt: null,
          openingFloat,
          clientId: newId(),
        },
      });
    },
    [venueId, terminalId, staffId],
  );

  const recordCash = useCallback(
    (
      kind: CashOperationKind,
      amount: Money,
      comment: string,
      approvedBy: UUID | null = null,
    ) => {
      // Движение без смены не к чему привязать: X-отчёт считается по смене.
      if (!cashShift) return;
      dispatch({
        type: "cash/operation",
        operation: {
          id: newId(),
          cashShiftId: cashShift.id,
          kind,
          amount,
          staffId,
          approvedBy,
          comment,
          createdAt: new Date().toISOString(),
          clientId: newId(),
        },
      });
    },
    [cashShift, staffId],
  );

  const value = useMemo<ShiftsValue>(
    () => ({
      state,
      cashShift,
      myShift,
      tracksAttendance,
      openMyShift,
      openStaffShifts,
      workedMinutes: (shift, now = new Date()) => {
        const from = new Date(shift.acceptedAt ?? shift.openedAt).getTime();
        const to = new Date(
          shift.acceptedUntil ?? shift.closedAt ?? now.toISOString(),
        ).getTime();
        return Math.max(0, Math.round((to - from) / 60000));
      },
      openCashShift,
      closeCashShift: () => {
        if (!cashShift) return;
        dispatch({
          type: "cashShift/close",
          shiftId: cashShift.id,
          closedBy: staffId,
          at: new Date().toISOString(),
        });
      },
      recordCash,
      closeMyShift: () => {
        if (!myShift) return;
        dispatch({
          type: "staffShift/close",
          shiftId: myShift.id,
          at: new Date().toISOString(),
        });
      },
      acceptStaffShift: (shiftId, acceptedAt, acceptedUntil) =>
        dispatch({
          type: "staffShift/accept",
          shiftId,
          acceptedAt,
          acceptedUntil,
          approvedBy: staffId,
        }),
    }),
    [
      state,
      cashShift,
      myShift,
      tracksAttendance,
      openMyShift,
      openStaffShifts,
      openCashShift,
      recordCash,
      staffId,
    ],
  );

  return (
    <ShiftsContext.Provider value={value}>{children}</ShiftsContext.Provider>
  );
}

export function useShifts(): ShiftsValue {
  const value = useContext(ShiftsContext);
  if (!value) {
    throw new Error("useShifts вызван вне ShiftsProvider");
  }
  return value;
}
