import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  Money,
  Order,
  OrderItem,
  OrderItemStatus,
  Payment,
  PaymentMethod,
  TableStatus,
  UUID,
} from "@restopos/shared-types";
import { loadState, newId, saveState } from "../lib/storage";
import { multiplyMoney, sumMoney } from "../lib/money";
import { findMenuItem } from "./menu";
import {
  ACTIVE_STATUSES,
  EMPTY_STATE,
  reducer,
  withOrderNumbers,
  type OrdersState,
} from "./orders-reducer";
import { useStations } from "./stations";

/**
 * Заказы терминала.
 *
 * Пока это единственный источник данных, но форма подобрана под будущий обмен
 * с бэкендом: сущности хранятся плоско и по идентификаторам, ровно как приходят
 * из API, а не деревом. Пересчёт сумм — из меню, а не из снимка цены в позиции.
 *
 * Инвариант №6 (append-only для `order_items`) выражен статусом позиции:
 * пока она `new` — ещё не ушла на кухню и её можно править или удалить;
 * после отправки (`cooking` и дальше) удалить её нельзя, только сторнировать.
 */

const STORAGE_KEY = "orders";

/** Чтение заказов из хранилища с приведением к текущему формату. */
function loadOrders(): OrdersState {
  return withOrderNumbers(loadState<OrdersState>(STORAGE_KEY, EMPTY_STATE));
}

interface OrdersValue {
  state: OrdersState;
  activeOrders: Order[];
  orderOfTable: (tableId: UUID) => Order | undefined;
  /** Незакрытый заказ прилавка. На прилавке он всегда ровно один. */
  counterOrder: Order | undefined;
  /**
   * Тикеты станций: по одному на пару «заказ + станция приготовления».
   *
   * Считаются от позиций, а не от статуса заказа: на прилавке гость платит
   * вперёд, заказ сразу становится `paid`, но шаурма от этого не готова.
   * Тикет уходит с экрана, когда позиции отданы, а не когда получены деньги.
   *
   * Разбиение по станциям — не украшение: горячее уезжает на кухню, морс
   * и эспрессо на бар, и бар не должен видеть стейки.
   */
  kitchenTickets: {
    order: Order;
    /** `null` — позиция без станции (готовое к выдаче). */
    stationId: UUID | null;
    items: OrderItem[];
  }[];
  itemsOfOrder: (orderId: UUID) => OrderItem[];
  /** Платёж по заказу, если он уже рассчитан. */
  paymentOfOrder: (orderId: UUID) => Payment | undefined;
  orderTotal: (orderId: UUID) => Money;
  tableStatus: (tableId: UUID) => TableStatus;
  /** Есть ли что отправлять на кухню (позиции в статусе `new`). */
  hasPendingItems: (orderId: UUID) => boolean;

  openOrder: (tableId: UUID | null) => void;
  addItem: (orderId: UUID, menuItemId: UUID) => void;
  setQuantity: (itemId: UUID, quantity: number) => void;
  removeItem: (itemId: UUID) => void;
  /** Сторно отправленной позиции: из суммы выпадает, из чека — нет. */
  voidItem: (itemId: UUID) => void;
  setItemStatus: (itemId: UUID, status: OrderItemStatus) => void;
  sendToKitchen: (orderId: UUID) => void;
  payOrder: (orderId: UUID, method: PaymentMethod) => void;
  cancelOrder: (orderId: UUID) => void;
}

const OrdersContext = createContext<OrdersValue | null>(null);

