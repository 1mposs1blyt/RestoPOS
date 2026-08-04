import { describe, expect, it } from "vitest";
import type {
  CashShift,
  Order,
  OrderDiscount,
  OrderItem,
  Payment,
  PaymentKind,
} from "@restopos/shared-types";
import { REPORTS, reportGroups, type ReportContext } from "./reports";

/**
 * Отчёты — единственное, что читает управляющий, чтобы понять, сошлась ли
 * смена. Расхождение здесь заметят не сразу и будут искать долго, поэтому
 * каждый отчёт проверяем на данных, где ответ известен заранее.
 *
 * Блюда берутся из демо-меню (`state/menu.ts`): «Борщ с говядиной» — 420 ₽.
 */
const SHIFT: CashShift = {
  id: "c1",
  venueId: "v1",
  terminalId: "t1",
  number: 1,
  status: "open",
  openedBy: "staff-2",
  closedBy: null,
  openedAt: "2026-08-04T06:00:00.000Z",
  closedAt: null,
  openingFloat: "5000.00",
};

function order(patch: Partial<Order> & { id: string }): Order {
  return {
    venueId: "v1",
    tableId: "t1",
    shiftId: "s1",
    waiterId: "staff-1",
    status: "paid",
    number: 1,
    cashShiftNumber: 1,
    receiptNumber: 1,
    createdAt: "2026-08-04T10:00:00.000Z",
    ...patch,
  };
}

function item(patch: Partial<OrderItem> & { id: string }): OrderItem {
  return {
    orderId: "o1",
    menuItemId: "item-borsch",
    quantity: 1,
    status: "served",
    modifierIds: [],
    ...patch,
  };
}

function payment(
  patch: Partial<Payment> & { id: string; amount: string; kind: PaymentKind },
): Payment {
  return {
    orderId: "o1",
    cashShiftId: "c1",
    paymentTypeId: `pt-${patch.kind}`,
    label: patch.kind === "cash" ? "Наличные" : "Карты",
    tipAmount: "0.00",
    tendered: null,
    staffId: "staff-2",
    refundOf: null,
    paidAt: "2026-08-04T10:30:00.000Z",
    ...patch,
  };
}

function context(patch: Partial<ReportContext> = {}): ReportContext {
  return {
    orders: [],
    items: [],
    payments: [],
    discounts: [],
    operations: [],
    cashShift: SHIFT,
    ...patch,
  };
}

function discount(
  patch: Partial<OrderDiscount> & { id: string; amount: string },
): OrderDiscount {
  return {
    orderId: "o1",
    discountTypeId: "dt-guest-10",
    kind: "discount",
    mode: "percent",
    label: "Гостевая 10%",
    value: "10",
    orderItemId: null,
    staffId: "staff-2",
    approvedBy: null,
    appliedAt: "2026-08-04T10:20:00.000Z",
    ...patch,
  };
}

function run(code: string, ctx: ReportContext) {
  const report = REPORTS.find((entry) => entry.code === code);
  if (!report) throw new Error(`Нет отчёта ${code}`);
  return report.run(ctx);
}

describe("011 выручка по типам оплаты", () => {
  it("складывает по типам и даёт итог", () => {
    const table = run(
      "011",
      context({
        payments: [
          payment({ id: "p1", kind: "cash", amount: "300.00" }),
          payment({ id: "p2", kind: "cash", amount: "200.00" }),
          payment({ id: "p3", kind: "card", amount: "1000.00" }),
        ],
      }),
    );

    expect(table.rows).toHaveLength(2);
    expect(table.footer?.amount).toBe("1500.00");
  });

  it("возврат вычитается, а не задваивает выручку", () => {
    const sale = payment({ id: "p1", kind: "card", amount: "1000.00" });
    const table = run(
      "011",
      context({
        payments: [
          sale,
          payment({ id: "p2", kind: "card", amount: "1000.00", refundOf: "p1" }),
        ],
      }),
    );

    expect(table.footer?.amount).toBe("0.00");
  });

  it("чужая смена в отчёт не попадает", () => {
    const table = run(
      "011",
      context({
        payments: [
          payment({ id: "p1", kind: "cash", amount: "300.00" }),
          payment({ id: "p2", kind: "cash", amount: "999.00", cashShiftId: "c2" }),
        ],
      }),
    );

    expect(table.footer?.amount).toBe("300.00");
  });
});

