import type { MenuItem, OrderItem, UUID } from "@restopos/shared-types";
import { describe, expect, it } from "vitest";
import { computeTotals } from "../lib/discount";
import { lineTotal } from "../lib/order-price";
import { sumMoney, toMinor } from "../lib/money";
import { refundablePayments } from "../lib/refund";
import {
  fiscalPayments,
  fiscalRefundPayments,
  receiptItems,
} from "./checkout";
import { EMPTY_STATE, reducer, type OrdersState } from "./orders-reducer";
import { toPayment, type PaymentDraft } from "./orders";

/**
 * Состав чека возврата.
 *
 * Проверяется то, что ККТ отклоняет посреди расчёта с гостем: документ,
 * в котором сумма позиций не сошлась с суммой платежей. Со стороны
 * арифметики раскладка уже под тестом (`lib/receipt-lines.test.ts`),
 * а здесь — путь целиком: состав заказа → подытог → скидка → строки чека,
 * и то, что **возврат идёт по нему же**, а не собирается своим способом.
 *
 * Возврат берёт строки от текущего состава заказа, а платежи — от уже
 * записанных строк оплаты, то есть с другой стороны, чем продажа. Сойтись
 * они обязаны до копейки: разойдясь, они дадут отказ ККТ в момент, когда
 * деньги гостю уже отданы.
 */

const БОРЩ: UUID = "menu-борщ";
const ФО: UUID = "menu-фо";
const МОРС: UUID = "menu-морс";

/**
 * Меню **уже подорожало** после того, как заказ набрали: в чек обязана уйти
 * цена из позиции, а не эта.
 */
const MENU: MenuItem[] = [
  {
    id: БОРЩ,
    categoryId: "cat-1",
    name: "Борщ украинский с пампушками",
    price: "450.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
  {
    id: ФО,
    categoryId: "cat-1",
    name: "Фо Бо",
    price: "520.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
  {
    id: МОРС,
    categoryId: "cat-2",
    name: "Морс клюквенный",
    price: "150.00",
    isStopListed: false,
    prepStationId: "station-bar",
  },
];

const findMenuItem = (id: UUID): MenuItem | undefined =>
  MENU.find((item) => item.id === id);

function item(patch: Partial<OrderItem> & { id: UUID }): OrderItem {
  return {
    orderId: "order-1",
    menuItemId: БОРЩ,
    quantity: 1,
    status: "ready",
    modifierIds: [],
    ...patch,
  };
}

/**
 * Заказ, на котором видно всё сразу: три оплачиваемые позиции, сторнированная
 * и разделённая с долями. Цены в позициях ниже, чем в меню, — прейскурант
 * правили после набора.
 */
const ITEMS: OrderItem[] = [
  item({ id: "item-борщ", menuItemId: БОРЩ, price: "420.00" }),
  item({ id: "item-фо", menuItemId: ФО, quantity: 2, price: "480.00" }),
  item({ id: "item-морс", menuItemId: МОРС, quantity: 3, price: "150.00" }),
  item({
    id: "item-сторно",
    menuItemId: МОРС,
    price: "150.00",
    status: "voided",
  }),
];

/** Подытог считается ровно так же, как в `orders.tsx::orderSubtotal`. */
function subtotalOf(items: OrderItem[]) {
  return sumMoney(
    items
      .filter((it) => it.status !== "voided" && it.status !== "split")
      .map((it) => lineTotal(it, findMenuItem)),
  );
}

/**
 * Скидка суммой, а не процентом: процент делится между позициями нацело
 * и остатка не оставляет, а проверять надо как раз его раздачу.
 */
const TOTALS = computeTotals(subtotalOf(ITEMS), [
  { kind: "discount", mode: "amount", value: "100.00" },
]);

/** То, чем гость расплатился: часть наличными, часть картой. */
const DRAFTS: PaymentDraft[] = [
  { paymentTypeId: "pt-cash", amount: "1000.00", tendered: "2000.00" },
  { paymentTypeId: "pt-card", amount: "730.00", tendered: null },
];

/** Записанные строки оплаты — то, от чего пляшет возврат. */
const PAYMENTS = DRAFTS.map((draft) =>
  toPayment(draft, "order-1", "cash-shift-1", "staff-1"),
);

describe("состав чека", () => {
  it("подытог и итог заказа сходятся с ожидаемыми", () => {
    // 420 + 2×480 + 3×150 = 1830, минус скидка 100.
    expect(TOTALS.subtotal).toBe("1830.00");
    expect(TOTALS.total).toBe("1730.00");
  });

  it("строки продажи в сумме дают итог заказа и сумму платежей", () => {
    const lines = receiptItems(ITEMS, TOTALS.total, "vat20", findMenuItem);
    const payments = fiscalPayments(DRAFTS);

    const linesSum = lines.reduce((acc, line) => acc + (line.lineTotal ?? 0), 0);
    const paymentsSum = payments.reduce((acc, p) => acc + p.amount, 0);

    expect(linesSum).toBe(toMinor(TOTALS.total));
    expect(paymentsSum).toBe(linesSum);
  });

  it("сторнированная позиция в чек не идёт", () => {
    const lines = receiptItems(ITEMS, TOTALS.total, "vat20", findMenuItem);

    expect(lines).toHaveLength(3);
    expect(lines.map((line) => line.name)).toEqual([
      "Борщ украинский с пампушками",
      "Фо Бо",
      "Морс клюквенный",
    ]);
  });

  it("цена берётся из позиции, а не из подорожавшего меню", () => {
    const [борщ] = receiptItems(ITEMS, TOTALS.total, "vat20", findMenuItem);

    // В меню он уже 450, но гостю называли 420.
    expect(борщ.price).toBe(42000);
  });

  it("разделённое блюдо не печатается рядом со своими долями", () => {
    const split: OrderItem[] = [
      item({ id: "item-фо", menuItemId: ФО, price: "480.00", status: "split" }),
      item({
        id: "item-фо-1",
        menuItemId: ФО,
        quantity: 0.5,
        price: "480.00",
        splitOf: "item-фо",
      }),
      item({
        id: "item-фо-2",
        menuItemId: ФО,
        quantity: 0.5,
        price: "480.00",
        splitOf: "item-фо",
      }),
    ];

    const lines = receiptItems(
      split,
      subtotalOf(split),
      "vat20",
      findMenuItem,
    );

    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.quantityMilli)).toEqual([500, 500]);
    expect(lines.reduce((acc, line) => acc + (line.lineTotal ?? 0), 0)).toBe(
      48000,
    );
  });

  it("ставка НДС из карточки ККМ стоит в каждой строке", () => {
    const lines = receiptItems(ITEMS, TOTALS.total, "vat10", findMenuItem);

    expect(lines.every((line) => line.vat === "vat10")).toBe(true);
  });
});

