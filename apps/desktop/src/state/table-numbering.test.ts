import { describe, expect, it } from "vitest";
import { findDuplicateLabels, nextTableLabel } from "./table-numbering";

/**
 * Нумерация столов. Раньше номер брался как «количество + 1», и после удаления
 * стола длина массива снова совпадала с уже занятой меткой — получались дубли.
 * Эти тесты закрепляют, что так больше не будет.
 */

const tables = (...labels: string[]) => labels.map((label) => ({ label }));

describe("nextTableLabel", () => {
  it("начинает с единицы", () => {
    expect(nextTableLabel([])).toBe("1");
  });

  it("продолжает подряд идущий ряд", () => {
    expect(nextTableLabel(tables("1", "2", "3"))).toBe("4");
  });

  it("занимает дыру, а не продолжает ряд", () => {
    // Стол №2 удалили — новый занимает освободившийся номер.
    expect(nextTableLabel(tables("1", "3", "4"))).toBe("2");
  });

  it("не зависит от порядка в массиве", () => {
    expect(nextTableLabel(tables("4", "1", "3"))).toBe("2");
  });

  it("игнорирует переименованные вручную метки", () => {
    // «VIP» и «терраса» — не числа, в расчёте не участвуют.
    expect(nextTableLabel(tables("VIP", "1", "терраса"))).toBe("2");
  });

  it("не выдаёт ноль и отрицательные", () => {
    expect(nextTableLabel(tables("0", "-3"))).toBe("1");
  });

  it("после удаления не повторяет уже занятый номер", () => {
    // Прежняя ошибка: длина массива после удаления совпадала с меткой.
    const afterRemoval = tables("1", "3");
    expect(nextTableLabel(afterRemoval)).toBe("2");
    expect(nextTableLabel([...afterRemoval, { label: "2" }])).toBe("4");
  });
});

describe("findDuplicateLabels", () => {
  it("на чистой расстановке ничего не находит", () => {
    expect(findDuplicateLabels(tables("1", "2", "3")).size).toBe(0);
  });

  it("находит повторяющуюся метку", () => {
    expect([...findDuplicateLabels(tables("1", "2", "2", "3"))]).toEqual(["2"]);
  });

  it("находит несколько сразу", () => {
    const duplicates = findDuplicateLabels(tables("1", "1", "5", "5", "7"));
    expect(duplicates.has("1")).toBe(true);
    expect(duplicates.has("5")).toBe(true);
    expect(duplicates.has("7")).toBe(false);
  });

  it("считает дублями и нечисловые метки", () => {
    // Два стола «VIP» неразличимы для официанта так же, как два «5».
    expect([...findDuplicateLabels(tables("VIP", "VIP"))]).toEqual(["VIP"]);
  });
});
