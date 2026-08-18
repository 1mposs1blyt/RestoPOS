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
  OrderDiscount,
  OrderItem,
  OrderItemStatus,
  Payment,
  TableStatus,
  UUID,
} from "@restopos/shared-types";
import { loadState, newId, saveState } from "../lib/storage";
import { multiplyMoney, sumMoney } from "../lib/money";
import { computeTotals, type OrderTotals } from "../lib/discount";
import { refundablePayments } from "../lib/refund";
import { findDiscountType } from "../data/discount-types";
import { findPaymentType } from "../data/payment-types";
import { useMenu } from "./menu";
import { useShifts } from "./shifts";
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
  /**
   * Строки оплаты заказа. Их может быть несколько (часть картой, часть
   * наличными) плюс строки возвратов — поэтому список, а не один платёж.
   */
  paymentsOfOrder: (orderId: UUID) => Payment[];
  /** Сумма позиций без скидок и надбавок. */
  orderSubtotal: (orderId: UUID) => Money;
  /** Итог к оплате: подытог − скидка + надбавка. Его и платит гость. */
  orderTotal: (orderId: UUID) => Money;
  /** Разложенные итоги для экрана оплаты и чека. */
  orderTotals: (orderId: UUID) => OrderTotals;
  discountsOfOrder: (orderId: UUID) => OrderDiscount[];
  tableStatus: (tableId: UUID) => TableStatus;
  /** Есть ли что отправлять на кухню (позиции в статусе `new`). */
  hasPendingItems: (orderId: UUID) => boolean;

  openOrder: (tableId: UUID | null) => void;
  addItem: (orderId: UUID, menuItemId: UUID) => void;
  setQuantity: (itemId: UUID, quantity: number) => void;
  removeItem: (itemId: UUID) => void;
  /** Сторно отправленной позиции: из суммы выпадает, из чека — нет. */
  voidItem: (itemId: UUID) => void;
  /**
   * Разделить блюдо на доли. `parts` считает `lib/split-quantity.ts` — там же
   * решается вопрос остатка, чтобы доли в сумме давали исходное количество.
   */
  splitItem: (
    itemId: UUID,
    parts: number[],
    guestNumbers?: (number | null)[],
  ) => void;
  /** Приписать позицию гостю или снять привязку (`null`). */
  setItemGuest: (itemId: UUID, guestNumber: number | null) => void;
  setGuestCount: (orderId: UUID, guestCount: number) => void;
  /**
   * Применить скидку из справочника. `approvedBy` — если она требовала
   * подтверждения чужим PIN.
   */
  applyDiscount: (
    orderId: UUID,
    discountTypeId: UUID,
    approvedBy?: UUID | null,
  ) => void;
  removeDiscount: (discountId: UUID) => void;
  setItemStatus: (itemId: UUID, status: OrderItemStatus) => void;
  sendToKitchen: (orderId: UUID) => void;
  /**
   * Закрыть чек набором строк оплаты. Строки формирует экран оплаты —
   * там же, где считается сдача. Сюда они приходят уже готовыми: редьюсер
   * не должен знать про номиналы купюр и порядок нажатий.
   */
  payOrder: (orderId: UUID, drafts: PaymentDraft[]) => void;
  /** Возврат: встречные строки к уже проведённым платежам. */
  refundPayments: (paymentIds: UUID[]) => void;
  cancelOrder: (orderId: UUID) => void;
}

/** Что экран оплаты знает о строке платежа до её записи. */
export interface PaymentDraft {
  paymentTypeId: UUID;
  amount: Money;
  /** Сколько дал гость наличными — для сдачи. `null` для безналичных. */
  tendered: Money | null;
  /**
   * Результат эквайринга, если строка платилась картой. Заполняет
   * `state/checkout.tsx` после ответа терминала — экран оплаты этих полей
   * не знает и знать не должен.
   */
  authCode?: string | null;
  rrn?: string | null;
  /** Фискальный признак чека, которым закрыт заказ. */
  fiscalSign?: string | null;
}

const OrdersContext = createContext<OrdersValue | null>(null);

