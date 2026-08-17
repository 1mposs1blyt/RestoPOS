import type {
  CashOperation,
  CashShift,
  Order,
  OrderDiscount,
  OrderItem,
  Payment,
} from "@restopos/shared-types";
import { findMenuItem } from "../state/menu";
import { findStaff } from "../data/session-source";
import { computeTotals } from "./discount";
import { fromMinor, multiplyMoney, sumMoney, toMinor, ZERO_MONEY } from "./money";

/**
 * Отчёты кассы.
 *
 * Каждый отчёт — **чистая функция** от снимка данных смены. Так их можно
 * прогнать тестами: расхождение в отчёте по выручке — это разговор
 * с бухгалтерией, а не косметический баг, и ловить его кликами по кассе поздно.
 *
 * Структура повторяет каталог iiko: группа → отчёт с кодом → параметры →
 * печать. Коды сохранены (011, 023, 048…), чтобы разговаривать с теми, кто
 * работал на iiko, на одном языке.
 */

export interface ReportContext {
  orders: Order[];
  items: OrderItem[];
  payments: Payment[];
  discounts: OrderDiscount[];
  operations: CashOperation[];
  cashShift: CashShift | undefined;
}

/**
 * Сумма заказа **со скидками** — то, что реально заплатил гость.
 *
 * Считать выручку по позициям в меню нельзя: скидка применяется к заказу,
 * и сумма позиций больше уплаченного ровно на неё. Пока скидок не было,
 * разницы не существовало, и отчёты по позициям сходились с отчётами
 * по платежам сами собой — с появлением скидок они разъехались, и управляющий
 * при сверке смены видел две разные выручки.
 */
function orderNet(context: ReportContext, order: Order): string {
  const subtotal = sumMoney(itemsOf(context, [order]).map(lineTotal));
  const lines = context.discounts
    .filter((discount) => discount.orderId === order.id)
    .map((discount) => ({
      kind: discount.kind,
      mode: discount.mode,
      value: discount.value,
    }));
  /*
   * Возврат вычитается здесь же, а не в каждом отчёте: он такая же поправка
   * к уплаченному, как скидка, и по той же причине. Пропустив его, отчёты
   * по позициям покажут выручку, которой уже нет, а отчёт по платежам (011)
   * её вычтет — и управляющий при сверке смены получит две правдоподобные
   * суммы вместо одной верной.
   */
  const paid = toMinor(computeTotals(subtotal, lines).total);
  return fromMinor(paid - refundedMinorOf(context, order.id));
}

/** Сколько по этому чеку вернули гостю. Ноль — возвратов не было. */
function refundedMinorOf(context: ReportContext, orderId: string): number {
  return context.payments
    .filter((payment) => payment.orderId === orderId && payment.refundOf !== null)
    .reduce((acc, payment) => acc + toMinor(payment.amount), 0);
}

/**
 * Чеки, возвращённые **целиком**: деньги гостю отданы полностью.
 *
 * Отдельно от «есть возврат» потому, что расход блюд — отчёт про еду:
 * вернули чек — вернули и еду, продажи не было. Частичный возврат чека касса
 * не делает (`state/checkout.tsx`), но строка может приехать с узла, и тогда
 * блюда остаются проданными: какое из них вернули, платёж не говорит.
 */
function fullyRefundedOrderIds(context: ReportContext): Set<string> {
  const sold = new Map<string, number>();
  const back = new Map<string, number>();

  for (const payment of context.payments) {
    const bucket = payment.refundOf === null ? sold : back;
    bucket.set(
      payment.orderId,
      (bucket.get(payment.orderId) ?? 0) + toMinor(payment.amount),
    );
  }

  return new Set(
    [...back.entries()]
      .filter(([orderId, minor]) => minor >= (sold.get(orderId) ?? 0))
      .map(([orderId]) => orderId),
  );
}

export interface ReportColumn {
  key: string;
  label: string;
  /** Числовые колонки прижимаем вправо — так столбец сумм читается сходу. */
  numeric?: boolean;
}

export interface ReportTable {
  columns: ReportColumn[];
  rows: Record<string, string>[];
  /** Итоговая строка. `null` — итог для этого отчёта бессмыслен. */
  footer: Record<string, string> | null;
}

export interface ReportDefinition {
  /** Код как в iiko: по нему отчёт узнают те, кто работал там. */
  code: string;
  title: string;
  group: string;
  run: (context: ReportContext) => ReportTable;
}

