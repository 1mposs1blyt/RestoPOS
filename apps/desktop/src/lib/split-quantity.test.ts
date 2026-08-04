import { describe, expect, it } from "vitest";
import {
  describeSplit,
  splitEqually,
  splitUneven,
  sumParts,
} from "./split-quantity";

describe("деление на равные части", () => {
  it("пополам", () => {
    expect(splitEqually(1, 2)).toEqual([0.5, 0.5]);
  });

  it("на четыре", () => {
    expect(splitEqually(1, 4)).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it("меньше двух частей — это не деление", () => {
    expect(splitEqually(1, 1)).toEqual([1]);
    expect(splitEqually(2, 0)).toEqual([2]);
  });

  /*
   * Треть в десятичной записи не представима. Три доли по 0,333 дают 0,999:
   * гость недоплатит копейку, а сумма позиций разойдётся с суммой чека.
   */
  it("на три: остаток не теряется", () => {
    const parts = splitEqually(1, 3);

    expect(sumParts(parts)).toBe(1);
    expect(parts).toEqual([0.334, 0.333, 0.333]);
  });

  it("на семь: сумма долей всё равно точна", () => {
    const parts = splitEqually(1, 7);

    expect(parts).toHaveLength(7);
    expect(sumParts(parts)).toBe(1);
  });

  it("доли отличаются не больше чем на 0,001", () => {
    // Остаток раздаём по одной единице, а не сваливаем в последнюю долю:
    // иначе один гость платит заметно больше остальных.
    const parts = splitEqually(1, 6);
    expect(Math.max(...parts) - Math.min(...parts)).toBeCloseTo(0.001, 5);
  });

  it("делит количество больше единицы", () => {
    const parts = splitEqually(3, 2);

    expect(parts).toEqual([1.5, 1.5]);
    expect(sumParts(parts)).toBe(3);
  });

  it("сумма долей равна исходному при любом числе частей", () => {
    for (let n = 2; n <= 12; n += 1) {
      expect(sumParts(splitEqually(1, n))).toBe(1);
      expect(sumParts(splitEqually(5, n))).toBe(5);
    }
  });
});

describe("деление на две неравные части", () => {
  it("вторая доля считается вычитанием", () => {
    expect(splitUneven(1, 0.3)).toEqual([0.3, 0.7]);
  });

  it("сумма всегда равна исходному", () => {
    expect(sumParts(splitUneven(1, 0.37))).toBe(1);
    expect(sumParts(splitUneven(2, 1.25))).toBe(2);
  });

  it("больше исходного взять нельзя", () => {
    // Иначе вторая доля ушла бы в минус, и позиция «вернула» бы деньги в чек.
    expect(splitUneven(1, 5)).toEqual([1, 0]);
  });

  it("отрицательная доля обнуляется", () => {
    expect(splitUneven(1, -3)).toEqual([0, 1]);
  });
});

describe("человекочитаемая запись", () => {
  it("равные доли пишутся умножением", () => {
    expect(describeSplit(1, splitEqually(1, 2))).toBe("1 = 2 × 0,5");
  });

  it("неравные — перечислением", () => {
    expect(describeSplit(1, [0.3, 0.7])).toBe("1 = 0,3 + 0,7");
  });
});
