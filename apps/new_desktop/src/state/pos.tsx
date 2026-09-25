import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { MenuItem, Money, UUID } from "@restopos/shared-types";
import {
  fromMinor,
  multiplyMoney,
  subtractMoney,
  sumMoney,
  toMinor,
  ZERO_MONEY,
} from "../lib/money";

/** Строка чека. Цена — снимок на момент добавления, а не ссылка на меню. */
export interface CounterLine {
  id: string;
  menuItemId: UUID;
  name: string;
  price: Money;
  quantity: number;
}

export type PaymentKind = "cash" | "card";

/**
 * Платёж смены. Иммутабелен: возврат — встречная строка со ссылкой
 * `refundOf`, а не правка исходной. Закрытый чек это финансовый документ,
 * и «исправить» его задним числом нельзя.
 */
export interface Payment {
  id: string;
  orderNumber: number;
  kind: PaymentKind;
  /** Сумма платежа, а не внесённое: сдача в выручку не идёт. */
  amount: Money;
  at: string;
  refundOf?: string;
}

export type CashOperationKind = "deposit" | "withdraw" | "collection";

export interface CashOperation {
  id: string;
  kind: CashOperationKind;
  amount: Money;
  at: string;
}

/** Заказ, оплаченный и ждущий выдачи либо уже отданный. */
export interface PaidOrder {
  number: number;
  lines: CounterLine[];
  total: Money;
  kind: PaymentKind;
  paymentId: string;
  at: string;
  handed: boolean;
  refundedAt: string | null;
}

export interface Shift {
  status: "open" | "closed";
  number: number;
  openingFloat: Money;
  openedAt: string | null;
}

/**
 * Остаток по позиции. `0` — кончилось совсем, число больше нуля —
 * «осталось N порций».
 *
 * Стоп-лист хранит именно остаток, а не флаг: «осталось три» флагом
 * не выражается, а кассиру это нужно знать до того, как он пробьёт четыре.
 */
type StopList = Record<UUID, number>;

interface PosState {
  orderNumber: number;
  lines: CounterLine[];
  shift: Shift;
  payments: Payment[];
  cashOperations: CashOperation[];
  orders: PaidOrder[];
  stopList: StopList;
  sequence: number;
}

type PosAction =
  | { type: "add"; item: MenuItem }
  | { type: "increment"; lineId: string }
  | { type: "decrement"; lineId: string }
  | { type: "clear" }
  | { type: "shift/open"; openingFloat: Money; at: string }
  | { type: "shift/close" }
  | { type: "cash/operation"; kind: CashOperationKind; amount: Money; at: string }
  | { type: "pay"; kind: PaymentKind; at: string }
  | { type: "hand"; orderNumber: number }
  | { type: "refund"; orderNumber: number; at: string }
  | { type: "stop/set"; menuItemId: UUID; remainder: number }
  | { type: "stop/clear"; menuItemId: UUID };

const INITIAL: PosState = {
  orderNumber: 1,
  lines: [],
  shift: { status: "closed", number: 1, openingFloat: ZERO_MONEY, openedAt: null },
  payments: [],
  cashOperations: [],
  orders: [],
  /* Луковые кольца кончились — чтобы стоп-лист было на чём увидеть. */
  stopList: { "itm-snk-rings": 0 },
  sequence: 1,
};

export function totalOf(lines: CounterLine[]): Money {
  if (lines.length === 0) return ZERO_MONEY;
  return sumMoney(lines.map((line) => multiplyMoney(line.price, line.quantity)));
}

