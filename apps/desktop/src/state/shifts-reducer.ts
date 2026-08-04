import type {
  CashOperation,
  CashShift,
  StaffShift,
  UUID,
} from "@restopos/shared-types";

/**
 * Редьюсер двух смен: личной (явка сотрудника) и кассовой (смена ФР).
 *
 * Вынесен из провайдера отдельным модулем по той же причине, что и редьюсер
 * заказов: это чистая функция с нетривиальными инвариантами (нумерация,
 * дедупликация, запрет закрывать закрытое), и её надо проверять тестами,
 * а не кликами по кассе.
 */

export interface ShiftsState {
  cashShifts: Record<UUID, CashShift>;
  staffShifts: Record<UUID, StaffShift>;
  cashOperations: Record<UUID, CashOperation>;
  /**
   * Последний выданный номер кассовой смены. Держим явно, а не считаем от числа
   * смен: закрытые смены со временем уедут на сервер и пропадут из локального
   * состояния, а нумерация обязана продолжиться, а не начаться заново.
   */
  lastCashShiftNumber: number;
}

export const EMPTY_SHIFTS: ShiftsState = {
  cashShifts: {},
  staffShifts: {},
  cashOperations: {},
  lastCashShiftNumber: 0,
};

export type ShiftsAction =
  | { type: "cashShift/open"; shift: CashShift }
  | { type: "cashShift/close"; shiftId: UUID; closedBy: UUID; at: string }
  | { type: "cash/operation"; operation: CashOperation }
  | { type: "staffShift/open"; shift: StaffShift }
  | { type: "staffShift/close"; shiftId: UUID; at: string }
  | {
      type: "staffShift/accept";
      shiftId: UUID;
      acceptedAt: string | null;
      acceptedUntil: string | null;
      approvedBy: UUID;
    };

export function openCashShiftOf(state: ShiftsState): CashShift | undefined {
  return Object.values(state.cashShifts).find(
    (shift) => shift.status === "open",
  );
}

export function openStaffShiftOf(
  state: ShiftsState,
  staffId: UUID,
): StaffShift | undefined {
  return Object.values(state.staffShifts).find(
    (shift) => shift.staffId === staffId && shift.status === "open",
  );
}

export function reducer(
  state: ShiftsState,
  action: ShiftsAction,
): ShiftsState {
  switch (action.type) {
    /*
     * Открытие кассовой смены дедуплицируется здесь, а не в вызывающем коде:
     * два вызова подряд видят один снимок состояния (эффект в StrictMode
     * выполняется дважды, по кнопке на сенсорном экране попадают двойным
     * касанием). Снаружи повтор не отличить от первого раза — а результатом
     * были бы две открытые смены с разными номерами, и Z-отчёт свести уже нельзя.
     */
    case "cashShift/open": {
      if (openCashShiftOf(state)) return state;
      const number = state.lastCashShiftNumber + 1;
      const shift: CashShift = { ...action.shift, number };
      return {
        ...state,
        cashShifts: { ...state.cashShifts, [shift.id]: shift },
        lastCashShiftNumber: number,
      };
    }

    case "cashShift/close": {
      const shift = state.cashShifts[action.shiftId];
      // Закрывать закрытое нельзя: перезапись `closedAt` сдвинула бы границу
      // смены задним числом, а по ней уже посчитан Z-отчёт.
      if (!shift || shift.status === "closed") return state;
      return {
        ...state,
        cashShifts: {
          ...state.cashShifts,
          [shift.id]: {
            ...shift,
            status: "closed",
            closedBy: action.closedBy,
            closedAt: action.at,
          },
        },
      };
    }

    // Движения по ящику append-only и иммутабельны (инвариант №6): ошибочное
    // изъятие исправляется встречным внесением, а не правкой суммы.
    case "cash/operation":
      if (state.cashOperations[action.operation.id]) return state;
      return {
        ...state,
        cashOperations: {
          ...state.cashOperations,
          [action.operation.id]: action.operation,
        },
      };

    // У сотрудника не может быть двух открытых явок разом: иначе отработанное
    // время задвоится в расчёте по зарплате.
    case "staffShift/open": {
      if (openStaffShiftOf(state, action.shift.staffId)) return state;
      return {
        ...state,
        staffShifts: {
          ...state.staffShifts,
          [action.shift.id]: action.shift,
        },
      };
    }

    case "staffShift/close": {
      const shift = state.staffShifts[action.shiftId];
      if (!shift || shift.status === "closed") return state;
      return {
        ...state,
        staffShifts: {
          ...state.staffShifts,
          [shift.id]: { ...shift, status: "closed", closedAt: action.at },
        },
      };
    }

    /*
     * Зачёт времени, отличного от фактического, — это «серая зона» из табеля.
     * Правится только зачтённое, фактические `openedAt`/`closedAt` неизменны:
     * иначе исчезнет сам факт расхождения, ради которого экран и нужен.
     */
    case "staffShift/accept": {
      const shift = state.staffShifts[action.shiftId];
      if (!shift) return state;
      return {
        ...state,
        staffShifts: {
          ...state.staffShifts,
          [shift.id]: {
            ...shift,
            acceptedAt: action.acceptedAt,
            acceptedUntil: action.acceptedUntil,
            approvedBy: action.approvedBy,
          },
        },
      };
    }

    default:
      return state;
  }
}
