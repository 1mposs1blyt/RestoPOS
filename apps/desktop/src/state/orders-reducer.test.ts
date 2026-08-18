import type { Order, OrderItem, Payment, UUID } from "@restopos/shared-types";
import { describe, expect, it } from "vitest";
import {
  EMPTY_STATE,
  nextOrderNumber,
  reducer,
  withOrderNumbers,
  type OrdersState,
} from "./orders-reducer";

/**
 * Инварианты заказов. Каждый тест здесь закрывает ошибку, которая уже была
 * или дорого стоит: задвоение позиции от двойного касания, потерянная позиция
 * при сторно, вечно висящий тикет станции без экрана.
 *
 * Станцию позиции редьюсер спрашивает у `stationOf` из самого действия,
 * а не у меню: меню приезжает с узла, а редьюсер обязан оставаться чистым.
 * Раскладка ниже повторяет демо-каталог — «Борщ» на кухне, «Морс» на баре, —
 * но теперь это видно прямо в тесте, а не подразумевается.
 */

const SHIFT: UUID = "shift-1";
const KITCHEN: UUID = "station-kitchen";
const BAR: UUID = "station-bar";

function order(patch: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    venueId: "venue-1",
    tableId: "table-1",
    shiftId: SHIFT,
    number: 0,
    waiterId: "staff-1",
    status: "open",
    createdAt: "2026-08-04T10:00:00.000Z",
    clientId: "client-1",
    ...patch,
  };
}

function item(patch: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "item-1",
    orderId: "order-1",
    menuItemId: "item-borsch",
    quantity: 1,
    status: "new",
    modifierIds: [],
    ...patch,
  };
}

function withOrder(patch: Partial<Order> = {}): OrdersState {
  const created = order(patch);
  return { ...EMPTY_STATE, orders: { [created.id]: created } };
}

describe("открытие заказа", () => {
  it("выдаёт первый номер в смене", () => {
    const next = reducer(EMPTY_STATE, { type: "order/open", order: order() });
    expect(next.orders["order-1"].number).toBe(1);
  });

  it("не открывает второй заказ на том же столе", () => {
    // StrictMode выполняет эффект дважды с одним снимком состояния —
    // снаружи повтор не отличить от первого раза.
    const first = reducer(EMPTY_STATE, { type: "order/open", order: order() });
    const second = reducer(first, {
      type: "order/open",
      order: order({ id: "order-2", clientId: "client-2" }),
    });
    expect(second).toBe(first);
    expect(Object.keys(second.orders)).toHaveLength(1);
  });

  it("разрешает новый заказ, когда прежний закрыт", () => {
    // Номер задан явно: `0` в фикстуре — это заглушка, которую редьюсер
    // заменяет при открытии, а у сохранённого заказа номер всегда настоящий.
    const paid = withOrder({ status: "paid", number: 1 });
    const next = reducer(paid, {
      type: "order/open",
      order: order({ id: "order-2" }),
    });
    expect(Object.keys(next.orders)).toHaveLength(2);
    expect(next.orders["order-2"].number).toBe(2);
  });

  it("нумерует независимо в разных сменах", () => {
    const state = withOrder({ number: 7 });
    expect(nextOrderNumber(state, SHIFT)).toBe(8);
    expect(nextOrderNumber(state, "shift-2")).toBe(1);
  });

  it("не переиспользует номер отменённого заказа", () => {
    const canceled = withOrder({ status: "canceled", number: 1 });
    const next = reducer(canceled, {
      type: "order/open",
      order: order({ id: "order-2" }),
    });
    expect(next.orders["order-2"].number).toBe(2);
  });

  it("на прилавке различает заказы без стола", () => {
    // `tableId: null` — заказ прилавка. Второй такой открыть нельзя,
    // пока первый не закрыт: на прилавке заказ всегда ровно один.
    const first = reducer(EMPTY_STATE, {
      type: "order/open",
      order: order({ tableId: null }),
    });
    const second = reducer(first, {
      type: "order/open",
      order: order({ id: "order-2", tableId: null }),
    });
    expect(second).toBe(first);
  });
});