/**
 * Черновик строки оплаты превращается в платёж.
 *
 * Род и название типа копируются в платёж снимком, а не берутся по ссылке
 * при отрисовке: закрытый чек — финансовый документ, и переименование типа
 * оплаты через год не должно менять то, что напечатано в прошлогоднем Z-отчёте.
 */
function toPayment(
  draft: PaymentDraft,
  orderId: UUID,
  cashShiftId: UUID,
  staffId: UUID = "unknown",
): Payment {
  const type = findPaymentType(draft.paymentTypeId);
  return {
    id: newId(),
    orderId,
    cashShiftId,
    paymentTypeId: draft.paymentTypeId,
    kind: type?.kind ?? "cash",
    label: type?.label ?? "Неизвестный тип",
    amount: draft.amount,
    tipAmount: "0.00",
    tendered: draft.tendered,
    staffId,
    refundOf: null,
    // Реквизиты банка и ККТ приезжают снимком, как род и название типа:
    // закрытый чек — финансовый документ, и пересчитывать его нечем.
    authCode: draft.authCode ?? null,
    rrn: draft.rrn ?? null,
    fiscalSign: draft.fiscalSign ?? null,
    paidAt: new Date().toISOString(),
    clientId: newId(),
  };
}

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
  const { cashShift } = useShifts();
  const [state, dispatch] = useReducer(reducer, undefined, loadOrders);
  const { stations, hasScreenOf } = useStations();
  const { findMenuItem } = useMenu();

  /**
   * Станция позиции для редьюсера.
   *
   * Отдельная ссылка, а не `findMenuItem` внутри редьюсера: тот обязан
   * оставаться чистым, а меню приезжает с узла и меняется под ногами.
   */
  const stationOf = useCallback(
    (menuItemId: UUID) => findMenuItem(menuItemId)?.prepStationId ?? null,
    [findMenuItem],
  );

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

  const orderSubtotal = useCallback(
    (orderId: UUID): Money =>
      sumMoney(
        itemsOfOrder(orderId)
          /*
           * Обе пометки оставляют позицию в чеке (append-only, инвариант №6),
           * но выводят её из суммы, по разным причинам:
           *
           * `voided` — блюда не будет, платить не за что;
           * `split`  — блюдо есть, но деньги за него несут его доли, и считать
           *            оба уровня значит взять с гостя дважды.
           */
          .filter((item) => item.status !== "voided" && item.status !== "split")
          .map((item) => {
            const menuItem = findMenuItem(item.menuItemId);
            return menuItem
              ? multiplyMoney(menuItem.price, item.quantity)
              : "0.00";
          }),
      ),
    [itemsOfOrder, findMenuItem],
  );

  const discountsOfOrder = useCallback(
    (orderId: UUID) =>
      Object.values(state.discounts)
        .filter((discount) => discount.orderId === orderId)
        .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt)),
    [state.discounts],
  );

  /*
   * Итоги считает `lib/discount.ts` — чистой функцией под тестами. Здесь
   * только сбор входных данных: правило «итог = подытог − скидка + надбавка»
   * и обрезка скидки по подытогу живут в одном месте, а не размазаны
   * по экранам, каждый из которых считал бы по-своему.
   */
  const orderTotals = useCallback(
    (orderId: UUID): OrderTotals =>
      computeTotals(
        orderSubtotal(orderId),
        discountsOfOrder(orderId).map((discount) => ({
          kind: discount.kind,
          mode: discount.mode,
          value: discount.value,
        })),
      ),
    [orderSubtotal, discountsOfOrder],
  );

  const orderTotal = useCallback(
    (orderId: UUID): Money => orderTotals(orderId).total,
    [orderTotals],
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
      const stationId = stationOf(item.menuItemId);
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
  }, [state.items, state.orders, stationOf]);

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
      paymentsOfOrder: (orderId) =>
        Object.values(state.payments).filter(
          (payment) => payment.orderId === orderId,
        ),
      orderSubtotal,
      orderTotal,
      orderTotals,
      discountsOfOrder,
      tableStatus: (tableId) => (orderOfTable(tableId) ? "occupied" : "free"),
      hasPendingItems: (orderId) =>
        itemsOfOrder(orderId).some((item) => item.status === "new"),

      openOrder,
      addItem,
      setQuantity: (itemId, quantity) =>
        dispatch({ type: "item/quantity", itemId, quantity }),
      removeItem: (itemId) => dispatch({ type: "item/remove", itemId }),
      voidItem: (itemId) => dispatch({ type: "item/void", itemId }),
      splitItem: (itemId, parts, guestNumbers) =>
        dispatch({
          type: "item/split",
          itemId,
          parts,
          // Идентификаторы долей выдаём здесь: редьюсер обязан оставаться
          // чистой функцией, а `crypto.randomUUID` — побочный эффект.
          ids: parts.map(() => newId()),
          guestNumbers,
        }),
      setItemGuest: (itemId, guestNumber) =>
        dispatch({ type: "item/guest", itemId, guestNumber }),
      setGuestCount: (orderId, guestCount) =>
        dispatch({ type: "order/guests", orderId, guestCount }),
      applyDiscount: (orderId, discountTypeId, approvedBy = null) => {
        const type = findDiscountType(discountTypeId);
        if (!type) return;
        const subtotal = orderSubtotal(orderId);
        // Сумму считаем и сохраняем снимком: пересчёт процента при каждом
        // показе дал бы другое число, если состав чека потом изменился.
        const { discount, surcharge } = computeTotals(subtotal, [
          { kind: type.kind, mode: type.mode, value: type.value },
        ]);
        dispatch({
          type: "discount/apply",
          discount: {
            id: newId(),
            orderId,
            discountTypeId: type.id,
            kind: type.kind,
            mode: type.mode,
            label: type.label,
            value: type.value,
            amount: type.kind === "discount" ? discount : surcharge,
            orderItemId: null,
            staffId: waiterId ?? "unknown",
            approvedBy,
            appliedAt: new Date().toISOString(),
            clientId: newId(),
          },
        });
      },
      removeDiscount: (discountId) =>
        dispatch({ type: "discount/remove", discountId }),
      setItemStatus: (itemId, status) =>
        dispatch({ type: "item/status", itemId, status }),
      sendToKitchen: (orderId) =>
        dispatch({ type: "order/send", orderId, stationOf, autoReadyStationIds }),
      payOrder: (orderId, drafts) => {
        // Без открытой кассовой смены чек не к чему привязать: у него не будет
        // ни номера смены, ни места в Z-отчёте. Экран оплаты до этого места
        // не доводит, но проверка обязана быть и здесь — это инвариант данных,
        // а не подсказка интерфейса.
        if (!cashShift) return;
        dispatch({
          type: "order/pay",
          orderId,
          cashShiftNumber: cashShift.number,
          payments: drafts.map((draft) => toPayment(draft, orderId, cashShift.id)),
        });
      },
      refundPayments: (paymentIds) => {
        if (!cashShift) return;
        const now = new Date().toISOString();
        dispatch({
          type: "order/refund",
          payments: paymentIds.flatMap((paymentId) => {
            const source = state.payments[paymentId];
            if (!source) return [];
            /*
             * Что вернуть можно, а что уже вернули, решает `lib/refund.ts` —
             * там же, где это под тестами. Проверять здесь ещё раз обязательно:
             * между двумя касаниями сенсорного экрана состояние одно и то же,
             * и второе нажатие «Возврат» отдало бы гостю ту же сумму дважды.
             */
            const refundable = refundablePayments(
              Object.values(state.payments).filter(
                (payment) => payment.orderId === source.orderId,
              ),
            );
            if (!refundable.some((payment) => payment.id === source.id)) return [];
            return [
              {
                ...source,
                id: newId(),
                cashShiftId: cashShift.id,
                refundOf: source.id,
                tendered: null,
                staffId: waiterId ?? source.staffId,
                paidAt: now,
                clientId: newId(),
              },
            ];
          }),
        });
      },
      cancelOrder: (orderId) => dispatch({ type: "order/cancel", orderId }),
    }),
    [
      state,
      activeOrders,
      orderOfTable,
      counterOrder,
      kitchenTickets,
      itemsOfOrder,
      orderSubtotal,
      orderTotal,
      orderTotals,
      discountsOfOrder,
      openOrder,
      addItem,
      stationOf,
      autoReadyStationIds,
      cashShift,
      waiterId,
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
