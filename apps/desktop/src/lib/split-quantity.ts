/**
 * Деление количества блюда на части.
 *
 * В iiko это формула «1 = 2 × 0,5»: одна порция превращается в несколько
 * долей, которые потом расходятся по гостям. Делят обычно уже поданное блюдо,
 * когда компания просит разбить счёт.
 *
 * Единственная нетривиальная вещь здесь — **остаток**. Треть от единицы
 * в десятичной записи не представима, и три доли по 0.333 дают 0.999:
 * гость недоплатит копейку, а сумма чека не сойдётся с суммой позиций.
 * Поэтому остаток отдаём последней доле, и сумма долей всегда равна исходному
 * количеству точно.
 */

/** Знаков после запятой в доле. Больше трёх на чеке всё равно не показать. */
const SCALE = 1000;

/**
 * Разделить количество на `parts` равных долей.
 *
 * Возвращает доли, сумма которых **точно** равна `quantity`.
 */
export function splitEqually(quantity: number, parts: number): number[] {
  if (parts < 2) return [quantity];

  const totalUnits = Math.round(quantity * SCALE);
  const base = Math.floor(totalUnits / parts);
  const shares = Array.from({ length: parts }, () => base);

  // Нераспределённые единицы раздаём по одной с начала, а не сваливаем
  // в последнюю долю: так доли отличаются максимум на 0.001, а не на всю
  // накопленную разницу.
  let rest = totalUnits - base * parts;
  for (let i = 0; rest > 0; i = (i + 1) % parts) {
    shares[i] += 1;
    rest -= 1;
  }

  return shares.map((units) => units / SCALE);
}

/**
 * Разделить на две неравные доли: первая — `first`, вторая — остаток.
 *
 * Остаток считаем вычитанием, а не вторым вводом: два независимых числа
 * рано или поздно не сойдутся с исходным количеством, и позиция «уедет»
 * из суммы чека.
 */
export function splitUneven(quantity: number, first: number): number[] {
  const totalUnits = Math.round(quantity * SCALE);
  const firstUnits = Math.min(Math.max(Math.round(first * SCALE), 0), totalUnits);
  return [firstUnits / SCALE, (totalUnits - firstUnits) / SCALE];
}

/** Сумма долей. Для проверок и показа «1 = 2 × 0,5». */
export function sumParts(parts: number[]): number {
  return Math.round(parts.reduce((acc, part) => acc + part * SCALE, 0)) / SCALE;
}

/** «1 = 3 × 0,334 + 0,333» — человекочитаемая запись деления. */
export function describeSplit(quantity: number, parts: number[]): string {
  const unique = [...new Set(parts)];
  if (unique.length === 1) {
    return `${format(quantity)} = ${parts.length} × ${format(unique[0])}`;
  }
  return `${format(quantity)} = ${parts.map(format).join(" + ")}`;
}

function format(value: number): string {
  return String(Number(value.toFixed(3))).replace(".", ",");
}