describe("позиции до отправки", () => {
  it("склеивает повторное добавление в количество", () => {
    // Двойное касание по кнопке меню на сенсорном экране — норма.
    const state = withOrder();
    const once = reducer(state, { type: "item/add", item: item() });
    const twice = reducer(once, {
      type: "item/add",
      item: item({ id: "item-2" }),
    });
    expect(Object.keys(twice.items)).toHaveLength(1);
    expect(twice.items["item-1"].quantity).toBe(2);
  });

  it("не склеивает с уже отправленной позицией", () => {
    // Отправленную трогать нельзя, поэтому добавка создаёт новую строку.
    const state: OrdersState = {
      ...withOrder(),
      items: { "item-1": item({ status: "cooking" }) },
    };
    const next = reducer(state, { type: "item/add", item: item({ id: "item-2" }) });
    expect(Object.keys(next.items)).toHaveLength(2);
  });

  it("удаляет позицию при количестве меньше единицы", () => {
    const state: OrdersState = { ...withOrder(), items: { "item-1": item() } };
    const next = reducer(state, {
      type: "item/quantity",
      itemId: "item-1",
      quantity: 0,
    });
    expect(next.items["item-1"]).toBeUndefined();
  });

  it("не меняет количество отправленной позиции", () => {
    const state: OrdersState = {
      ...withOrder(),
      items: { "item-1": item({ status: "cooking" }) },
    };
    const next = reducer(state, {
      type: "item/quantity",
      itemId: "item-1",
      quantity: 5,
    });
    expect(next).toBe(state);
  });

  it("не удаляет отправленную позицию", () => {
    // Инвариант №6: append-only. Потерянная позиция — это либо несъеденное
    // блюдо, либо неоплаченное.
    const state: OrdersState = {
      ...withOrder(),
      items: { "item-1": item({ status: "cooking" }) },
    };
    expect(reducer(state, { type: "item/remove", itemId: "item-1" })).toBe(state);
  });
});

describe("отправка на кухню", () => {
  const state: OrdersState = {
    ...withOrder(),
    items: {
      "item-1": item({ menuItemId: "item-borsch" }),
      "item-2": item({ id: "item-2", menuItemId: "item-mors" }),
    },
  };

  it("переводит позиции в готовку и меняет статус заказа", () => {
    const next = reducer(state, {
      type: "order/send",
      orderId: "order-1",
      stationOf: (menuItemId) =>
        menuItemId === "item-mors" ? BAR : KITCHEN,
      autoReadyStationIds: [],
    });
    expect(next.items["item-1"].status).toBe("cooking");
    expect(next.items["item-2"].status).toBe("cooking");
    expect(next.orders["order-1"].status).toBe("sent_to_kitchen");
  });

  it("сразу помечает готовым то, что уехало на станцию без экрана", () => {
    // Иначе тикет висел бы вечно: двигать его статус на бумажной станции некому.
    const next = reducer(state, {
      type: "order/send",
      orderId: "order-1",
      stationOf: (menuItemId) =>
        menuItemId === "item-mors" ? BAR : KITCHEN,
      autoReadyStationIds: [BAR],
    });
    expect(next.items["item-1"].status).toBe("cooking");
    expect(next.items["item-2"].status).toBe("ready");
  });

  it("не трогает уже готовящиеся позиции при повторной отправке", () => {
    // Иначе повар потерял бы прогресс.
    const sent = reducer(state, {
      type: "order/send",
      orderId: "order-1",
      stationOf: (menuItemId) =>
        menuItemId === "item-mors" ? BAR : KITCHEN,
      autoReadyStationIds: [],
    });
    const ready = reducer(sent, {
      type: "item/status",
      itemId: "item-1",
      status: "ready",
    });
    const again = reducer(ready, {
      type: "order/send",
      orderId: "order-1",
      stationOf: (menuItemId) =>
        menuItemId === "item-mors" ? BAR : KITCHEN,
      autoReadyStationIds: [],
    });
    expect(again).toBe(ready);
  });

  it("игнорирует отправку заказа без новых позиций", () => {
    const empty = withOrder();
    expect(
      reducer(empty, {
        type: "order/send",
        orderId: "order-1",
        stationOf: (menuItemId) =>
        menuItemId === "item-mors" ? BAR : KITCHEN,
        autoReadyStationIds: [KITCHEN],
      }),
    ).toBe(empty);
  });
});

