import { describe, expect, it } from "vitest";
import {
  computeTotals,
  spreadOverItems,
  type DiscountLine,
} from "./discount";

const percent = (value: string): DiscountLine => ({
  kind: "discount",
  mode: "percent",
  value,
});
const amount = (value: string): DiscountLine => ({
  kind: "discount",
  mode: "amount",
  value,
});
const surchargePercent = (value: string): DiscountLine => ({
  kind: "surcharge",
  mode: "percent",
  value,
});

describe("итоги со скидками", () => {
  it("без строк итог равен подытогу", () => {
    expect(computeTotals("1000.00", [])).toEqual({
      subtotal: "1000.00",
      discount: "0.00",
      surcharge: "0.00",
      total: "1000.00",
    });
  });

  it("процент считается от подытога", () => {
    const totals = computeTotals("1000.00", [percent("10")]);

    expect(totals.discount).toBe("100.00");
    expect(totals.total).toBe("900.00");
  });

  it("фиксированная сумма вычитается как есть", () => {
    const totals = computeTotals("1000.00", [amount("150.00")]);

    expect(totals.discount).toBe("150.00");
    expect(totals.total).toBe("850.00");
  });

  /*
   * Каскад («10%, потом ещё 5% от остатка») давал бы разный итог в зависимости
   * от того, в каком порядке кассир нажал кнопки. Считаем обе от подытога.
   */
  it("две скидки складываются, а не каскадируются", () => {
    const totals = computeTotals("1000.00", [percent("10"), percent("5")]);

    expect(totals.discount).toBe("150.00");
    expect(totals.total).toBe("850.00");
  });

  it("порядок строк не влияет на итог", () => {
    const forward = computeTotals("1000.00", [percent("10"), amount("50.00")]);
    const backward = computeTotals("1000.00", [amount("50.00"), percent("10")]);

    expect(forward).toEqual(backward);
  });

  it("надбавка прибавляется и живёт отдельно от скидки", () => {
    const totals = computeTotals("1000.00", [
      percent("10"),
      surchargePercent("10"),
    ]);

    // В сумме ноль, но в отчёте это две разные строки, а не «ничего не было».
    expect(totals.discount).toBe("100.00");
    expect(totals.surcharge).toBe("100.00");
    expect(totals.total).toBe("1000.00");
  });

  /*
   * Итог в минусе означает, что касса должна гостю. Обрезаем скидку,
   * а не итог, — тогда в чеке видно, сколько реально применилось.
   */
  it("скидка не может превысить подытог", () => {
    const totals = computeTotals("500.00", [amount("900.00")]);

    expect(totals.discount).toBe("500.00");
    expect(totals.total).toBe("0.00");
  });

  it("скидка 100% обнуляет чек, но не уводит в минус", () => {
    const totals = computeTotals("777.77", [percent("100")]);

    expect(totals.discount).toBe("777.77");
    expect(totals.total).toBe("0.00");
  });

  it("отрицательное значение не превращает скидку в надбавку", () => {
    // Род задаёт `kind`, а не знак: иначе отчёт покажет отрицательную скидку.
    const totals = computeTotals("1000.00", [amount("-200.00")]);

    expect(totals.discount).toBe("0.00");
    expect(totals.total).toBe("1000.00");
  });

  it("процент округляется до копейки", () => {
    // 33% от 10.01 = 3.3033 → 3.30
    expect(computeTotals("10.01", [percent("33")]).discount).toBe("3.30");
  });

  it("нечисловой процент не ломает расчёт", () => {
    const totals = computeTotals("1000.00", [
      { kind: "discount", mode: "percent", value: "abc" },
    ]);

    expect(totals.discount).toBe("0.00");
    expect(totals.total).toBe("1000.00");
  });
});

describe("раскладка скидки по позициям", () => {
  const items = [
    { id: "borsch", amount: "420.00" },
    { id: "tea", amount: "80.00" },
  ];

  it("делится пропорционально доле позиции, а не поровну", () => {
    const spread = spreadOverItems("50.00", items);

    expect(spread.get("borsch")).toBe("42.00");
    expect(spread.get("tea")).toBe("8.00");
  });

  it("сумма раскладки точно равна скидке", () => {
    const three = [
      { id: "a", amount: "100.00" },
      { id: "b", amount: "100.00" },
      { id: "c", amount: "100.00" },
    ];
    const spread = spreadOverItems("10.00", three);
    const sum = [...spread.values()].reduce((acc, v) => acc + Number(v), 0);

    // Остаток уходит последней позиции: 3.33 + 3.33 + 3.34, а не потерянная копейка.
    expect(sum).toBeCloseTo(10, 2);
    expect(spread.get("c")).toBe("3.34");
  });

  it("скидка больше чека обрезается до его суммы", () => {
    const spread = spreadOverItems("10000.00", items);
    const sum = [...spread.values()].reduce((acc, v) => acc + Number(v), 0);

    expect(sum).toBeCloseTo(500, 2);
  });

  it("пустой чек не делит ничего", () => {
    expect(spreadOverItems("100.00", []).size).toBe(0);
  });

  it("чек на ноль не роняет расчёт делением на ноль", () => {
    const spread = spreadOverItems("100.00", [{ id: "a", amount: "0.00" }]);

    expect(spread.get("a")).toBe("0.00");
  });
});
