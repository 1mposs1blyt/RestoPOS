import { describe, expect, it } from "vitest";
import {
  DELIVERY_TRANSITIONS,
  canAdvance,
  type Delivery,
  type DeliveryStatus,
} from "./delivery";

const ALL: DeliveryStatus[] = [
  "unconfirmed",
  "new",
  "cooking",
  "ready",
  "on_way",
  "closed",
  "canceled",
];

function at(
  status: DeliveryStatus,
  kind: Delivery["kind"] = "delivery",
): Pick<Delivery, "kind" | "status"> {
  return { kind, status };
}

describe("цепочка состояний доставки", () => {
  it("проходит весь путь до закрытия", () => {
    expect(canAdvance(at("unconfirmed"), "new")).toBe(true);
    expect(canAdvance(at("new"), "cooking")).toBe(true);
    expect(canAdvance(at("cooking"), "ready")).toBe(true);
    expect(canAdvance(at("ready"), "on_way")).toBe(true);
    expect(canAdvance(at("on_way"), "closed")).toBe(true);
  });

  it("не перескакивает через состояния", () => {
    // Неподтверждённый заказ нельзя отдать на кухню: адрес и наличие
    // ещё не проверил человек.
    expect(canAdvance(at("unconfirmed"), "cooking")).toBe(false);
    expect(canAdvance(at("new"), "ready")).toBe(false);
    expect(canAdvance(at("cooking"), "on_way")).toBe(false);
  });

  it("не откатывается назад", () => {
    expect(canAdvance(at("ready"), "cooking")).toBe(false);
    expect(canAdvance(at("on_way"), "ready")).toBe(false);
  });

  it("отменить можно с любого рабочего состояния", () => {
    for (const status of ["unconfirmed", "new", "cooking", "ready", "on_way"] as const) {
      expect(canAdvance(at(status), "canceled")).toBe(true);
    }
  });

  it("закрытая и отменённая доставка — финал", () => {
    for (const next of ALL) {
      expect(canAdvance(at("closed"), next)).toBe(false);
      expect(canAdvance(at("canceled"), next)).toBe(false);
    }
  });

  /*
   * Самовывоз никто не везёт: курьера нет, «в пути» для него бессмыслица.
   * Без этой проверки заказ уехал бы в состояние, из которого его закрывает
   * только курьер, которого не существует.
   */
  it("самовывоз не уходит «в путь», но закрывается из «готово»", () => {
    expect(canAdvance(at("ready", "pickup"), "on_way")).toBe(false);
    expect(canAdvance(at("ready", "pickup"), "closed")).toBe(true);
  });

  it("доставка закрывается и напрямую из «готово»", () => {
    // Курьер забрал и сразу отчитался — промежуточная отметка не обязательна.
    expect(canAdvance(at("ready"), "closed")).toBe(true);
  });

  it("у каждого состояния есть запись в таблице переходов", () => {
    // Иначе `canAdvance` упадёт на неописанном состоянии, а не откажет.
    for (const status of ALL) {
      expect(DELIVERY_TRANSITIONS[status]).toBeDefined();
    }
  });
});
