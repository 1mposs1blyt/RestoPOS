import type { Money } from "@restopos/shared-types";
import { fromMinor, toMinor, ZERO_MONEY } from "./money";

/**
 * Скидки и надбавки.
 *
 * Надбавка — **не отрицательная скидка**, а отдельный род. Сведя их в одно
 * знаковое поле, мы сэкономили бы колонку и потеряли отчёт: «036 Отчёт
 * по скидкам и надбавкам» показывает их раздельно, потому что скидка это
 * потеря выручки, а надбавка (обслуживание, доставка) — её источник.
 * В сумме они могут дать ноль, и без разделения это выглядит как «ничего
 * не было».
 *
 * Формула фиксирована и совпадает с экраном оплаты:
 *
 *     ИТОГО = ПОДЫТОГ − СКИДКА + НАДБАВКА
 *
 * Проценты считаются **от подытога**, а не каскадом друг от друга. Каскад
 * («10% и ещё 5% от остатка») даёт результат, зависящий от порядка применения,
 * и гость с двумя скидками получал бы разную сумму в зависимости от того,
 * в каком порядке кассир их нажал.
 */

export type DiscountKind = "discount" | "surcharge";
export type DiscountMode = "percent" | "amount";

export interface DiscountLine {
  kind: DiscountKind;
  mode: DiscountMode;
  /** Для `percent` — проценты (10 = 10%), для `amount` — сумма в рублях. */
  value: string;
  /** Позиция, если скидка на одно блюдо. `null`/нет — на весь заказ. */
  orderItemId?: string | null;
}

export interface OrderTotals {
  subtotal: Money;
  discount: Money;
  surcharge: Money;
  total: Money;
}

/** Сумма одной строки в копейках. База — подытог, а не текущий остаток. */
function lineMinor(line: DiscountLine, subtotalMinor: number): number {
  if (line.mode === "amount") return toMinor(line.value);
  const percent = Number(line.value);
  if (!Number.isFinite(percent)) return 0;
  // Округляем к ближайшей копейке: половина копейки в пользу заведения
  // и половина в пользу гостя за смену сходятся, а систематический сдвиг — нет.
  return Math.round((subtotalMinor * percent) / 100);
}

export function computeTotals(
  subtotal: Money,
  lines: readonly DiscountLine[],
): OrderTotals {
  const subtotalMinor = toMinor(subtotal);

  let discountMinor = 0;
  let surchargeMinor = 0;

  for (const line of lines) {
    // Отрицательное значение — это попытка сделать скидку надбавкой обходным
    // путём. Род задаётся полем `kind`, а не знаком, иначе отчёт по скидкам
    // покажет отрицательную скидку вместо надбавки.
    const amount = Math.max(0, lineMinor(line, subtotalMinor));
    if (line.kind === "discount") discountMinor += amount;
    else surchargeMinor += amount;
  }

  /*
   * Скидка не может превысить подытог: иначе итог уходит в минус, и касса
   * начинает быть должна гостю. Обрезаем именно скидку, а не итог, — тогда
   * в чеке видно, сколько реально применилось.
   */
  discountMinor = Math.min(discountMinor, subtotalMinor);

  return {
    subtotal: fromMinor(subtotalMinor),
    discount: fromMinor(discountMinor),
    surcharge: fromMinor(surchargeMinor),
    total: fromMinor(subtotalMinor - discountMinor + surchargeMinor),
  };
}

/**
 * Раскладка скидки заказа по позициям — для склада и отчёта по блюдам.
 *
 * Скидка применяется к заказу целиком, но списание продуктов и «продажи блюд»
 * считаются по позициям. Без раскладки сумма позиций не сойдётся с итогом чека.
 *
 * Остаток от деления отдаём последней позиции: три позиции и скидка 10 рублей
 * дают 3.33 + 3.33 + 3.34, а не три по 3.33 с потерянной копейкой.
 */
export function spreadOverItems(
  discount: Money,
  itemTotals: readonly { id: string; amount: Money }[],
): Map<string, Money> {
  const result = new Map<string, Money>();
  const totalMinor = itemTotals.reduce(
    (acc, item) => acc + toMinor(item.amount),
    0,
  );

  if (totalMinor === 0 || itemTotals.length === 0) {
    for (const item of itemTotals) result.set(item.id, ZERO_MONEY);
    return result;
  }

  const discountMinor = Math.min(toMinor(discount), totalMinor);
  let distributed = 0;

  itemTotals.forEach((item, index) => {
    const isLast = index === itemTotals.length - 1;
    // Пропорционально доле позиции в чеке, а не поровну: скидка 10% на чек
    // из борща за 420 и чая за 80 не может дать по 25 рублей на каждое.
    const share = isLast
      ? discountMinor - distributed
      : Math.round((discountMinor * toMinor(item.amount)) / totalMinor);
    distributed += share;
    result.set(item.id, fromMinor(share));
  });

  return result;
}
