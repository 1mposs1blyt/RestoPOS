import { describe, expect, it } from "vitest";
import type { CashShift, StaffShift } from "@restopos/shared-types";
import {
  EMPTY_SHIFTS,
  openCashShiftOf,
  openStaffShiftOf,
  reducer,
  type ShiftsState,
} from "./shifts-reducer";

function cashShift(id: string): CashShift {
  return {
    id,
    venueId: "v1",
    terminalId: "t1",
    number: 0,
    status: "open",
    openedBy: "s1",
    closedBy: null,
    openedAt: "2026-08-04T06:00:00.000Z",
    closedAt: null,
    openingFloat: "5000.00",
  };
}

function staffShift(id: string, staffId: string): StaffShift {
  return {
    id,
    venueId: "v1",
    staffId,
    status: "open",
    openedAt: "2026-08-04T06:00:00.000Z",
    closedAt: null,
    acceptedAt: null,
    acceptedUntil: null,
    approvedBy: null,
  };
}

describe("кассовая смена", () => {
  it("нумеруется редьюсером, а не вызывающим кодом", () => {
    const opened = reducer(EMPTY_SHIFTS, {
      type: "cashShift/open",
      shift: cashShift("c1"),
    });

    expect(opened.cashShifts.c1.number).toBe(1);
    expect(opened.lastCashShiftNumber).toBe(1);
  });

  it("продолжает нумерацию после закрытия предыдущей", () => {
    let state = reducer(EMPTY_SHIFTS, {
      type: "cashShift/open",
      shift: cashShift("c1"),
    });
    state = reducer(state, {
      type: "cashShift/close",
      shiftId: "c1",
      closedBy: "s1",
      at: "2026-08-04T20:00:00.000Z",
    });
    state = reducer(state, {
      type: "cashShift/open",
      shift: cashShift("c2"),
    });

    expect(state.cashShifts.c2.number).toBe(2);
  });

  /*
   * Двойное касание по кнопке открытия и двойной прогон эффекта в StrictMode
   * снаружи неотличимы от первого вызова. Две открытые смены с разными номерами
   * означают, что Z-отчёт свести уже нельзя.
   */
  it("не открывает вторую смену, пока первая открыта", () => {
    const first = reducer(EMPTY_SHIFTS, {
      type: "cashShift/open",
      shift: cashShift("c1"),
    });
    const second = reducer(first, {
      type: "cashShift/open",
      shift: cashShift("c2"),
    });

    expect(second).toBe(first);
    expect(Object.keys(second.cashShifts)).toEqual(["c1"]);
  });

  it("не перезакрывает закрытую смену", () => {
    let state = reducer(EMPTY_SHIFTS, {
      type: "cashShift/open",
      shift: cashShift("c1"),
    });
    state = reducer(state, {
      type: "cashShift/close",
      shiftId: "c1",
      closedBy: "s1",
      at: "2026-08-04T20:00:00.000Z",
    });
    const again = reducer(state, {
      type: "cashShift/close",
      shiftId: "c1",
      closedBy: "s2",
      at: "2026-08-04T23:00:00.000Z",
    });

    expect(again).toBe(state);
    expect(again.cashShifts.c1.closedAt).toBe("2026-08-04T20:00:00.000Z");
  });

  it("после закрытия открытой смены нет", () => {
    let state = reducer(EMPTY_SHIFTS, {
      type: "cashShift/open",
      shift: cashShift("c1"),
    });
    expect(openCashShiftOf(state)?.id).toBe("c1");

    state = reducer(state, {
      type: "cashShift/close",
      shiftId: "c1",
      closedBy: "s1",
      at: "2026-08-04T20:00:00.000Z",
    });
    expect(openCashShiftOf(state)).toBeUndefined();
  });
});

describe("движения по ящику", () => {
  const base: ShiftsState = reducer(EMPTY_SHIFTS, {
    type: "cashShift/open",
    shift: cashShift("c1"),
  });

  it("накапливаются append-only", () => {
    let state = reducer(base, {
      type: "cash/operation",
      operation: {
        id: "o1",
        cashShiftId: "c1",
        kind: "deposit",
        amount: "1000.00",
        staffId: "s1",
        approvedBy: null,
        comment: "размен",
        createdAt: "2026-08-04T07:00:00.000Z",
      },
    });
    state = reducer(state, {
      type: "cash/operation",
      operation: {
        id: "o2",
        cashShiftId: "c1",
        kind: "withdrawal",
        amount: "500.00",
        staffId: "s1",
        approvedBy: "s9",
        comment: "инкассация",
        createdAt: "2026-08-04T19:00:00.000Z",
      },
    });

    expect(Object.keys(state.cashOperations)).toEqual(["o1", "o2"]);
  });

  it("повтор с тем же идентификатором не задваивает сумму", () => {
    const operation = {
      id: "o1",
      cashShiftId: "c1",
      kind: "deposit" as const,
      amount: "1000.00",
      staffId: "s1",
      approvedBy: null,
      comment: "размен",
      createdAt: "2026-08-04T07:00:00.000Z",
    };
    const once = reducer(base, { type: "cash/operation", operation });
    const twice = reducer(once, { type: "cash/operation", operation });

    expect(twice).toBe(once);
  });
});

describe("личная смена", () => {
  it("у сотрудника не бывает двух открытых явок", () => {
    const first = reducer(EMPTY_SHIFTS, {
      type: "staffShift/open",
      shift: staffShift("p1", "s1"),
    });
    const second = reducer(first, {
      type: "staffShift/open",
      shift: staffShift("p2", "s1"),
    });

    expect(second).toBe(first);
  });

  it("разные сотрудники работают одновременно", () => {
    let state = reducer(EMPTY_SHIFTS, {
      type: "staffShift/open",
      shift: staffShift("p1", "s1"),
    });
    state = reducer(state, {
      type: "staffShift/open",
      shift: staffShift("p2", "s2"),
    });

    expect(openStaffShiftOf(state, "s1")?.id).toBe("p1");
    expect(openStaffShiftOf(state, "s2")?.id).toBe("p2");
  });

  it("закрытая явка освобождает сотрудника для новой", () => {
    let state = reducer(EMPTY_SHIFTS, {
      type: "staffShift/open",
      shift: staffShift("p1", "s1"),
    });
    state = reducer(state, {
      type: "staffShift/close",
      shiftId: "p1",
      at: "2026-08-04T15:00:00.000Z",
    });
    state = reducer(state, {
      type: "staffShift/open",
      shift: staffShift("p2", "s1"),
    });

    expect(openStaffShiftOf(state, "s1")?.id).toBe("p2");
  });

  /*
   * Зачёт правит только зачтённое время. Фактические метки неизменны: иначе
   * исчезнет само расхождение с расписанием, ради которого табель и нужен.
   */
  it("зачёт времени не трогает фактические метки", () => {
    let state = reducer(EMPTY_SHIFTS, {
      type: "staffShift/open",
      shift: staffShift("p1", "s1"),
    });
    state = reducer(state, {
      type: "staffShift/accept",
      shiftId: "p1",
      acceptedAt: "2026-08-04T07:00:00.000Z",
      acceptedUntil: null,
      approvedBy: "s9",
    });

    expect(state.staffShifts.p1.openedAt).toBe("2026-08-04T06:00:00.000Z");
    expect(state.staffShifts.p1.acceptedAt).toBe("2026-08-04T07:00:00.000Z");
    expect(state.staffShifts.p1.approvedBy).toBe("s9");
  });
});
