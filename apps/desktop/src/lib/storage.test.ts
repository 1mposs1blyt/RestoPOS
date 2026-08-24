import { beforeEach, describe, expect, it } from "vitest";
import { loadState, saveState } from "./storage";

/**
 * Состояние терминала переживает обновления кассы, а формат его растёт.
 * Поэтому проверяется не запись с чтением, а именно **устойчивость к старому
 * снимку**: заказы, сохранённые до появления скидок, приезжают без поля
 * `discounts`, и первый же `Object.values(state.discounts)` роняет приложение
 * в белый экран. Так и случилось на прилавке.
 */
/**
 * Хранилище в памяти вместо браузерного.
 *
 * Заглушка, а не jsdom: проверяется чтение и слияние, а не браузер, и тащить
 * ради этого целую реализацию DOM в тесты чистых функций незачем.
 */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

describe("чтение состояния терминала", () => {
  beforeEach(() => {
    globalThis.localStorage = memoryStorage();
  });

  interface OrdersLike {
    orders: Record<string, unknown>;
    items: Record<string, unknown>;
    discounts: Record<string, unknown>;
  }

  const EMPTY: OrdersLike = { orders: {}, items: {}, discounts: {} };

  it("возвращает значение по умолчанию, когда ключа нет", () => {
    expect(loadState("orders", EMPTY)).toEqual(EMPTY);
  });

  it("дополняет старый снимок полями, которых в нём не было", () => {
    // Снимок из версии, где скидок ещё не существовало.
    localStorage.setItem(
      "restopos.orders",
      JSON.stringify({ orders: { "o-1": {} }, items: {} }),
    );

    const state = loadState<OrdersLike>("orders", EMPTY);

    expect(state.orders).toEqual({ "o-1": {} });
    // Главное: не `undefined`, иначе `Object.values` бросает.
    expect(state.discounts).toEqual({});
    expect(() => Object.values(state.discounts)).not.toThrow();
  });

  it("не затирает сохранённые значения значениями по умолчанию", () => {
    saveState("orders", { orders: { "o-1": 1 }, items: {}, discounts: { d: 2 } });

    const state = loadState<OrdersLike>("orders", EMPTY);

    expect(state.orders).toEqual({ "o-1": 1 });
    expect(state.discounts).toEqual({ d: 2 });
  });

  it("не трогает состояние, которое объектом не является", () => {
    // Тип терминала и режим заведения лежат строками, а не словарями.
    saveState("terminal.kind", "kds");
    expect(loadState<string>("terminal.kind", "pos")).toBe("kds");

    saveState("session.venueId", null);
    expect(loadState<string | null>("session.venueId", null)).toBeNull();
  });

  it("на битом JSON отдаёт значение по умолчанию, а не падает", () => {
    localStorage.setItem("restopos.orders", "{не json");
    expect(loadState("orders", EMPTY)).toEqual(EMPTY);
  });
});
