import type { Money } from "@restopos/shared-types";
import { fromMinor, subtractMoney, sumMoney, toMinor, ZERO_MONEY } from "./money";

/**
 * Раскладка внесённых денег по строкам оплаты.
 *
 * Разделение «внесено» и «сумма платежа» — самое дорогое место экрана оплаты.
 * Гость даёт 1000 за чек на 700: внесено 1000, платёж 700, сдача 300. Записать
 * платёж на 1000 значит завысить выручку смены ровно на сумму всех сдач за день,
 * и расхождение всплывёт только при пересчёте ящика.
 *
 * Строки гасят долг **по порядку**: первая берёт сколько может, следующая —
 * остаток. Переплата возможна только последней строкой и целиком уходит в сдачу.
 */

export interface SplitLine {
  id: string;
  tendered: Money;
}

export interface SplitResult {
  /** Сколько с каждой строки реально ушло в оплату, по её `id`. */
  applied: Map<string, Money>;
  /** Оплачено всего. Не больше суммы чека. */
  paid: Money;
  /** Положено на стол всего. Может быть больше суммы чека. */
  tendered: Money;
  /** Сколько ещё осталось внести. */
  due: Money;
  /** Сдача — разница между положенным и оплаченным. */
  change: Money;
  /** Достаточно ли внесено, чтобы закрыть чек. */
  isSettled: boolean;
}

export function splitPayment(total: Money, lines: SplitLine[]): SplitResult {
  let restMinor = toMinor(total);
  const applied = new Map<string, Money>();

  for (const line of lines) {
    /*
     * Отрицательное «внесено» невозможно набрать с клавиатуры, но может
     * приехать из восстановленного состояния. Нижняя граница в нуле не даёт
     * такой строке «вернуть» деньги в остаток долга.
     */
    const takeMinor = Math.max(0, Math.min(restMinor, toMinor(line.tendered)));
    applied.set(line.id, fromMinor(takeMinor));
    restMinor -= takeMinor;
  }

  const paid = sumMoney([...applied.values()]);
  const tendered =
    lines.length === 0 ? ZERO_MONEY : sumMoney(lines.map((line) => line.tendered));

  return {
    applied,
    paid,
    tendered,
    due: fromMinor(Math.max(0, restMinor)),
    change: subtractMoney(tendered, paid),
    // Пустой список — не «оплачено ноль из нуля»: чек на ноль рублей закрывать
    // тоже нужно осознанно, хотя бы строкой «без выручки».
    isSettled: lines.length > 0 && restMinor <= 0,
  };
}
