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
  /**
   * Оплата приходит **набором** строк, а не по одной: гость платит частью
   * картой, частью наличными, и чек закрывается целиком либо не закрывается.
   * Закрытие по одной строке означало бы промежуточное состояние «оплачен
   * наполовину», которого у чека не бывает.
   */
  | {
      type: "order/pay";
      orderId: UUID;
      payments: Payment[];
      cashShiftNumber: number;
    }
  | { type: "order/refund"; payments: Payment[] }
  | { type: "item/add"; item: OrderItem }
  | { type: "item/quantity"; itemId: UUID; quantity: number }
  | { type: "item/remove"; itemId: UUID }
  | { type: "item/void"; itemId: UUID }
  | { type: "item/status"; itemId: UUID; status: OrderItemStatus }
  /**
   * Деление блюда на доли. `parts` обязаны в сумме давать текущее количество —
   * считает их `lib/split-quantity.ts`, здесь только запись.
   * `guestNumbers` — кому какая доля, если делят между гостями.
   */
  | {
      type: "item/split";
      itemId: UUID;
      parts: number[];
      ids: UUID[];
      guestNumbers?: (number | null)[];
    }
  | { type: "item/guest"; itemId: UUID; guestNumber: number | null }
  | { type: "order/guests"; orderId: UUID; guestCount: number };

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
 * Следующий номер чека в кассовой смене.
 *
 * Нумерация сквозная внутри смены и не переиспользуется: по паре «смена + чек»
 * закрытый заказ ищут в реестре счетов и сверяют с Z-отчётом. Считаем от уже
 * выданных номеров, а не от количества чеков: отменённый заказ номер не занял,
 * а удалённый из локального состояния — уже занял.
 */
export function nextReceiptNumber(
  state: OrdersState,
  cashShiftNumber: number,
): number {
  const used = Object.values(state.orders)
    .filter((order) => order.cashShiftNumber === cashShiftNumber)
    .map((order) => order.receiptNumber)
    .filter((value): value is number => Number.isFinite(value));

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
      const order = state.orders[action.orderId];
      if (!order) return state;
      /*
       * Повторная оплата уже закрытого чека — это не «доплата», а двойное
       * списание с гостя. Двойное касание по «Оплатить» на сенсорном экране
       * даёт ровно этот сценарий, и снаружи оно неотличимо от первого нажатия.
       */
      if (order.status === "paid") return state;
      if (action.payments.length === 0) return state;

      const payments = { ...state.payments };
      for (const payment of action.payments) payments[payment.id] = payment;

      return {
        ...state,
        orders: {
          ...state.orders,
          [order.id]: {
            ...order,
            status: "paid",
            cashShiftNumber: action.cashShiftNumber,
            receiptNumber: nextReceiptNumber(state, action.cashShiftNumber),
          },
        },
        payments,
      };
    }

    /*
     * Возврат — новые строки со ссылкой `refundOf`, а не правка исходных
     * (инвариант №6: `payments` иммутабельны, LWW на платеже это потерянная
     * выручка). Статус заказа не меняется: чек был закрыт и остаётся закрытым,
     * возврат — отдельный факт поверх него.
     */
    case "order/refund": {
      if (action.payments.length === 0) return state;
      const payments = { ...state.payments };
      for (const payment of action.payments) {
        if (payments[payment.id]) continue;
        payments[payment.id] = payment;
      }
      return { ...state, payments };
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

    /*
     * Деление блюда.
     *
     * Исходная позиция не удаляется, а помечается `split` — это append-only
     * (инвариант №6): блюдо приготовлено, и стирать его из чека нельзя.
     * Из суммы она выпадает, деньги несут доли — иначе с гостя возьмут дважды.
     *
     * Доли наследуют статус исходной позиции, а не начинают с `new`: делят
     * обычно уже поданное блюдо, и «новая» половина борща уехала бы на кухню
     * второй раз.
     */
    case "item/split": {
      const item = state.items[action.itemId];
      if (!item) return state;
      /*
       * Делят **еду**, а не заказ: только то, что уже приготовлено.
       *
       * Позиция в `new` или `cooking` уехала бы на станцию двумя строками
       * по 0,5 — повар не понимает, что готовить полпорции, и либо сделает
       * две, либо одну. До готовности количество правят обычным способом,
       * а делят счёт уже за столом, когда блюдо съедено.
       */
      if (item.status !== "ready" && item.status !== "served") return state;
      if (action.parts.length < 2) return state;
      // Идентификаторы приходят снаружи (их выдаёт `newId`), но их должно
      // хватить на все доли — иначе часть блюда потерялась бы молча.
      if (action.ids.length !== action.parts.length) return state;

      const items = { ...state.items };
      items[item.id] = { ...item, status: "split" };

      action.parts.forEach((quantity, index) => {
        items[action.ids[index]] = {
          ...item,
          id: action.ids[index],
          quantity,
          splitOf: item.id,
          guestNumber: action.guestNumbers?.[index] ?? null,
        };
      });

      return { ...state, items };
    }

    case "item/guest": {
      const item = state.items[action.itemId];
      if (!item) return state;
      return {
        ...state,
        items: {
          ...state.items,
          [item.id]: { ...item, guestNumber: action.guestNumber },
        },
      };
    }

    case "order/guests": {
      const order = state.orders[action.orderId];
      if (!order) return state;
      // Ноль гостей за занятым столом — это промах по кнопке, а не факт.
      if (action.guestCount < 1) return state;
      return {
        ...state,
        orders: {
          ...state.orders,
          [order.id]: { ...order, guestCount: action.guestCount },
        },
      };
    }
  }
}
