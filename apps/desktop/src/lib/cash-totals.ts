import type {
  CashOperation,
  CashShift,
  CashShiftTotals,
  Money,
  Payment,
} from "@restopos/shared-types";
import { fromMinor, sumMoney, toMinor, ZERO_MONEY } from "./money";

/**
 * Свод кассовой смены: то, что печатается X-отчётом и «итогом по смене».
 *
 * Чистая функция от трёх наборов, потому что сходиться обязаны именно они:
 * платежи (что пробили), движения по ящику (что доложили и забрали) и размен
 * (с чего начали). Считать это внутри компонента нельзя — расхождение
 * в копейку здесь означает разговор с бухгалтерией, а не косметический баг.
 *
 * Ключевая тонкость: **ожидаемая наличность считается только по наличным
 * платежам**. Карта в ящик не попадает, и включив её, мы получили бы недостачу
 * ровно на сумму безналичной выручки при каждом пересчёте.
 */
export function cashShiftTotals(
  shift: CashShift,
  payments: Payment[],
  operations: CashOperation[],
): CashShiftTotals {
  const own = payments.filter((payment) => payment.cashShiftId === shift.id);
  const ownOperations = operations.filter(
    (operation) => operation.cashShiftId === shift.id,
  );

  /*
   * Возврат — отдельная строка со ссылкой `refundOf`, а не правка исходной
   * (инвариант №6). В своде он вычитается: иначе выручка смены покажет деньги,
   * которые уже отданы обратно гостю.
   */
  const signed = (payment: Payment): number =>
    payment.refundOf === null ? toMinor(payment.amount) : -toMinor(payment.amount);

  const byType = new Map<string, { label: string; minor: number }>();
  for (const payment of own) {
    const bucket = byType.get(payment.paymentTypeId);
    if (bucket) bucket.minor += signed(payment);
    // Название берём из снимка в платеже, а не из справочника: справочник мог
    // измениться, а закрытый чек обязан остаться читаемым.
    else byType.set(payment.paymentTypeId, { label: payment.label, minor: signed(payment) });
  }

  const revenueMinor = own
    // «Без выручки» в выручку не идёт по определению рода.
    .filter((payment) => payment.kind !== "no_revenue")
    .reduce((acc, payment) => acc + signed(payment), 0);

  const cashMinor = own
    .filter((payment) => payment.kind === "cash")
    .reduce((acc, payment) => acc + signed(payment), 0);

  const deposits = sumOf(ownOperations, (op) =>
    op.kind === "deposit" || op.kind === "opening_float" ? op.amount : null,
  );
  const withdrawals = sumOf(ownOperations, (op) =>
    op.kind === "withdrawal" || op.kind === "collection" ? op.amount : null,
  );

  // Заказы считаем по различным `orderId`, а не по числу платежей: заказ,
  // оплаченный картой и наличными, — это один чек, а не два.
  const ordersCount = new Set(
    own.filter((payment) => payment.refundOf === null).map((p) => p.orderId),
  ).size;

  return {
    byPaymentType: [...byType.entries()]
      .map(([paymentTypeId, { label, minor }]) => ({
        paymentTypeId,
        label,
        amount: fromMinor(minor),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ru")),
    revenue: fromMinor(revenueMinor),
    deposits,
    withdrawals,
    expectedCash: fromMinor(
      toMinor(shift.openingFloat) +
        cashMinor +
        toMinor(deposits) -
        toMinor(withdrawals),
    ),
    ordersCount,
    // Делить не на что — честнее показать прочерк, чем ноль: ноль читается
    // как «средний чек нулевой», то есть как проблема, которой нет.
    averageCheck:
      ordersCount === 0 ? null : fromMinor(Math.round(revenueMinor / ordersCount)),
  };
}

function sumOf<T>(items: T[], pick: (item: T) => Money | null): Money {
  const picked = items.map(pick).filter((value): value is Money => value !== null);
  return picked.length === 0 ? ZERO_MONEY : sumMoney(picked);
}