/** Заказы, попавшие в текущую кассовую смену и доведённые до оплаты. */
function paidOrders(context: ReportContext): Order[] {
  if (!context.cashShift) return [];
  return context.orders.filter(
    (order) =>
      order.status === "paid" &&
      order.cashShiftNumber === context.cashShift?.number,
  );
}

/** Платежи смены без возвратов, с их знаком. */
function signedPayments(context: ReportContext): { payment: Payment; minor: number }[] {
  if (!context.cashShift) return [];
  return context.payments
    .filter((payment) => payment.cashShiftId === context.cashShift?.id)
    .map((payment) => ({
      payment,
      // Возврат вычитается: иначе выручка покажет деньги, уже отданные гостю.
      minor:
        payment.refundOf === null
          ? toMinor(payment.amount)
          : -toMinor(payment.amount),
    }));
}

function itemsOf(context: ReportContext, orders: Order[]): OrderItem[] {
  const ids = new Set(orders.map((order) => order.id));
  return context.items.filter(
    (item) =>
      ids.has(item.orderId) &&
      // Сторно и разделённые исходники в продажи не идут: за первое не платят,
      // за второе платят их доли.
      item.status !== "voided" &&
      item.status !== "split",
  );
}

function lineTotal(item: OrderItem): string {
  const menuItem = findMenuItem(item.menuItemId);
  return menuItem ? multiplyMoney(menuItem.price, item.quantity) : ZERO_MONEY;
}

