import type {
  Order,
  OrderItem,
  OrderItemStatus,
  Payment,
  UUID,
} from "@restopos/shared-types";
import { findMenuItem } from "./menu";

/**
 * Чистая логика заказов: состояние, действия и редьюсер, без React.
 *
 * Вынесено из `orders.tsx` по тому же соображению, что и `table-numbering.ts`:
 * это функции без побочных эффектов, их можно прогнать без рендера — а именно
 * здесь живут инварианты, которые дороже всего сломать молча (дедупликация,
 * append-only на позициях, нумерация в смене).
 */

export interface OrdersState {
  orders: Record<UUID, Order>;
  items: Record<UUID, OrderItem>;
  payments: Record<UUID, Payment>;
}

export const EMPTY_STATE: OrdersState = { orders: {}, items: {}, payments: {} };

export type OrdersAction =
  | { type: "order/open"; order: Order }
  | { type: "order/cancel"; orderId: UUID }
  | { type: "order/send"; orderId: UUID; autoReadyStationIds: readonly UUID[] }
  | { type: "order/pay"; payment: Payment }
  | { type: "item/add"; item: OrderItem }
  | { type: "item/quantity"; itemId: UUID; quantity: number }
  | { type: "item/remove"; itemId: UUID }
  | { type: "item/void"; itemId: UUID }
  | { type: "item/status"; itemId: UUID; status: OrderItemStatus };

/** Заказ считается активным, пока не оплачен и не отменён. */
export const ACTIVE_STATUSES = new Set<Order["status"]>([
  "open",
  "sent_to_kitchen",
]);

/** Следующий номер в смене. Нумерация начинается с 1 и не переиспользуется. */
export function nextOrderNumber(state: OrdersState, shiftId: UUID): number {
  const used = Object.values(state.orders)
    .filter((order) => order.shiftId === shiftId)
    .map((order) => order.number)
    // Нечисловые значения отсеиваем: в localStorage остаются заказы,
    // сохранённые версией без номера, и один `undefined` превратил бы
    // весь `Math.max` в NaN.
    .filter((value) => Number.isFinite(value));

  return used.length === 0 ? 1 : Math.max(...used) + 1;
}

/**
 * Приведение прочитанного состояния к текущему формату.
 *
 * Заказы, сохранённые версией без `number`, приезжают без номера — и один
 * такой ломает и выдачу следующего номера (`Math.max` даёт NaN), и показ
 * в очереди. Раздаём им номера один раз при загрузке, по порядку создания
 * внутри смены, вместо заглушек в каждом месте отрисовки.
 */
export function withOrderNumbers(state: OrdersState): OrdersState {
  const withoutNumber = Object.values(state.orders).filter(
    (order) => !Number.isFinite(order.number),
  );
  if (withoutNumber.length === 0) return state;

  const nextByShift = new Map<UUID, number>();
  for (const order of Object.values(state.orders)) {
    if (!Number.isFinite(order.number)) continue;
    nextByShift.set(
      order.shiftId,
      Math.max(nextByShift.get(order.shiftId) ?? 0, order.number),
    );
  }

  const orders = { ...state.orders };
  for (const order of withoutNumber.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )) {
    const next = (nextByShift.get(order.shiftId) ?? 0) + 1;
    nextByShift.set(order.shiftId, next);
    orders[order.id] = { ...order, number: next };
  }

  return { ...state, orders };
}