describe("сторно", () => {
  it("помечает отправленную позицию, но не удаляет её", () => {
    const state: OrdersState = {
      ...withOrder(),
      items: { "item-1": item({ status: "cooking" }) },
    };
    const next = reducer(state, { type: "item/void", itemId: "item-1" });
    expect(next.items["item-1"].status).toBe("voided");
    expect(Object.keys(next.items)).toHaveLength(1);
  });

  it("не сторнирует неотправленную позицию", () => {
    // Её удаляют, а не сторнируют: иначе в чеке остался бы след от того,
    // чего не было.
    const state: OrdersState = { ...withOrder(), items: { "item-1": item() } };
    expect(reducer(state, { type: "item/void", itemId: "item-1" })).toBe(state);
  });

  it("не сторнирует дважды", () => {
    const state: OrdersState = {
      ...withOrder(),
      items: { "item-1": item({ status: "voided" }) },
    };
    expect(reducer(state, { type: "item/void", itemId: "item-1" })).toBe(state);
  });
});

function payment(patch: Partial<Payment> & { id: string }): Payment {
  return {
    orderId: "order-1",
    cashShiftId: "cash-1",
    paymentTypeId: "pt-cash",
    kind: "cash",
    label: "Наличные",
    amount: "420.00",
    tipAmount: "0.00",
    tendered: null,
    staffId: "staff-1",
    refundOf: null,
    paidAt: "2026-08-04T10:30:00.000Z",
    ...patch,
  };
}

describe("деление блюда", () => {
  const served: OrdersState = {
    ...withOrder(),
    items: { "item-1": item({ status: "served" }) },
  };

  it("исходная позиция остаётся в чеке помеченной", () => {
    // Append-only (инвариант №6): блюдо приготовлено, стирать его нельзя.
    const next = reducer(served, {
      type: "item/split",
      itemId: "item-1",
      parts: [0.5, 0.5],
      ids: ["a", "b"],
    });

    expect(next.items["item-1"].status).toBe("split");
    expect(next.items.a.quantity).toBe(0.5);
    expect(next.items.b.quantity).toBe(0.5);
  });

  it("доли ссылаются на исходную позицию", () => {
    const next = reducer(served, {
      type: "item/split",
      itemId: "item-1",
      parts: [0.5, 0.5],
      ids: ["a", "b"],
    });

    expect(next.items.a.splitOf).toBe("item-1");
    expect(next.items.b.splitOf).toBe("item-1");
  });

  /*
   * Делят обычно уже поданное блюдо. Доля со статусом `new` уехала бы
   * на кухню второй раз, и повар приготовил бы полборща заново.
   */
  it("доли наследуют статус исходной позиции", () => {
    const next = reducer(served, {
      type: "item/split",
      itemId: "item-1",
      parts: [0.5, 0.5],
      ids: ["a", "b"],
    });

    expect(next.items.a.status).toBe("served");
    expect(next.items.b.status).toBe("served");
  });

  it("доли расходятся по гостям", () => {
    const next = reducer(served, {
      type: "item/split",
      itemId: "item-1",
      parts: [0.5, 0.5],
      ids: ["a", "b"],
      guestNumbers: [1, 2],
    });

    expect(next.items.a.guestNumber).toBe(1);
    expect(next.items.b.guestNumber).toBe(2);
  });

  /*
   * Делят еду, а не заказ. Неприготовленная позиция уехала бы на станцию
   * двумя строками по 0,5, и повар не понял бы, что готовить полпорции.
   */
  it.each(["new", "cooking", "voided", "split"] as const)(
    "не делится позиция в статусе %s",
    (status) => {
      const state: OrdersState = {
        ...withOrder(),
        items: { "item-1": item({ status }) },
      };

      expect(
        reducer(state, {
          type: "item/split",
          itemId: "item-1",
          parts: [0.5, 0.5],
          ids: ["a", "b"],
        }),
      ).toBe(state);
    },
  );

  it("готовое блюдо делится", () => {
    const ready: OrdersState = {
      ...withOrder(),
      items: { "item-1": item({ status: "ready" }) },
    };

    const next = reducer(ready, {
      type: "item/split",
      itemId: "item-1",
      parts: [0.5, 0.5],
      ids: ["a", "b"],
    });

    expect(next.items["item-1"].status).toBe("split");
  });

  it("деление на одну часть — не деление", () => {
    expect(
      reducer(served, {
        type: "item/split",
        itemId: "item-1",
        parts: [1],
        ids: ["a"],
      }),
    ).toBe(served);
  });

  it("нехватка идентификаторов не теряет часть блюда молча", () => {
    expect(
      reducer(served, {
        type: "item/split",
        itemId: "item-1",
        parts: [0.5, 0.5],
        ids: ["a"],
      }),
    ).toBe(served);
  });
});