export const REPORTS: ReportDefinition[] = [
  {
    code: "011",
    title: "Общая выручка по типам оплаты",
    group: "01 Отчёты по выручке",
    run: (context) => {
      const byType = new Map<string, { label: string; minor: number }>();
      for (const { payment, minor } of signedPayments(context)) {
        const bucket = byType.get(payment.paymentTypeId);
        if (bucket) bucket.minor += minor;
        else byType.set(payment.paymentTypeId, { label: payment.label, minor });
      }
      const rows = [...byType.values()].map((bucket) => ({
        label: bucket.label,
        amount: fromMinor(bucket.minor),
      }));
      return {
        columns: [
          { key: "label", label: "Тип оплаты" },
          { key: "amount", label: "Сумма", numeric: true },
        ],
        rows,
        footer: {
          label: "Итого",
          amount: fromMinor(
            rows.reduce((acc, row) => acc + toMinor(row.amount), 0),
          ),
        },
      };
    },
  },

  {
    code: "013",
    title: "Общая выручка по официантам",
    group: "01 Отчёты по выручке",
    run: (context) => {
      const orders = paidOrders(context);
      const byWaiter = new Map<string, { count: number; minor: number }>();

      for (const order of orders) {
        // Со скидками: иначе выручка по официантам не сойдётся с выручкой
        // по типам оплаты, и обе будут выглядеть правдоподобно.
        const total = orderNet(context, order);
        const bucket = byWaiter.get(order.waiterId) ?? { count: 0, minor: 0 };
        bucket.count += 1;
        bucket.minor += toMinor(total);
        byWaiter.set(order.waiterId, bucket);
      }

      return {
        columns: [
          { key: "name", label: "Сотрудник" },
          { key: "count", label: "Чеков", numeric: true },
          { key: "amount", label: "Выручка", numeric: true },
        ],
        rows: [...byWaiter.entries()].map(([staffId, bucket]) => ({
          name: findStaff(staffId)?.fullName ?? staffId,
          count: String(bucket.count),
          amount: fromMinor(bucket.minor),
        })),
        footer: {
          name: "Итого",
          count: String(orders.length),
          amount: fromMinor(
            [...byWaiter.values()].reduce((acc, b) => acc + b.minor, 0),
          ),
        },
      };
    },
  },

  {
    code: "023",
    title: "Общие продажи блюд",
    group: "02 Отчёты по расходу блюд",
    run: (context) => {
      const byDish = new Map<string, { name: string; qty: number; minor: number }>();

      // Возвращённый чек — несостоявшаяся продажа: еда вернулась вместе
      // с деньгами. Посчитав её, отчёт завысит расход, а по нему заказывают
      // продукты на завтра.
      const refunded = fullyRefundedOrderIds(context);
      const sold = paidOrders(context).filter((order) => !refunded.has(order.id));

      for (const item of itemsOf(context, sold)) {
        const menuItem = findMenuItem(item.menuItemId);
        const bucket = byDish.get(item.menuItemId) ?? {
          name: menuItem?.name ?? "Позиция удалена из меню",
          qty: 0,
          minor: 0,
        };
        bucket.qty += item.quantity;
        bucket.minor += toMinor(lineTotal(item));
        byDish.set(item.menuItemId, bucket);
      }

      const rows = [...byDish.values()]
        // По сумме, а не по алфавиту: отчёт читают, чтобы увидеть, что кормит
        // заведение, а не чтобы найти конкретное блюдо.
        .sort((a, b) => b.minor - a.minor)
        .map((bucket) => ({
          name: bucket.name,
          // Дробные доли после деления блюда показываем как есть.
          qty: String(Number(bucket.qty.toFixed(3))),
          amount: fromMinor(bucket.minor),
        }));

      return {
        columns: [
          { key: "name", label: "Блюдо" },
          { key: "qty", label: "Кол-во", numeric: true },
          { key: "amount", label: "Сумма", numeric: true },
        ],
        rows,
        footer: {
          name: "Итого",
          qty: "",
          amount: fromMinor(
            rows.reduce((acc, row) => acc + toMinor(row.amount), 0),
          ),
        },
      };
    },
  },

  {
    code: "034",
    title: "Списания блюд (сторно)",
    group: "03 Специальные отчёты",
    run: (context) => {
      const orderById = new Map(context.orders.map((order) => [order.id, order]));
      const rows = context.items
        .filter((item) => item.status === "voided")
        .map((item) => ({
          order: `№ ${orderById.get(item.orderId)?.number ?? "—"}`,
          name: findMenuItem(item.menuItemId)?.name ?? "—",
          qty: String(item.quantity),
          amount: lineTotal(item),
        }));

      return {
        columns: [
          { key: "order", label: "Заказ" },
          { key: "name", label: "Блюдо" },
          { key: "qty", label: "Кол-во", numeric: true },
          { key: "amount", label: "Сумма", numeric: true },
        ],
        rows,
        footer: {
          order: "Итого",
          name: "",
          qty: "",
          amount: fromMinor(
            rows.reduce((acc, row) => acc + toMinor(row.amount), 0),
          ),
        },
      };
    },
  },

  {
    code: "036",
    title: "Отчёт по скидкам и надбавкам",
    group: "03 Специальные отчёты",
    run: (context) => {
      const orderById = new Map(context.orders.map((order) => [order.id, order]));
      const ownOrders = new Set(paidOrders(context).map((order) => order.id));

      const rows = context.discounts
        // Только по закрытым чекам текущей смены: скидка на ещё не оплаченном
        // заказе может быть снята, и в отчёт ей рано.
        .filter((discount) => ownOrders.has(discount.orderId))
        .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt))
        .map((discount) => ({
          order: `№ ${orderById.get(discount.orderId)?.number ?? "—"}`,
          label: discount.label,
          // Скидка и надбавка в разных колонках намеренно: в сумме они могут
          // дать ноль, и одной колонкой это выглядело бы как «ничего не было».
          discount: discount.kind === "discount" ? discount.amount : "",
          surcharge: discount.kind === "surcharge" ? discount.amount : "",
          staff: findStaff(discount.staffId)?.fullName ?? discount.staffId,
          approved: discount.approvedBy
            ? (findStaff(discount.approvedBy)?.fullName ?? discount.approvedBy)
            : "своим правом",
        }));

      const sumOf = (key: "discount" | "surcharge") =>
        fromMinor(
          rows.reduce((acc, row) => acc + (row[key] ? toMinor(row[key]) : 0), 0),
        );

      return {
        columns: [
          { key: "order", label: "Заказ" },
          { key: "label", label: "Основание" },
          { key: "staff", label: "Кто" },
          { key: "approved", label: "Подтвердил" },
          { key: "discount", label: "Скидка", numeric: true },
          { key: "surcharge", label: "Надбавка", numeric: true },
        ],
        rows,
        footer: {
          order: "Итого",
          label: "",
          staff: "",
          approved: "",
          discount: sumOf("discount"),
          surcharge: sumOf("surcharge"),
        },
      };
    },
  },

  {
    code: "046",
    title: "Реестр счетов",
    group: "04 Отчёты по кассе",
    run: (context) => {
      const rows = paidOrders(context)
        .sort((a, b) => (a.receiptNumber ?? 0) - (b.receiptNumber ?? 0))
        .map((order) => ({
          // Пометка обязательна: без неё возвращённый чек выглядит счётом
          // на нулевую сумму, то есть ошибкой кассы, а не возвратом.
          receipt:
            refundedMinorOf(context, order.id) > 0
              ? `${order.receiptNumber ?? "—"} · возврат`
              : String(order.receiptNumber ?? "—"),
          number: `№ ${order.number}`,
          time: formatTime(order.createdAt),
          waiter: findStaff(order.waiterId)?.fullName ?? order.waiterId,
          // Сумма чека — уплаченная, а не по прайсу: реестр счетов сверяют
          // с кассовой лентой.
          amount: orderNet(context, order),
        }));

      return {
        columns: [
          { key: "receipt", label: "Чек" },
          { key: "number", label: "Заказ" },
          { key: "time", label: "Время" },
          { key: "waiter", label: "Официант" },
          { key: "amount", label: "Сумма", numeric: true },
        ],
        rows,
        footer: {
          receipt: "Итого",
          number: "",
          time: "",
          waiter: `чеков: ${rows.length}`,
          amount: fromMinor(
            rows.reduce((acc, row) => acc + toMinor(row.amount), 0),
          ),
        },
      };
    },
  },

  {
    code: "048",
    title: "Итого по смене",
    group: "04 Отчёты по кассе",
    run: (context) => {
      const signed = signedPayments(context);
      const revenue = signed
        .filter(({ payment }) => payment.kind !== "no_revenue")
        .reduce((acc, { minor }) => acc + minor, 0);
      const cash = signed
        .filter(({ payment }) => payment.kind === "cash")
        .reduce((acc, { minor }) => acc + minor, 0);

      const ops = context.operations.filter(
        (operation) => operation.cashShiftId === context.cashShift?.id,
      );
      const deposits = ops
        .filter((op) => op.kind === "deposit" || op.kind === "opening_float")
        .reduce((acc, op) => acc + toMinor(op.amount), 0);
      const withdrawals = ops
        .filter((op) => op.kind === "withdrawal" || op.kind === "collection")
        .reduce((acc, op) => acc + toMinor(op.amount), 0);

      const float = toMinor(context.cashShift?.openingFloat ?? ZERO_MONEY);
      const checks = paidOrders(context).length;

      return {
        columns: [
          { key: "label", label: "Показатель" },
          { key: "value", label: "Значение", numeric: true },
        ],
        rows: [
          { label: "Смена", value: String(context.cashShift?.number ?? "—") },
          { label: "Разменный фонд", value: fromMinor(float) },
          { label: "Выручка", value: fromMinor(revenue) },
          { label: "в том числе наличными", value: fromMinor(cash) },
          { label: "Внесено", value: fromMinor(deposits) },
          { label: "Изъято", value: fromMinor(withdrawals) },
          { label: "Чеков", value: String(checks) },
          {
            label: "Средний чек",
            // Прочерк, а не ноль: ноль читается как «средний чек нулевой»,
            // то есть как проблема, которой нет.
            value: checks === 0 ? "—" : fromMinor(Math.round(revenue / checks)),
          },
        ],
        footer: {
          label: "Ожидается в ящике",
          value: fromMinor(float + cash + deposits - withdrawals),
        },
      };
    },
  },

  {
    code: "052",
    title: "Отчёт по внесениям и изъятиям",
    group: "04 Отчёты по кассе",
    run: (context) => {
      const labels: Record<CashOperation["kind"], string> = {
        deposit: "Внесение",
        withdrawal: "Изъятие",
        opening_float: "Размен",
        collection: "Инкассация",
      };

      const rows = context.operations
        .filter((operation) => operation.cashShiftId === context.cashShift?.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((operation) => ({
          time: formatTime(operation.createdAt),
          kind: labels[operation.kind],
          staff: findStaff(operation.staffId)?.fullName ?? operation.staffId,
          comment: operation.comment || "—",
          amount: operation.amount,
        }));

      return {
        columns: [
          { key: "time", label: "Время" },
          { key: "kind", label: "Операция" },
          { key: "staff", label: "Кто" },
          { key: "comment", label: "Комментарий" },
          { key: "amount", label: "Сумма", numeric: true },
        ],
        rows,
        footer: null,
      };
    },
  },
];

/** Отчёты, сгруппированные по разделам, в порядке кодов. */
export function reportGroups(): { group: string; reports: ReportDefinition[] }[] {
  const groups = new Map<string, ReportDefinition[]>();
  for (const report of [...REPORTS].sort((a, b) => a.code.localeCompare(b.code))) {
    const bucket = groups.get(report.group) ?? [];
    bucket.push(report);
    groups.set(report.group, bucket);
  }
  return [...groups.entries()]
    .map(([group, reports]) => ({ group, reports }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
