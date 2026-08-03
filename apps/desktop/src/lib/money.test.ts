import { describe, expect, it } from "vitest";
import {
  ZERO_MONEY,
  compareMoney,
  formatMoney,
  fromMinor,
  multiplyMoney,
  subtractMoney,
  sumMoney,
  toMinor,
} from "./money";

/**
 * Деньги — строки, арифметика только в копейках. Тесты закрепляют именно это:
 * любая правка, вернувшая сюда числа с плавающей точкой, обязана упасть.
 */

describe("toMinor", () => {
  it("разбирает обычную сумму", () => {
    expect(toMinor("420.00")).toBe(42000);
    expect(toMinor("0.01")).toBe(1);
    expect(toMinor("1500.99")).toBe(150099);
  });

  it("принимает сумму без дробной части", () => {
    expect(toMinor("420")).toBe(42000);
  });

  it("дополняет одну цифру после точки до копеек", () => {
    // «0.5» — это пятьдесят копеек, а не пять.
    expect(toMinor("0.5")).toBe(50);
  });

  it("отбрасывает лишние знаки, а не округляет их", () => {
    // Поведение зафиксировано намеренно: молчаливое округление входных данных
    // прячет ошибку в том, кто прислал третий знак.
    expect(toMinor("1.239")).toBe(123);
  });

  it("понимает отрицательные суммы", () => {
    expect(toMinor("-12.34")).toBe(-1234);
  });

  it("не спотыкается о пробелы по краям", () => {
    expect(toMinor(" 420.00 ")).toBe(42000);
  });
});

describe("fromMinor", () => {
  it("всегда выдаёт два знака после точки", () => {
    expect(fromMinor(42000)).toBe("420.00");
    expect(fromMinor(5)).toBe("0.05");
    expect(fromMinor(0)).toBe("0.00");
  });

  it("сохраняет знак", () => {
    expect(fromMinor(-1234)).toBe("-12.34");
    expect(fromMinor(-5)).toBe("-0.05");
  });

  it("округляет дробные копейки", () => {
    expect(fromMinor(10.4)).toBe("0.10");
    expect(fromMinor(10.6)).toBe("0.11");
  });
});

describe("обратимость", () => {
  it("сумма переживает оборот через копейки", () => {
    for (const value of ["0.00", "0.01", "99.99", "1500.00", "-42.50"]) {
      expect(fromMinor(toMinor(value))).toBe(value);
    }
  });
});

describe("арифметика", () => {
  it("умножает на количество", () => {
    expect(multiplyMoney("420.00", 3)).toBe("1260.00");
    expect(multiplyMoney("0.01", 100)).toBe("1.00");
    expect(multiplyMoney("150.00", 0)).toBe("0.00");
  });

  it("суммирует список", () => {
    expect(sumMoney(["420.00", "150.00", "0.99"])).toBe("570.99");
  });

  it("суммирует пустой список в ноль", () => {
    expect(sumMoney([])).toBe(ZERO_MONEY);
  });

  it("не накапливает ошибку на копеечных слагаемых", () => {
    // Классическая ловушка float: 0.1 + 0.2 !== 0.3.
    expect(sumMoney(["0.10", "0.20"])).toBe("0.30");
    expect(sumMoney(Array(10).fill("0.10"))).toBe("1.00");
  });

  it("вычитает, в том числе в минус", () => {
    expect(subtractMoney("1000.00", "420.50")).toBe("579.50");
    expect(subtractMoney("100.00", "150.00")).toBe("-50.00");
  });

  it("считает сдачу", () => {
    const total = "1260.00";
    const received = "1500.00";
    expect(subtractMoney(received, total)).toBe("240.00");
  });

  it("сравнивает как компаратор сортировки", () => {
    expect(compareMoney("100.00", "99.99")).toBeGreaterThan(0);
    expect(compareMoney("99.99", "100.00")).toBeLessThan(0);
    expect(compareMoney("100.00", "100.00")).toBe(0);
  });

  it("считает оплату впритык достаточной", () => {
    // Граница: получено ровно столько, сколько нужно, — сдачи нет,
    // но кнопка оплаты обязана быть доступна.
    expect(compareMoney("420.00", "420.00")).toBe(0);
    expect(subtractMoney("420.00", "420.00")).toBe(ZERO_MONEY);
  });
});

describe("formatMoney", () => {
  it("скрывает копейки, когда их нет", () => {
    expect(formatMoney("420.00")).toBe("420 ₽");
  });

  it("показывает копейки, когда они есть", () => {
    expect(formatMoney("420.50")).toContain("420,50");
  });
});