describe("гости заказа", () => {
  it("позиция приписывается гостю и снимается с него", () => {
    const state: OrdersState = {
      ...withOrder(),
      items: { "item-1": item() },
    };

    const assigned = reducer(state, {
      type: "item/guest",
      itemId: "item-1",
      guestNumber: 2,
    });
    expect(assigned.items["item-1"].guestNumber).toBe(2);

    const cleared = reducer(assigned, {
      type: "item/guest",
      itemId: "item-1",
      guestNumber: null,
    });
    expect(cleared.items["item-1"].guestNumber).toBeNull();
  });

  it("число гостей записывается в заказ", () => {
    const next = reducer(withOrder(), {
      type: "order/guests",
      orderId: "order-1",
      guestCount: 4,
    });

    expect(next.orders["order-1"].guestCount).toBe(4);
  });

  it("нулевое число гостей за занятым столом не принимается", () => {
    const state = withOrder();
    expect(
      reducer(state, { type: "order/guests", orderId: "order-1", guestCount: 0 }),
    ).toBe(state);
  });
});

describe("оплата", () => {
  it("сохраняет платёж и закрывает заказ", () => {
    const next = reducer(withOrder(), {
      type: "order/pay",
      orderId: "order-1",
      cashShiftNumber: 7,
      payments: [payment({ id: "payment-1" })],
    });

    expect(next.orders["order-1"].status).toBe("paid");
    expect(next.payments["payment-1"].amount).toBe("420.00");
  });

  it("проставляет заказу номер смены и номер чека", () => {
    const next = reducer(withOrder(), {
      type: "order/pay",
      orderId: "order-1",
      cashShiftNumber: 7,
      payments: [payment({ id: "payment-1" })],
    });

    expect(next.orders["order-1"].cashShiftNumber).toBe(7);
    expect(next.orders["order-1"].receiptNumber).toBe(1);
  });

  it("закрывает чек набором строк целиком", () => {
    // «Оплачен наполовину» — состояние, которого у чека не бывает.
    const next = reducer(withOrder(), {
      type: "order/pay",
      orderId: "order-1",
      cashShiftNumber: 1,
      payments: [
        payment({ id: "p-card", kind: "card", label: "Карты", amount: "300.00" }),
        payment({ id: "p-cash", amount: "120.00" }),
      ],
    });

    expect(Object.keys(next.payments)).toHaveLength(2);
    expect(next.orders["order-1"].status).toBe("paid");
  });

  /*
   * Двойное касание по «Оплатить» на сенсорном экране снаружи неотличимо
   * от первого нажатия, а результат — второе списание с гостя.
   */
  it("не проводит оплату дважды по уже закрытому чеку", () => {
    const paid = reducer(withOrder(), {
      type: "order/pay",
      orderId: "order-1",
      cashShiftNumber: 1,
      payments: [payment({ id: "payment-1" })],
    });
    const again = reducer(paid, {
      type: "order/pay",
      orderId: "order-1",
      cashShiftNumber: 1,
      payments: [payment({ id: "payment-2" })],
    });

    expect(again).toBe(paid);
    expect(Object.keys(again.payments)).toEqual(["payment-1"]);
  });

  it("не создаёт платёж без заказа", () => {
    expect(
      reducer(EMPTY_STATE, {
        type: "order/pay",
        orderId: "нет-такого",
        cashShiftNumber: 1,
        payments: [payment({ id: "payment-1", orderId: "нет-такого" })],
      }),
    ).toBe(EMPTY_STATE);
  });

  it("пустой набор строк чек не закрывает", () => {
    const state = withOrder();
    expect(
      reducer(state, {
        type: "order/pay",
        orderId: "order-1",
        cashShiftNumber: 1,
        payments: [],
      }),
    ).toBe(state);
  });
});