describe("023 продажи блюд", () => {
  it("суммирует одинаковые блюда из разных заказов", () => {
    const table = run(
      "023",
      context({
        orders: [order({ id: "o1" }), order({ id: "o2", receiptNumber: 2 })],
        items: [
          item({ id: "i1", orderId: "o1" }),
          item({ id: "i2", orderId: "o2" }),
        ],
      }),
    );

    expect(table.rows).toHaveLength(1);
    expect(table.rows[0].qty).toBe("2");
    expect(table.rows[0].amount).toBe("840.00");
  });

  /*
   * Сторно и разделённый исходник в продажи не идут: за первое не платят,
   * за второе платят его доли. Посчитав оба, отчёт покажет вдвое больше еды,
   * чем вышло с кухни.
   */
  it("не считает сторнированное и разделённое", () => {
    const table = run(
      "023",
      context({
        orders: [order({ id: "o1" })],
        items: [
          item({ id: "i1", status: "voided" }),
          item({ id: "i2", status: "split" }),
          item({ id: "i3", quantity: 0.5, splitOf: "i2" }),
          item({ id: "i4", quantity: 0.5, splitOf: "i2" }),
        ],
      }),
    );

    expect(table.rows[0].qty).toBe("1");
    expect(table.rows[0].amount).toBe("420.00");
  });

  it("неоплаченный заказ в продажи не идёт", () => {
    const table = run(
      "023",
      context({
        orders: [order({ id: "o1", status: "open" })],
        items: [item({ id: "i1" })],
      }),
    );

    expect(table.rows).toHaveLength(0);
  });
});

describe("048 итого по смене", () => {
  it("ожидаемая наличность считается только по наличным", () => {
    const table = run(
      "048",
      context({
        orders: [order({ id: "o1" })],
        items: [item({ id: "i1" })],
        payments: [
          payment({ id: "p1", kind: "cash", amount: "300.00" }),
          payment({ id: "p2", kind: "card", amount: "1000.00" }),
        ],
      }),
    );

    expect(table.footer?.value).toBe("5300.00");
  });

  it("«без выручки» в выручку не идёт", () => {
    const table = run(
      "048",
      context({
        orders: [order({ id: "o1" })],
        items: [item({ id: "i1" })],
        payments: [
          payment({ id: "p1", kind: "cash", amount: "500.00" }),
          payment({ id: "p2", kind: "no_revenue", amount: "400.00" }),
        ],
      }),
    );

    const revenue = table.rows.find((row) => row.label === "Выручка");
    expect(revenue?.value).toBe("500.00");
  });

  it("без чеков средний чек — прочерк, а не ноль", () => {
    const table = run("048", context());
    const average = table.rows.find((row) => row.label === "Средний чек");
    expect(average?.value).toBe("—");
  });
});

describe("046 реестр счетов", () => {
  it("сортируется по номеру чека", () => {
    const table = run(
      "046",
      context({
        orders: [
          order({ id: "o1", number: 5, receiptNumber: 2 }),
          order({ id: "o2", number: 3, receiptNumber: 1 }),
        ],
        items: [item({ id: "i1", orderId: "o1" }), item({ id: "i2", orderId: "o2" })],
      }),
    );

    expect(table.rows.map((row) => row.receipt)).toEqual(["1", "2"]);
    expect(table.footer?.amount).toBe("840.00");
  });
});

