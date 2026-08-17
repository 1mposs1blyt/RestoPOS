import { describe, expect, it } from "vitest";
import {
  buildReceiptLines,
  sumReceiptLines,
  type ReceiptLineSource,
} from "./receipt-lines";

const борщ: ReceiptLineSource = {
  name: "Борщ",
  quantity: 1,
  unitPrice: "420.00",
};
const фо: ReceiptLineSource = { name: "Фо Бо", quantity: 1, unitPrice: "480.00" };
const чай: ReceiptLineSource = { name: "Чай", quantity: 2, unitPrice: "150.00" };

describe("раскладка итога по строкам чека", () => {
  it("без скидки строки равны стоимости позиций", () => {
    const lines = buildReceiptLines([борщ, фо], "900.00");

    expect(lines.map((line) => line.lineTotal)).toEqual([42000, 48000]);
    // Цена за единицу остаётся полной: её печатают в чеке.
    expect(lines[0].price).toBe(42000);
  });

  it("количество уезжает в тысячных", () => {
    const [line] = buildReceiptLines(
      [{ name: "Полборща", quantity: 0.5, unitPrice: "420.00" }],
      "210.00",
    );

    expect(line.quantityMilli).toBe(500);
  });

  /*
   * Главное свойство: чего бы ни попросили, сумма строк равна итогу ТОЧНО.
   * Копейка расхождения — это документ, отклонённый ККТ посреди расчёта гостя.
   */
  it("скидка, не делящаяся нацело, не теряет копеек", () => {
    // 7% с 1200 — это 1116, и на три строки поровну не ложится.
    const lines = buildReceiptLines([борщ, фо, чай], "1116.00");

    expect(sumReceiptLines(lines)).toBe(111600);
  });

  it("сумма сходится на любой скидке в рублях и копейках", () => {
    for (let discount = 0; discount <= 30000; discount += 137) {
      const total = ((120000 - discount) / 100).toFixed(2);
      const lines = buildReceiptLines([борщ, фо, чай], total);

      expect(sumReceiptLines(lines)).toBe(120000 - discount);
    }
  });

  it("надбавка раскладывается так же, как скидка", () => {
    const lines = buildReceiptLines([борщ, фо], "990.00");

    expect(sumReceiptLines(lines)).toBe(99000);
    // Надбавка идёт вверх пропорционально: дорогая позиция получает больше.
    expect(lines[1].lineTotal).toBeGreaterThan(lines[0].lineTotal);
  });

  it("скидка 100% обнуляет строки, а не ломает раскладку", () => {
    const lines = buildReceiptLines([борщ, фо, чай], "0.00");

    expect(lines.map((line) => line.lineTotal)).toEqual([0, 0, 0]);
    expect(sumReceiptLines(lines)).toBe(0);
  });

  it("позиции по нулевой цене не делят на ноль", () => {
    // Блюдо за счёт заведения: цена нулевая, но строка в чеке быть обязана.
    const бесплатно: ReceiptLineSource = {
      name: "Комплимент",
      quantity: 1,
      unitPrice: "0.00",
    };
    const lines = buildReceiptLines([бесплатно, бесплатно], "0.00");

    expect(sumReceiptLines(lines)).toBe(0);
  });

  it("остаток раздаётся по копейке, а не сваливается в одну строку", () => {
    // Две одинаковые позиции и нечётный итог: разница между строками
    // не должна превышать копейку.
    const lines = buildReceiptLines([борщ, борщ], "839.99");
    const [first, second] = lines.map((line) => line.lineTotal);

    expect(first + second).toBe(83999);
    expect(Math.abs(first - second)).toBeLessThanOrEqual(1);
  });

  it("пустой заказ даёт пустой чек", () => {
    expect(buildReceiptLines([], "0.00")).toEqual([]);
  });
});