describe("чек возврата повторяет чек продажи", () => {
  it("оплата не меняет состав, от которого соберётся возврат", () => {
    /*
     * Возврат собирает строки от **текущего** состава заказа, а не от того,
     * что было напечатано в проданном чеке: копии документа касса не хранит.
     * Держится это на том, что оплата состава не трогает, — проверяем прямо,
     * потому что иначе расхождение вылезет только на живой ККТ.
     */
    const state: OrdersState = {
      ...EMPTY_STATE,
      orders: {
        "order-1": {
          id: "order-1",
          venueId: "venue-1",
          tableId: "table-1",
          shiftId: "shift-1",
          number: 12,
          waiterId: "staff-1",
          status: "open",
          createdAt: "2026-08-25T10:00:00.000Z",
          clientId: "client-1",
        },
      },
      items: Object.fromEntries(ITEMS.map((it) => [it.id, it])),
    };

    const sale = receiptItems(ITEMS, TOTALS.total, "vat20", findMenuItem);

    const paid = reducer(state, {
      type: "order/pay",
      orderId: "order-1",
      payments: PAYMENTS,
      cashShiftNumber: 1,
    });

    const afterPay = Object.values(paid.items).filter(
      (it) => it.orderId === "order-1",
    );
    expect(receiptItems(afterPay, TOTALS.total, "vat20", findMenuItem)).toEqual(
      sale,
    );
  });

  it("платежи возврата совпадают с платежами продажи", () => {
    const sale = fiscalPayments(DRAFTS);
    const refund = fiscalRefundPayments(refundablePayments(PAYMENTS));

    // Продажа знает род оплаты из справочника, возврат — из снимка
    // в самом платеже. Разъехаться им нельзя: это один и тот же чек.
    expect(refund).toEqual(sale);
  });

  it("сумма строк возврата сходится с суммой возвращаемых платежей", () => {
    const lines = receiptItems(ITEMS, TOTALS.total, "vat20", findMenuItem);
    const payments = fiscalRefundPayments(refundablePayments(PAYMENTS));

    const linesSum = lines.reduce((acc, line) => acc + (line.lineTotal ?? 0), 0);
    const paymentsSum = payments.reduce((acc, p) => acc + p.amount, 0);

    expect(paymentsSum).toBe(linesSum);
    expect(paymentsSum).toBe(toMinor(TOTALS.total));
  });

  it("возврат по уже возвращённому чеку строк не даёт", () => {
    const [первый] = PAYMENTS;
    const встречная = {
      ...toPayment(DRAFTS[0], "order-1", "cash-shift-1", "staff-1"),
      refundOf: первый.id,
    };
    const [второй] = PAYMENTS.slice(1);

    const refundable = refundablePayments([...PAYMENTS, встречная]);

    // Возвращённой осталась только карта: наличные уже отданы.
    expect(fiscalRefundPayments(refundable)).toEqual([
      { kind: "cashless", amount: toMinor(второй.amount) },
    ]);
  });
});
