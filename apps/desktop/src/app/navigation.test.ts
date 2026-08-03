import type { FeatureCode, Permission } from "@restopos/shared-types";
import { permissionsOf } from "@restopos/shared-types";
import { describe, expect, it } from "vitest";
import { defaultRouteFor, routesFor, type AccessScope } from "./navigation";

/**
 * Выдача экранов — пересечение четырёх независимых условий: тип терминала,
 * режим обслуживания, право сотрудника и оплаченный модуль. Тесты закрепляют
 * именно независимость: каждое условие обязано отсекать само по себе.
 */

const ALL_FEATURES: FeatureCode[] = [
  "kds",
  "warehouse",
  "delivery",
  "reports",
  "egais",
  "loyalty",
  "analytics",
  "suppliers",
  "multi_venue",
];

function scope(patch: Partial<AccessScope> = {}): AccessScope {
  return {
    kind: "pos",
    serviceMode: "tables",
    permissions: permissionsOf("waiter"),
    features: new Set<FeatureCode>(ALL_FEATURES),
    ...patch,
  };
}

describe("режим обслуживания", () => {
  it("в зале даёт схему и экран заказа", () => {
    expect(routesFor(scope())).toEqual(["hall", "order"]);
  });

  it("на прилавке заменяет их одним экраном расчёта", () => {
    // Это не «урезанная касса», а другой набор экранов над тем же API.
    expect(routesFor(scope({ serviceMode: "counter" }))).toEqual(["counter"]);
  });
});

describe("тип терминала", () => {
  it("кухонный монитор не показывает зал", () => {
    const routes = routesFor(
      scope({ kind: "kds", permissions: permissionsOf("cook") }),
    );
    expect(routes).toEqual(["kitchen"]);
  });

  it("админский терминал совмещает зал и кухню", () => {
    const routes = routesFor(
      scope({ kind: "admin", permissions: permissionsOf("manager") }),
    );
    expect(routes).toContain("hall");
    expect(routes).toContain("kitchen");
    expect(routes).toContain("stations");
  });
});

describe("право сотрудника", () => {
  it("повару на кассе не остаётся ни одного экрана", () => {
    // Пустое пересечение — это отказ входа, а не пустой экран.
    expect(routesFor(scope({ permissions: permissionsOf("cook") }))).toEqual([]);
  });

  it("официанту на кухонном мониторе тоже", () => {
    expect(routesFor(scope({ kind: "kds" }))).toEqual([]);
  });

  it("тех. поддержке доступен только сервисный экран", () => {
    expect(routesFor(scope({ permissions: permissionsOf("support") }))).toEqual([
      "service",
    ]);
  });

  it("сервисный экран доступен на терминале любого типа", () => {
    // Чинить приходится и кухню.
    for (const kind of ["pos", "kds", "admin"] as const) {
      expect(
        routesFor(scope({ kind, permissions: permissionsOf("support") })),
      ).toContain("service");
    }
  });

  it("настройку станций видит только тот, у кого есть право", () => {
    expect(routesFor(scope({ permissions: permissionsOf("manager") }))).toContain(
      "stations",
    );
    expect(routesFor(scope())).not.toContain("stations");
  });
});

describe("тариф", () => {
  it("без оплаченного модуля кухни экрана нет даже у повара", () => {
    const routes = routesFor(
      scope({
        kind: "kds",
        permissions: permissionsOf("cook"),
        features: new Set<FeatureCode>(),
      }),
    );
    expect(routes).toEqual([]);
  });

  it("тариф не отменяет остальных условий", () => {
    // Все модули оплачены, но официант на кухонном мониторе всё равно никто.
    expect(routesFor(scope({ kind: "kds" }))).toEqual([]);
  });
});

describe("стартовый экран", () => {
  it("в зале — схема зала", () => {
    expect(defaultRouteFor(scope())).toEqual({ name: "hall" });
  });

  it("на прилавке — экран расчёта", () => {
    expect(defaultRouteFor(scope({ serviceMode: "counter" }))).toEqual({
      name: "counter",
    });
  });

  it("на кухне — кухонный экран", () => {
    expect(
      defaultRouteFor(scope({ kind: "kds", permissions: permissionsOf("cook") })),
    ).toEqual({ name: "kitchen" });
  });

  it("никогда не открывает экран заказа: ему нужен стол", () => {
    const routes = routesFor(scope());
    expect(routes).toContain("order");
    expect(defaultRouteFor(scope())).not.toEqual({ name: "order" });
  });

  it("возвращает null, когда экранов нет вовсе", () => {
    // Не ошибка вызывающего, а нормальный ответ: дальше это превращается
    // в отказ входа.
    expect(defaultRouteFor(scope({ permissions: permissionsOf("cook") }))).toBeNull();
  });
});

describe("маршруты не зависят от порядка прав", () => {
  it("набор прав — множество, а не список", () => {
    const forward = new Set<Permission>(["order.view", "station.manage"]);
    const backward = new Set<Permission>(["station.manage", "order.view"]);
    expect(routesFor(scope({ permissions: forward }))).toEqual(
      routesFor(scope({ permissions: backward })),
    );
  });
});
