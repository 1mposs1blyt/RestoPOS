import { describe, expect, it } from "vitest";
import { splitPayment } from "./payment-split";

describe("раскладка оплаты", () => {
  it("пустой список ничего не закрывает", () => {
    const result = splitPayment("700.00", []);

    expect(result.isSettled).toBe(false);
    expect(result.due).toBe("700.00");
    expect(result.change).toBe("0.00");
  });

  it("ровная сумма закрывает чек без сдачи", () => {
    const result = splitPayment("700.00", [{ id: "a", tendered: "700.00" }]);

    expect(result.isSettled).toBe(true);
    expect(result.paid).toBe("700.00");
    expect(result.due).toBe("0.00");
    expect(result.change).toBe("0.00");
  });

  /*
   * Ради этого случая раскладка и существует: платёж — 700, а не 1000.
   * Записав 1000, мы завысили бы выручку смены на сумму всех сдач за день.
   */
  it("переплата наличными даёт сдачу, а платёж остаётся по чеку", () => {
    const result = splitPayment("700.00", [{ id: "a", tendered: "1000.00" }]);

    expect(result.paid).toBe("700.00");
    expect(result.applied.get("a")).toBe("700.00");
    expect(result.tendered).toBe("1000.00");
    expect(result.change).toBe("300.00");
    expect(result.isSettled).toBe(true);
  });

  it("недобор оставляет остаток и не закрывает чек", () => {
    const result = splitPayment("700.00", [{ id: "a", tendered: "300.00" }]);

    expect(result.isSettled).toBe(false);
    expect(result.paid).toBe("300.00");
    expect(result.due).toBe("400.00");
    expect(result.change).toBe("0.00");
  });

  it("две строки гасят долг по порядку", () => {
    const result = splitPayment("1000.00", [
      { id: "card", tendered: "300.00" },
      { id: "cash", tendered: "700.00" },
    ]);

    expect(result.applied.get("card")).toBe("300.00");
    expect(result.applied.get("cash")).toBe("700.00");
    expect(result.isSettled).toBe(true);
    expect(result.change).toBe("0.00");
  });

  it("переплата второй строкой уходит в сдачу целиком", () => {
    const result = splitPayment("1000.00", [
      { id: "card", tendered: "300.00" },
      { id: "cash", tendered: "1000.00" },
    ]);

    expect(result.applied.get("card")).toBe("300.00");
    expect(result.applied.get("cash")).toBe("700.00");
    expect(result.change).toBe("300.00");
  });

  /*
   * Строка, набранная после того, как долг уже погашен, не должна «съедать»
   * деньги: в чек она не попадёт, а её сумма обязана вернуться гостю сдачей.
   */
  it("лишняя строка сверх погашенного долга не берёт ничего", () => {
    const result = splitPayment("500.00", [
      { id: "a", tendered: "500.00" },
      { id: "b", tendered: "200.00" },
    ]);

    expect(result.applied.get("a")).toBe("500.00");
    expect(result.applied.get("b")).toBe("0.00");
    expect(result.paid).toBe("500.00");
    expect(result.change).toBe("200.00");
  });

  it("копейки не теряются при делении между строками", () => {
    const result = splitPayment("100.01", [
      { id: "a", tendered: "50.00" },
      { id: "b", tendered: "50.01" },
    ]);

    expect(result.paid).toBe("100.01");
    expect(result.due).toBe("0.00");
    expect(result.change).toBe("0.00");
  });

  it("отрицательное «внесено» не возвращает деньги в остаток", () => {
    // Набрать такое с клавиатуры нельзя, но восстановленное состояние может
    // приехать любым — раскладка не должна на этом выдавать долг больше чека.
    const result = splitPayment("500.00", [
      { id: "a", tendered: "-100.00" },
      { id: "b", tendered: "500.00" },
    ]);

    expect(result.applied.get("a")).toBe("0.00");
    expect(result.applied.get("b")).toBe("500.00");
    expect(result.isSettled).toBe(true);
  });
});
