import type { Money } from "@restopos/shared-types";
import { toMinor } from "./money";

/**
 * Раскладка итога заказа по строкам фискального чека.
 *
 * Зачем это вообще нужно. Скидка и надбавка применяются **к заказу целиком**
 * (`lib/discount.ts`), а позиции остаются по полной цене. ККТ такой документ
 * не примет: сумма позиций обязана сойтись с суммой платежей до копейки.
 * Да и по ФФД цена в чеке указывается уже со скидкой — гость должен видеть,
 * за что именно он заплатил, а не «борщ 420, итого 380».
 *
 * Единственная нетривиальная вещь здесь — **остаток**, ровно как в делении
 * блюда (`lib/split-quantity.ts`). Скидка 7% на три позиции не делится нацело,
 * и наивное пропорциональное деление даёт сумму, отличающуюся от итога
 * на копейку-другую. Копейка расхождения — это отклонённый ККТ документ
 * посреди расчёта гостя, поэтому остаток раздаётся явно, а инвариант
 * «сумма строк равна итогу точно» проверяется тестами.
 */

/** Позиция заказа в виде, пригодном для чека. */
export interface ReceiptLineSource {
  name: string;
  /** Количество, возможно дробное после деления блюда. */
  quantity: number;
  /** Цена за единицу до скидки. */
  unitPrice: Money;
}

export interface ReceiptLine {
  name: string;
  /** Количество в тысячных — в этом виде его ждёт ККТ. */
  quantityMilli: number;
  /** Цена за единицу в копейках, **до** скидки: её печатают в чеке. */
  price: number;
  /** Стоимость строки в копейках, **со** скидкой. Её и зачтёт ККТ. */
  lineTotal: number;
}

/**
 * Разложить итог заказа по позициям.
 *
 * `total` — то, что гость реально платит: подытог за вычетом скидки и с учётом
 * надбавки. Возвращаемые строки в сумме дают ровно его.
 */
export function buildReceiptLines(
  sources: readonly ReceiptLineSource[],
  total: Money,
): ReceiptLine[] {
  if (sources.length === 0) return [];

  const target = toMinor(total);

  const gross = sources.map((source) =>
    Math.round(toMinor(source.unitPrice) * source.quantity),
  );
  const grossTotal = gross.reduce((acc, value) => acc + value, 0);

  /*
   * Позиции по нулевой цене (акция, блюдо за счёт заведения) — реальный случай,
   * и делить на ноль здесь нельзя. Раскидываем поровну: пропорция от нулевых
   * сумм не определена, а сойтись с итогом всё равно обязаны.
   */
  const shares =
    grossTotal === 0
      ? sources.map(() => Math.floor(target / sources.length))
      : gross.map((value) => Math.floor((value * target) / grossTotal));

  // Округление вниз никогда не даёт перебора, поэтому остаток неотрицателен.
  let rest = target - shares.reduce((acc, value) => acc + value, 0);

  /*
   * Раздаём по копейке с начала и по кругу, а не сваливаем всё в последнюю
   * строку: так строки расходятся максимум на копейку, а не на всю накопленную
   * разницу. Тот же приём, что в `splitEqually`.
   */
  for (let i = 0; rest > 0; i = (i + 1) % shares.length) {
    shares[i] += 1;
    rest -= 1;
  }

  return sources.map((source, index) => ({
    name: source.name,
    quantityMilli: Math.round(source.quantity * 1000),
    price: toMinor(source.unitPrice),
    lineTotal: shares[index],
  }));
}

/** Сумма строк в копейках. Для проверок и для сверки с итогом заказа. */
export function sumReceiptLines(lines: readonly ReceiptLine[]): number {
  return lines.reduce((acc, line) => acc + line.lineTotal, 0);
}
