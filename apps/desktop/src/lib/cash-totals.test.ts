import { describe, expect, it } from "vitest";
import type {
  CashOperation,
  CashShift,
  Payment,
  PaymentKind,
} from "@restopos/shared-types";
import { cashShiftTotals } from "./cash-totals";

const SHIFT: CashShift = {
  id: "c1",
  venueId: "v1",
  terminalId: "t1",
  number: 1,
  status: "open",
  openedBy: "s1",
  closedBy: null,
  openedAt: "2026-08-04T06:00:00.000Z",
  closedAt: null,
  openingFloat: "5000.00",
};

let seq = 0;

function payment(
  patch: Partial<Payment> & { amount: string; kind: PaymentKind },
): Payment {
  seq += 1;
  const kindToType: Record<PaymentKind, [string, string]> = {
    cash: ["pt-cash", "Наличные"],
    card: ["pt-card", "Банковские карты"],
    external: ["pt-external", "Безнал. расчёт"],
    no_revenue: ["pt-no-revenue", "Без выручки"],
  };
  const [paymentTypeId, label] = kindToType[patch.kind];
  return {
    id: `p${seq}`,
    orderId: `o${seq}`,
    cashShiftId: "c1",
    paymentTypeId,
    label,
    tipAmount: "0.00",
    tendered: null,
    staffId: "s1",
    refundOf: null,
    paidAt: "2026-08-04T10:00:00.000Z",
    ...patch,
  };
}

function operation(
  kind: CashOperation["kind"],
  amount: string,
): CashOperation {
  seq += 1;
  return {
    id: `op${seq}`,
    cashShiftId: "c1",
    kind,
    amount,
    staffId: "s1",
    approvedBy: null,
    comment: "",
    createdAt: "2026-08-04T12:00:00.000Z",
  };
}

describe("свод кассовой смены", () => {
  it("пустая смена показывает только размен", () => {
    const totals = cashShiftTotals(SHIFT, [], []);

    expect(totals.revenue).toBe("0.00");
    expect(totals.expectedCash).toBe("5000.00");
    expect(totals.ordersCount).toBe(0);
    expect(totals.averageCheck).toBeNull();
  });

  /*
   * Самая дорогая ошибка в этом своде: включить карту в ожидаемую наличность.
   * Тогда при каждом пересчёте ящика вылезает недостача ровно на размер
   * безналичной выручки.
   */
  it("в ожидаемую наличность попадают только наличные платежи", () => {
    const totals = cashShiftTotals(
      SHIFT,
      [
        payment({ kind: "cash", amount: "300.00" }),
        payment({ kind: "card", amount: "1000.00" }),
        payment({ kind: "external", amount: "700.00" }),
      ],
      [],
    );

    expect(totals.revenue).toBe("2000.00");
    expect(totals.expectedCash).toBe("5300.00");
  });

  it("внесения и изъятия двигают ожидаемую наличность", () => {
    const totals = cashShiftTotals(
      SHIFT,
      [payment({ kind: "cash", amount: "300.00" })],
      [operation("deposit", "1000.00"), operation("collection", "2000.00")],
    );

    expect(totals.deposits).toBe("1000.00");
    expect(totals.withdrawals).toBe("2000.00");
    // 5000 размен + 300 наличных + 1000 внесено − 2000 изъято
    expect(totals.expectedCash).toBe("4300.00");
  });

  it("«без выручки» не идёт в выручку, но остаётся в разбивке по типам", () => {
    const totals = cashShiftTotals(
      SHIFT,
      [
        payment({ kind: "cash", amount: "500.00" }),
        payment({ kind: "no_revenue", amount: "400.00" }),
      ],
      [],
    );

    expect(totals.revenue).toBe("500.00");
    expect(
      totals.byPaymentType.find((row) => row.label === "Без выручки")?.amount,
    ).toBe("400.00");
  });

  it("возврат вычитается, а не задваивает выручку", () => {
    const sale = payment({ kind: "card", amount: "1000.00" });
    const refund = payment({
      kind: "card",
      amount: "1000.00",
      refundOf: sale.id,
      orderId: sale.orderId,
    });

    const totals = cashShiftTotals(SHIFT, [sale, refund], []);

    expect(totals.revenue).toBe("0.00");
    expect(totals.byPaymentType[0].amount).toBe("0.00");
  });

  it("возврат наличных уменьшает ожидаемую наличность", () => {
    const sale = payment({ kind: "cash", amount: "800.00" });
    const refund = payment({
      kind: "cash",
      amount: "800.00",
      refundOf: sale.id,
      orderId: sale.orderId,
    });

    expect(cashShiftTotals(SHIFT, [sale, refund], []).expectedCash).toBe(
      "5000.00",
    );
  });

  it("заказ, оплаченный двумя типами, считается одним чеком", () => {
    const totals = cashShiftTotals(
      SHIFT,
      [
        payment({ kind: "cash", amount: "300.00", orderId: "o-mixed" }),
        payment({ kind: "card", amount: "700.00", orderId: "o-mixed" }),
      ],
      [],
    );

    expect(totals.ordersCount).toBe(1);
    expect(totals.averageCheck).toBe("1000.00");
  });

  it("чужая смена в свод не попадает", () => {
    const totals = cashShiftTotals(
      SHIFT,
      [
        payment({ kind: "cash", amount: "300.00" }),
        payment({ kind: "cash", amount: "999.00", cashShiftId: "c2" }),
      ],
      [operation("deposit", "100.00"), { ...operation("deposit", "555.00"), cashShiftId: "c2" }],
    );

    expect(totals.revenue).toBe("300.00");
    expect(totals.deposits).toBe("100.00");
  });

  it("средний чек округляется до копейки", () => {
    const totals = cashShiftTotals(
      SHIFT,
      [
        payment({ kind: "cash", amount: "10.00", orderId: "a" }),
        payment({ kind: "cash", amount: "10.00", orderId: "b" }),
        payment({ kind: "cash", amount: "10.01", orderId: "c" }),
      ],
      [],
    );

    expect(totals.averageCheck).toBe("10.00");
  });
});
