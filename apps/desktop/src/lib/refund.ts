import type { Money, Payment, UUID } from "@restopos/shared-types";
import { sumMoney } from "./money";

/**
 * Что по чеку ещё можно вернуть.
 *
 * Вынесено в чистую функцию по той же причине, что и остальная денежная
 * логика: ошибку здесь замечают не сразу, а при сверке кассы в конце дня.
 *
 * Правило одно, и оно про иммутабельность платежей (инвариант №6): возврат —
 * это **встречная строка** со ссылкой `refundOf`, а не правка исходной.
 * Отсюда два вида строк, которые возвращать нельзя:
 *
 * - сама встречная строка (`refundOf !== null`) — возврат возврата означал бы,
 *   что деньги у гостя забрали второй раз;
 * - строка, у которой встречная уже есть — иначе второе нажатие «Возврат»
 *   отдаёт гостю сумму чека дважды. Экран блокирует кнопку, но проверка обязана
 *   быть и здесь: между двумя касаниями сенсорного экрана состояние одно и то же.
 */
export function refundablePayments(payments: Payment[]): Payment[] {
  const refunded = refundedSources(payments);
  return payments.filter(
    (payment) => payment.refundOf === null && !refunded.has(payment.id),
  );
}

/** Сумма, которую вернут гостю, если возвращать весь чек целиком. */
export function refundableTotal(payments: Payment[]): Money {
  return sumMoney(refundablePayments(payments).map((payment) => payment.amount));
}

/** Уже возвращённая по чеку сумма. Ею экран объясняет, почему возврата нет. */
export function refundedTotal(payments: Payment[]): Money {
  return sumMoney(
    payments
      .filter((payment) => payment.refundOf !== null)
      .map((payment) => payment.amount),
  );
}

/** Идентификаторы платежей, к которым встречная строка уже проведена. */
function refundedSources(payments: Payment[]): Set<UUID> {
  const refunded = new Set<UUID>();
  for (const payment of payments) {
    if (payment.refundOf !== null) refunded.add(payment.refundOf);
  }
  return refunded;
}
