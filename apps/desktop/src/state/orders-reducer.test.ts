import type { Order, OrderItem, UUID } from "@restopos/shared-types";
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
 * Станции берутся из демо-меню (`state/menu.ts`): «Борщ» готовится на кухне,
 * «Морс клюквенный» — на баре.
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

describe("оплата", () => {
  it("сохраняет платёж и закрывает заказ", () => {
    const state = withOrder();
    const next = reducer(state, {
      type: "order/pay",
      payment: {
        id: "payment-1",
        orderId: "order-1",
        method: "cash",
        amount: "420.00",
        tipAmount: "0.00",
        paidAt: "2026-08-04T10:30:00.000Z",
      },
    });
    expect(next.orders["order-1"].status).toBe("paid");
    expect(next.payments["payment-1"].amount).toBe("420.00");
  });

  it("не создаёт платёж без заказа", () => {
    expect(
      reducer(EMPTY_STATE, {
        type: "order/pay",
        payment: {
          id: "payment-1",
          orderId: "нет-такого",
          method: "cash",
          amount: "420.00",
          tipAmount: "0.00",
          paidAt: "2026-08-04T10:30:00.000Z",
        },
      }),
    ).toBe(EMPTY_STATE);
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