function reducer(state: PosState, action: PosAction): PosState {
  switch (action.type) {
    /*
     * Дедупликация живёт здесь, а не в экране: по плитке на сенсорном
     * экране регулярно попадают двойным касанием, и два вызова подряд видят
     * один снимок состояния. Снаружи повтор не отличить от первого раза.
     */
    case "add": {
      const remainder = state.stopList[action.item.id];
      if (remainder === 0) return state;

      const existing = state.lines.find(
        (line) =>
          line.menuItemId === action.item.id && line.price === action.item.price,
      );
      const lines = existing
        ? state.lines.map((line) =>
            line.id === existing.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [
            ...state.lines,
            {
              id: `line-${state.sequence}`,
              menuItemId: action.item.id,
              name: action.item.name,
              price: action.item.price,
              quantity: 1,
            },
          ];

      /* Остаток тратится вместе с добавлением: иначе «осталось 3» остаётся
         тройкой после четырёх пробитых порций. */
      const stopList =
        remainder === undefined
          ? state.stopList
          : { ...state.stopList, [action.item.id]: remainder - 1 };

      return { ...state, lines, stopList, sequence: state.sequence + 1 };
    }

    case "increment":
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.id === action.lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        ),
      };

    /* Ноль — это удаление строки: отдельной кнопки корзины не нужно. */
    case "decrement":
      return {
        ...state,
        lines: state.lines.flatMap((line) => {
          if (line.id !== action.lineId) return [line];
          if (line.quantity <= 1) return [];
          return [{ ...line, quantity: line.quantity - 1 }];
        }),
      };

    case "clear":
      return { ...state, lines: [] };

    case "shift/open":
      return {
        ...state,
        shift: {
          status: "open",
          number: state.shift.number,
          openingFloat: action.openingFloat,
          openedAt: action.at,
        },
      };

    /*
     * Закрытие гасит счётчики смены: платежи и операции по кассе относятся
     * к смене, а не к терминалу. Номер смены при этом растёт и не
     * переиспользуется — на него ссылается закрытый чек.
     */
    case "shift/close":
      return {
        ...state,
        shift: {
          status: "closed",
          number: state.shift.number + 1,
          openingFloat: ZERO_MONEY,
          openedAt: null,
        },
        payments: [],
        cashOperations: [],
        orders: [],
      };

    case "cash/operation":
      return {
        ...state,
        cashOperations: [
          ...state.cashOperations,
          {
            id: `cash-${state.sequence}`,
            kind: action.kind,
            amount: action.amount,
            at: action.at,
          },
        ],
        sequence: state.sequence + 1,
      };

    /*
     * На прилавке платят вперёд, поэтому оплаченный заказ сразу уезжает
     * в очередь выдачи, а не исчезает: еда от оплаты готовой не становится.
     */
    case "pay": {
      if (state.lines.length === 0 || state.shift.status !== "open") return state;
      const paymentId = `pay-${state.sequence}`;
      const total = totalOf(state.lines);
      return {
        ...state,
        orderNumber: state.orderNumber + 1,
        lines: [],
        sequence: state.sequence + 1,
        payments: [
          ...state.payments,
          {
            id: paymentId,
            orderNumber: state.orderNumber,
            kind: action.kind,
            amount: total,
            at: action.at,
          },
        ],
        orders: [
          ...state.orders,
          {
            number: state.orderNumber,
            lines: state.lines,
            total,
            kind: action.kind,
            paymentId,
            at: action.at,
            handed: false,
            refundedAt: null,
          },
        ],
      };
    }

    case "hand":
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.number === action.orderNumber
            ? { ...order, handed: true }
            : order,
        ),
      };

    /*
     * Возврат — встречная строка, а не удаление платежа. Повторный возврат
     * по тому же заказу невозможен: иначе гостю отдают сумму чека дважды,
     * а замечают это при сверке кассы.
     */
    case "refund": {
      const order = state.orders.find(
        (candidate) => candidate.number === action.orderNumber,
      );
      if (!order || order.refundedAt !== null) return state;
      return {
        ...state,
        sequence: state.sequence + 1,
        payments: [
          ...state.payments,
          {
            id: `pay-${state.sequence}`,
            orderNumber: order.number,
            kind: order.kind,
            amount: order.total,
            at: action.at,
            refundOf: order.paymentId,
          },
        ],
        orders: state.orders.map((candidate) =>
          candidate.number === order.number
            ? { ...candidate, refundedAt: action.at, handed: true }
            : candidate,
        ),
      };
    }

    case "stop/set":
      return {
        ...state,
        stopList: { ...state.stopList, [action.menuItemId]: action.remainder },
      };

    case "stop/clear": {
      const { [action.menuItemId]: _removed, ...rest } = state.stopList;
      return { ...state, stopList: rest };
    }
  }
}

/** Свод смены. Считается в одном месте: расходятся такие числа мгновенно. */
export interface ShiftTotals {
  cashSales: Money;
  cardSales: Money;
  refunds: Money;
  deposits: Money;
  withdrawals: Money;
  /** Сколько наличных должно быть в ящике прямо сейчас. */
  expectedCash: Money;
  receipts: number;
}

