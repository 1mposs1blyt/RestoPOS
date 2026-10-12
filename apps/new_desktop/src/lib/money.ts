import type { Money } from "@restopos/shared-types";

/**
 * Деньги в домене — строка (`NUMERIC(10,2)`), см. `Money` в shared-types.
 * Арифметику ведём только в минорных единицах (копейках), чтобы не ловить
 * ошибки округления float. Наружу всегда возвращаем строку того же формата,
 * в котором её примет бэкенд.
 */

export function toMinor(money: Money): number {
  const trimmed = money.trim();
  const negative = trimmed.startsWith("-");
  const [whole, fraction = ""] = trimmed.replace("-", "").split(".");
  const kopecks = Number(`${fraction}00`.slice(0, 2));
  const total = Number(whole || "0") * 100 + kopecks;
  return negative ? -total : total;
}

export function fromMinor(minor: number): Money {
  const rounded = Math.round(minor);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function multiplyMoney(money: Money, quantity: number): Money {
  return fromMinor(toMinor(money) * quantity);
}

export function sumMoney(values: Money[]): Money {
  return fromMinor(values.reduce((acc, value) => acc + toMinor(value), 0));
}

/** Разность. Результат может быть отрицательным — сдача считается через неё. */
export function subtractMoney(from: Money, amount: Money): Money {
  return fromMinor(toMinor(from) - toMinor(amount));
}

/** Знак разности: <0, 0, >0 — как у компараторов сортировки. */
export function compareMoney(a: Money, b: Money): number {
  return toMinor(a) - toMinor(b);
}

export const ZERO_MONEY: Money = "0.00";

const RUB = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Копейки скрываем, когда их нет: на кассе так читается быстрее. */
export function formatMoney(money: Money): string {
  const minor = toMinor(money);
  const formatted =
    minor % 100 === 0
      ? new Intl.NumberFormat("ru-RU").format(minor / 100)
      : RUB.format(minor / 100);
  return `${formatted} ₽`;
}
