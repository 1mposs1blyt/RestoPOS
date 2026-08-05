import { describe, expect, it } from "vitest";
import type { Payment, PaymentKind } from "@restopos/shared-types";
import { refundablePayments, refundableTotal, refundedTotal } from "./refund";

let seq = 0;

function payment(
  patch: Partial<Payment> & { amount: string; kind: PaymentKind },
): Payment {
  seq += 1;
  return {
    id: `p${seq}`,
    orderId: "o1",
    cashShiftId: "c1",
    paymentTypeId: patch.kind === "cash" ? "pt-cash" : "pt-card",
    label: patch.kind === "cash" ? "Наличные" : "Банковские карты",
    tipAmount: "0.00",
    tendered: null,
    staffId: "s1",
    refundOf: null,
    paidAt: "2026-08-05T10:00:00.000Z",
    ...patch,
  };
}

describe("что по чеку можно вернуть", () => {
  it("чек без возвратов возвращается целиком", () => {
    const payments = [
      payment({ id: "p-cash", kind: "cash", amount: "300.00" }),
      payment({ id: "p-card", kind: "card", amount: "420.00" }),
    ];

    expect(refundablePayments(payments).map((p) => p.id)).toEqual([
      "p-cash",
      "p-card",
    ]);
    expect(refundableTotal(payments)).toBe("720.00");
    expect(refundedTotal(payments)).toBe("0.00");
  });

  it("возвращённая строка второй раз не возвращается", () => {
    // Второе нажатие «Возврат» — это деньги, отданные гостю дважды.
    // Экран блокирует кнопку, но состояние обязано быть защищено само.
    const payments = [
      payment({ id: "p-card", kind: "card", amount: "420.00" }),
      payment({
        id: "r-card",
        kind: "card",
        amount: "420.00",
        refundOf: "p-card",
      }),
    ];

    expect(refundablePayments(payments)).toEqual([]);
    expect(refundableTotal(payments)).toBe("0.00");
    expect(refundedTotal(payments)).toBe("420.00");
  });

  it("частично возвращённый чек отдаёт остаток строк", () => {
    const payments = [
      payment({ id: "p-cash", kind: "cash", amount: "300.00" }),
      payment({ id: "p-card", kind: "card", amount: "420.00" }),
      payment({
        id: "r-cash",
        kind: "cash",
        amount: "300.00",
        refundOf: "p-cash",
      }),
    ];

    expect(refundablePayments(payments).map((p) => p.id)).toEqual(["p-card"]);
    expect(refundableTotal(payments)).toBe("420.00");
    expect(refundedTotal(payments)).toBe("300.00");
  });

  it("возврат возврата невозможен", () => {
    // Встречная строка сама возвращаемой не является: иначе деньги ходили бы
    // туда-сюда бесконечно, и каждый круг оставлял бы след в Z-отчёте.
    const payments = [
      payment({
        id: "r-card",
        kind: "card",
        amount: "420.00",
        refundOf: "p-card",
      }),
    ];

    expect(refundablePayments(payments)).toEqual([]);
  });
});