function sumOf(values: Money[]): Money {
  return values.length === 0 ? ZERO_MONEY : sumMoney(values);
}

export function totalsOf(
  shift: Shift,
  payments: Payment[],
  operations: CashOperation[],
): ShiftTotals {
  const sales = payments.filter((payment) => payment.refundOf === undefined);
  const refunds = payments.filter((payment) => payment.refundOf !== undefined);
  const byKind = (list: Payment[], kind: PaymentKind) =>
    sumOf(list.filter((p) => p.kind === kind).map((p) => p.amount));
  const opsOf = (kind: CashOperationKind) =>
    sumOf(operations.filter((o) => o.kind === kind).map((o) => o.amount));

  const cashSales = byKind(sales, "cash");
  const cashRefunds = byKind(refunds, "cash");
  const deposits = opsOf("deposit");
  /* Инкассация уносит деньги из ящика так же, как изъятие, но считается
     отдельно: по ней отчитываются перед банком, а не перед сменой. */
  const withdrawals = sumOf([opsOf("withdraw"), opsOf("collection")]);

  return {
    cashSales,
    cardSales: byKind(sales, "card"),
    /* Возврат копится отдельной строкой, а не вычитается из выручки:
       «продали 0» и «продали 1000, вернули 1000» обязаны различаться. */
    refunds: sumOf([byKind(refunds, "cash"), byKind(refunds, "card")]),
    deposits,
    withdrawals,
    expectedCash: subtractMoney(
      sumOf([shift.openingFloat, cashSales, deposits]),
      sumOf([cashRefunds, withdrawals]),
    ),
    receipts: sales.length,
  };
}

interface PosValue extends PosState {
  total: Money;
  totals: ShiftTotals;
  queue: PaidOrder[];
  add: (item: MenuItem) => void;
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  clear: () => void;
  openShift: (openingFloat: Money) => void;
  closeShift: () => void;
  cashOperation: (kind: CashOperationKind, amount: Money) => void;
  pay: (kind: PaymentKind) => void;
  hand: (orderNumber: number) => void;
  refund: (orderNumber: number) => void;
  setStop: (menuItemId: UUID, remainder: number) => void;
  clearStop: (menuItemId: UUID) => void;
  remainderOf: (menuItemId: UUID) => number | undefined;
}

const PosContext = createContext<PosValue | null>(null);

const now = () => new Date().toISOString();

export function PosProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const value = useMemo<PosValue>(
    () => ({
      ...state,
      total: totalOf(state.lines),
      totals: totalsOf(state.shift, state.payments, state.cashOperations),
      queue: state.orders.filter((order) => !order.handed),
      add: (item) => dispatch({ type: "add", item }),
      increment: (lineId) => dispatch({ type: "increment", lineId }),
      decrement: (lineId) => dispatch({ type: "decrement", lineId }),
      clear: () => dispatch({ type: "clear" }),
      openShift: (openingFloat) =>
        dispatch({ type: "shift/open", openingFloat, at: now() }),
      closeShift: () => dispatch({ type: "shift/close" }),
      cashOperation: (kind, amount) =>
        dispatch({ type: "cash/operation", kind, amount, at: now() }),
      pay: (kind) => dispatch({ type: "pay", kind, at: now() }),
      hand: (orderNumber) => dispatch({ type: "hand", orderNumber }),
      refund: (orderNumber) =>
        dispatch({ type: "refund", orderNumber, at: now() }),
      setStop: (menuItemId, remainder) =>
        dispatch({ type: "stop/set", menuItemId, remainder }),
      clearStop: (menuItemId) => dispatch({ type: "stop/clear", menuItemId }),
      remainderOf: (menuItemId) => state.stopList[menuItemId],
    }),
    [state],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos(): PosValue {
  const value = useContext(PosContext);
  if (!value) throw new Error("usePos вызван вне PosProvider");
  return value;
}

/** Деньги из целых рублей — набор с клавиатуры и номиналы идут через неё. */
export function rublesToMoney(rubles: number): Money {
  return fromMinor(rubles * 100);
}

export function moneyToRubles(money: Money): number {
  return Math.trunc(toMinor(money) / 100);
}