/*
 * Реальный баг: отчёты по позициям (013, 046) считали выручку по прайсу
 * и расходились с отчётом по платежам (011) ровно на скидку. Управляющий
 * при сверке смены видел две разные выручки, и обе выглядели правдоподобно.
 */
describe("согласованность отчётов при скидке", () => {
  // Борщ 420 × 2 = 840, скидка 10% = 84, к оплате 756.
  const withDiscount = context({
    orders: [order({ id: "o1" })],
    items: [item({ id: "i1", quantity: 2 })],
    discounts: [discount({ id: "d1", amount: "84.00" })],
    payments: [payment({ id: "p1", kind: "cash", amount: "756.00" })],
  });

  it("выручка по официантам считается со скидкой", () => {
    expect(run("013", withDiscount).footer?.amount).toBe("756.00");
  });

  it("реестр счетов показывает уплаченную сумму, а не по прайсу", () => {
    expect(run("046", withDiscount).footer?.amount).toBe("756.00");
  });

  it("все денежные отчёты сходятся между собой", () => {
    const byPayment = run("011", withDiscount).footer?.amount;
    const byWaiter = run("013", withDiscount).footer?.amount;
    const registry = run("046", withDiscount).footer?.amount;

    expect(byWaiter).toBe(byPayment);
    expect(registry).toBe(byPayment);
  });

  it("продажи блюд остаются по прайсу — это отчёт про еду, не про деньги", () => {
    // Здесь скидка не вычитается намеренно: столько блюд ушло с кухни.
    expect(run("023", withDiscount).footer?.amount).toBe("840.00");
  });
});

describe("036 скидки и надбавки", () => {
  it("разводит скидки и надбавки по разным колонкам", () => {
    const table = run(
      "036",
      context({
        orders: [order({ id: "o1" })],
        items: [item({ id: "i1", quantity: 2 })],
        discounts: [
          discount({ id: "d1", amount: "84.00" }),
          discount({
            id: "d2",
            amount: "84.00",
            kind: "surcharge",
            label: "Обслуживание 10%",
          }),
        ],
        payments: [payment({ id: "p1", kind: "cash", amount: "840.00" })],
      }),
    );

    // В сумме ноль, но это две строки, а не «ничего не было».
    expect(table.footer?.discount).toBe("84.00");
    expect(table.footer?.surcharge).toBe("84.00");
    expect(table.rows).toHaveLength(2);
  });

  it("показывает, кто подтвердил скидку", () => {
    const table = run(
      "036",
      context({
        orders: [order({ id: "o1" })],
        items: [item({ id: "i1" })],
        discounts: [discount({ id: "d1", amount: "42.00", approvedBy: "staff-3" })],
        payments: [payment({ id: "p1", kind: "cash", amount: "378.00" })],
      }),
    );

    expect(table.rows[0].approved).toBe("Мария Дёмина");
  });

  it("скидка на ещё не оплаченный заказ в отчёт не идёт", () => {
    const table = run(
      "036",
      context({
        orders: [order({ id: "o1", status: "open" })],
        items: [item({ id: "i1" })],
        discounts: [discount({ id: "d1", amount: "42.00" })],
      }),
    );

    expect(table.rows).toHaveLength(0);
  });
});

describe("каталог", () => {
  it("группирует отчёты и сортирует по кодам", () => {
    const groups = reportGroups();

    expect(groups.length).toBeGreaterThan(0);
    for (const { reports } of groups) {
      const codes = reports.map((report) => report.code);
      expect([...codes].sort()).toEqual(codes);
    }
  });

  it("коды уникальны", () => {
    // По коду отчёт ищут и называют вслух — два одинаковых означают
    // разговор про разные бумаги под одним именем.
    const codes = REPORTS.map((report) => report.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("любой отчёт переживает пустую смену", () => {
    for (const report of REPORTS) {
      expect(() => report.run(context({ cashShift: undefined }))).not.toThrow();
    }
  });
});