export function OrdersProvider({
  venueId,
  shiftId,
  waiterId,
  children,
}: {
  venueId: UUID;
  shiftId: UUID;
  /** Кто за терминалом. `null`, пока смена не открыта. */
  waiterId: UUID | null;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, loadOrders);
  const { stations, hasScreenOf } = useStations();

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  /** Станции, где готовность отмечать некому: там только бумага. */
  const autoReadyStationIds = useMemo(
    () =>
      stations.filter((station) => !hasScreenOf(station.id)).map((s) => s.id),
    [stations, hasScreenOf],
  );

  const itemsOfOrder = useCallback(
    (orderId: UUID) =>
      Object.values(state.items).filter((item) => item.orderId === orderId),
    [state.items],
  );

  const orderTotal = useCallback(
    (orderId: UUID): Money =>
      sumMoney(
        itemsOfOrder(orderId)
          // Сторнированная позиция остаётся в чеке (append-only, инвариант №6),
          // но из суммы выпадает — иначе гость заплатит за отменённое блюдо.
          .filter((item) => item.status !== "voided")
          .map((item) => {
            const menuItem = findMenuItem(item.menuItemId);
            return menuItem
              ? multiplyMoney(menuItem.price, item.quantity)
              : "0.00";
          }),
      ),
    [itemsOfOrder],
  );

  const activeOrders = useMemo(
    () => Object.values(state.orders).filter((o) => ACTIVE_STATUSES.has(o.status)),
    [state.orders],
  );

  const orderOfTable = useCallback(
    (tableId: UUID) => activeOrders.find((order) => order.tableId === tableId),
    [activeOrders],
  );

  const counterOrder = useMemo(
    () => activeOrders.find((order) => order.tableId === null),
    [activeOrders],
  );

  const kitchenTickets = useMemo(() => {
    // Ключ — пара «заказ + станция»: один заказ порождает столько тикетов,
    // на сколько станций разъехались его позиции.
    const pending = new Map<
      string,
      { orderId: UUID; stationId: UUID | null; items: OrderItem[] }
    >();

    for (const item of Object.values(state.items)) {
      if (item.status !== "cooking" && item.status !== "ready") continue;
      const stationId = findMenuItem(item.menuItemId)?.prepStationId ?? null;
      const key = `${item.orderId}:${stationId ?? "-"}`;
      const bucket = pending.get(key);
      if (bucket) bucket.items.push(item);
      else pending.set(key, { orderId: item.orderId, stationId, items: [item] });
    }

    return [...pending.values()]
      .map(({ orderId, stationId, items }) => ({
        order: state.orders[orderId],
        stationId,
        items,
      }))
      .filter(({ order }) => order !== undefined && order.status !== "canceled")
      .sort(
        (a, b) =>
          new Date(a.order.createdAt).getTime() -
          new Date(b.order.createdAt).getTime(),
      );
  }, [state.items, state.orders]);

  /**
   * Открыть заказ на столе (или на прилавке, если `tableId` — `null`).
   * Повторный вызов, пока прошлый заказ не закрыт, ничего не делает:
   * дедупликация в редьюсере.
   */
  const openOrder = useCallback(
    (tableId: UUID | null) => {
      dispatch({
        type: "order/open",
        order: {
          id: newId(),
          venueId,
          tableId,
          shiftId,
          // Настоящий номер присвоит редьюсер — здесь он не известен.
          number: 0,
          // Заказ создаётся только при открытой смене: экран заказа
          // недостижим с заблокированного терминала.
          waiterId: waiterId ?? "unknown",
          status: "open",
          createdAt: new Date().toISOString(),
          // Временный идентификатор для идемпотентной привязки при синхронизации.
          clientId: newId(),
        },
      });
    },
    [venueId, shiftId, waiterId],
  );

  /** Ту же позицию в статусе `new` редьюсер склеит, увеличив количество. */
  const addItem = useCallback((orderId: UUID, menuItemId: UUID) => {
    dispatch({
      type: "item/add",
      item: {
        id: newId(),
        orderId,
        menuItemId,
        quantity: 1,
        status: "new",
        modifierIds: [],
      },
    });
  }, []);

  const value = useMemo<OrdersValue>(
    () => ({
      state,
      activeOrders,
      orderOfTable,
      counterOrder,
      kitchenTickets,
      itemsOfOrder,
      paymentOfOrder: (orderId) =>
        Object.values(state.payments).find(
          (payment) => payment.orderId === orderId,
        ),
      orderTotal,
      tableStatus: (tableId) => (orderOfTable(tableId) ? "occupied" : "free"),
      hasPendingItems: (orderId) =>
        itemsOfOrder(orderId).some((item) => item.status === "new"),

      openOrder,
      addItem,
      setQuantity: (itemId, quantity) =>
        dispatch({ type: "item/quantity", itemId, quantity }),
      removeItem: (itemId) => dispatch({ type: "item/remove", itemId }),
      voidItem: (itemId) => dispatch({ type: "item/void", itemId }),
      setItemStatus: (itemId, status) =>
        dispatch({ type: "item/status", itemId, status }),
      sendToKitchen: (orderId) =>
        dispatch({ type: "order/send", orderId, autoReadyStationIds }),
      payOrder: (orderId, method) =>
        dispatch({
          type: "order/pay",
          payment: {
            id: newId(),
            orderId,
            method,
            amount: orderTotal(orderId),
            tipAmount: "0.00",
            paidAt: new Date().toISOString(),
          },
        }),
      cancelOrder: (orderId) => dispatch({ type: "order/cancel", orderId }),
    }),
    [
      state,
      activeOrders,
      orderOfTable,
      counterOrder,
      kitchenTickets,
      itemsOfOrder,
      orderTotal,
      openOrder,
      addItem,
      autoReadyStationIds,
    ],
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders(): OrdersValue {
  const value = useContext(OrdersContext);
  if (!value) {
    throw new Error("useOrders вызван вне OrdersProvider");
  }
  return value;
}