describe("возврат", () => {
  const paid = reducer(withOrder(), {
    type: "order/pay",
    orderId: "order-1",
    cashShiftNumber: 1,
    payments: [payment({ id: "payment-1" })],
  });

  /*
   * Инвариант №6: `payments` иммутабельны. Возврат — встречная строка,
   * а не правка исходной: LWW на платеже означает потерянную выручку.
   */
  it("добавляет встречную строку, не трогая исходную", () => {
    const next = reducer(paid, {
      type: "order/refund",
      payments: [payment({ id: "refund-1", refundOf: "payment-1" })],
    });

    expect(next.payments["payment-1"].refundOf).toBeNull();
    expect(next.payments["refund-1"].refundOf).toBe("payment-1");
  });

  it("не меняет статус заказа: чек был закрыт и остаётся закрытым", () => {
    const next = reducer(paid, {
      type: "order/refund",
      payments: [payment({ id: "refund-1", refundOf: "payment-1" })],
    });

    expect(next.orders["order-1"].status).toBe("paid");
  });

  it("повтор с тем же идентификатором не задваивает возврат", () => {
    const once = reducer(paid, {
      type: "order/refund",
      payments: [payment({ id: "refund-1", refundOf: "payment-1" })],
    });
    const twice = reducer(once, {
      type: "order/refund",
      payments: [payment({ id: "refund-1", refundOf: "payment-1" })],
    });

    expect(Object.keys(twice.payments)).toHaveLength(2);
  });
});

describe("нумерация чеков", () => {
  it("сквозная внутри смены и не переиспользуется", () => {
    let state: OrdersState = {
      ...withOrder(),
      orders: {
        "order-1": order({ id: "order-1" }),
        "order-2": order({ id: "order-2" }),
      },
    };

    state = reducer(state, {
      type: "order/pay",
      orderId: "order-1",
      cashShiftNumber: 3,
      payments: [payment({ id: "p1" })],
    });
    state = reducer(state, {
      type: "order/pay",
      orderId: "order-2",
      cashShiftNumber: 3,
      payments: [payment({ id: "p2", orderId: "order-2" })],
    });

    expect(state.orders["order-1"].receiptNumber).toBe(1);
    expect(state.orders["order-2"].receiptNumber).toBe(2);
  });

  it("в новой смене начинается заново", () => {
    let state: OrdersState = {
      ...withOrder(),
      orders: {
        "order-1": order({ id: "order-1" }),
        "order-2": order({ id: "order-2" }),
      },
    };

    state = reducer(state, {
      type: "order/pay",
      orderId: "order-1",
      cashShiftNumber: 3,
      payments: [payment({ id: "p1" })],
    });
    state = reducer(state, {
      type: "order/pay",
      orderId: "order-2",
      cashShiftNumber: 4,
      payments: [payment({ id: "p2", orderId: "order-2" })],
    });

    expect(state.orders["order-2"].receiptNumber).toBe(1);
  });
});

describe("миграция номеров", () => {
  it("оставляет состояние как есть, когда номера у всех есть", () => {
    const state = withOrder({ number: 3 });
    expect(withOrderNumbers(state)).toBe(state);
  });

  it("раздаёт номера по порядку создания, не задевая существующие", () => {
    const state: OrdersState = {
      ...EMPTY_STATE,
      orders: {
        a: order({
          id: "a",
          number: undefined as unknown as number,
          createdAt: "2026-08-04T12:00:00.000Z",
        }),
        b: order({
          id: "b",
          number: undefined as unknown as number,
          createdAt: "2026-08-04T11:00:00.000Z",
        }),
        c: order({ id: "c", number: 5 }),
      },
    };

    const migrated = withOrderNumbers(state);
    // «b» создан раньше «a», значит и номер у него меньше;
    // оба продолжают нумерацию от уже занятого пятого.
    expect(migrated.orders.b.number).toBe(6);
    expect(migrated.orders.a.number).toBe(7);
    expect(migrated.orders.c.number).toBe(5);
  });

  it("после миграции следующий номер не сталкивается с выданными", () => {
    const state: OrdersState = {
      ...EMPTY_STATE,
      orders: {
        a: order({ id: "a", number: undefined as unknown as number }),
      },
    };
    const migrated = withOrderNumbers(state);
    expect(nextOrderNumber(migrated, SHIFT)).toBe(2);
  });
});