export function reducer(state: OrdersState, action: OrdersAction): OrdersState {
  switch (action.type) {
    case "order/open": {
      // Дедупликация именно здесь, а не в вызывающем коде: открытие заказа
      // происходит из эффекта, а в StrictMode эффект выполняется дважды с одним
      // и тем же снимком состояния — снаружи повтор не отличить от первого раза.
      const alreadyOpen = Object.values(state.orders).some(
        (order) =>
          order.tableId === action.order.tableId &&
          ACTIVE_STATUSES.has(order.status),
      );
      if (alreadyOpen) return state;

      // Номер выдаём тоже здесь: он зависит от уже существующих заказов,
      // а снаружи это состояние читается из устаревшего замыкания.
      const order: Order = {
        ...action.order,
        number: nextOrderNumber(state, action.order.shiftId),
      };

      return { ...state, orders: { ...state.orders, [order.id]: order } };
    }

    case "order/cancel": {
      const order = state.orders[action.orderId];
      if (!order) return state;
      return {
        ...state,
        orders: {
          ...state.orders,
          [order.id]: { ...order, status: "canceled" },
        },
      };
    }

    case "order/send": {
      const order = state.orders[action.orderId];
      if (!order) return state;

      // На кухню уезжают только неотправленные позиции. Уже готовящиеся
      // повторная отправка не трогает — иначе повар потерял бы прогресс.
      const items = { ...state.items };
      let fired = 0;
      for (const item of Object.values(state.items)) {
        if (item.orderId !== order.id || item.status !== "new") continue;

        /*
         * Станция без экрана работает по бумаге: отмечать готовность на ней
         * некому, и позиция, оставленная в `cooking`, висела бы в очереди
         * вечно. Марка напечатана — считаем, что повар её видит.
         */
        const stationId = findMenuItem(item.menuItemId)?.prepStationId ?? null;
        const isAutoReady =
          stationId === null || action.autoReadyStationIds.includes(stationId);

        items[item.id] = { ...item, status: isAutoReady ? "ready" : "cooking" };
        fired += 1;
      }
      if (fired === 0) return state;

      return {
        ...state,
        items,
        orders: {
          ...state.orders,
          [order.id]: { ...order, status: "sent_to_kitchen" },
        },
      };
    }

    case "order/pay": {
      const order = state.orders[action.payment.orderId];
      if (!order) return state;
      return {
        ...state,
        orders: { ...state.orders, [order.id]: { ...order, status: "paid" } },
        payments: {
          ...state.payments,
          [action.payment.id]: action.payment,
        },
      };
    }

    case "item/add": {
      // Дедупликация здесь, а не в вызывающем коде: два быстрых касания
      // подряд — норма на сенсорном экране, а оба обработчика видят один
      // и тот же снимок состояния. Снаружи это не поймать, и позиция
      // задваивается двумя строками по одной штуке вместо «x2».
      const existing = Object.values(state.items).find(
        (item) =>
          item.orderId === action.item.orderId &&
          item.menuItemId === action.item.menuItemId &&
          item.status === "new",
      );

      if (existing) {
        return {
          ...state,
          items: {
            ...state.items,
            [existing.id]: { ...existing, quantity: existing.quantity + 1 },
          },
        };
      }

      return {
        ...state,
        items: { ...state.items, [action.item.id]: action.item },
      };
    }

    case "item/quantity": {
      const item = state.items[action.itemId];
      // Количество правится только до отправки на кухню.
      if (item?.status !== "new") return state;
      if (action.quantity < 1) {
        const { [item.id]: _removed, ...rest } = state.items;
        return { ...state, items: rest };
      }
      return {
        ...state,
        items: {
          ...state.items,
          [item.id]: { ...item, quantity: action.quantity },
        },
      };
    }

    case "item/remove": {
      const item = state.items[action.itemId];
      if (item?.status !== "new") return state;
      const { [item.id]: _removed, ...rest } = state.items;
      return { ...state, items: rest };
    }

    case "item/void": {
      const item = state.items[action.itemId];
      if (!item) return state;
      // Сторнируют то, что уже уехало на кухню. Неотправленную позицию
      // удаляют (`item/remove`) — помечать её сторно значило бы оставлять
      // в чеке след от того, чего не было.
      if (item.status === "new" || item.status === "voided") return state;
      return {
        ...state,
        items: {
          ...state.items,
          [item.id]: { ...item, status: "voided" },
        },
      };
    }

    case "item/status": {
      const item = state.items[action.itemId];
      if (!item) return state;
      return {
        ...state,
        items: {
          ...state.items,
          [item.id]: { ...item, status: action.status },
        },
      };
    }
  }
}
