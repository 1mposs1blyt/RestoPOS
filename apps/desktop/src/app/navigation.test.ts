import type { FeatureCode, Permission } from "@restopos/shared-types";
import { permissionsOf } from "@restopos/shared-types";
import { describe, expect, it } from "vitest";
import {
  defaultRouteFor,
  hasWorkOn,
  routesFor,
  workRoutesFor as workRoutes,
  type AccessScope,
} from "./navigation";

/**
 * Выдача экранов — пересечение четырёх независимых условий: тип терминала,
 * режим обслуживания, право сотрудника и оплаченный модуль. Тесты закрепляют
 * именно независимость: каждое условие обязано отсекать само по себе.
 */

/*
 * `workRoutes` — рабочие экраны, без сопутствующих. Личная страница и экран
 * оплаты доступны почти всегда и в проверках «что именно доступно» только
 * шумят; отдельно их закрепляет блок «сопутствующие экраны» ниже.
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
  /*
   * Проверяем именно противопоставление «зал против прилавка», а не полный
   * список: экранов, не зависящих от режима (доставка, касса), со временем
   * становится больше, и сравнение списка целиком ломалось бы на каждом новом.
   */
  it("в зале даёт схему зала, а экран заказа — только как сопутствующий", () => {
    expect(workRoutes(scope())).toContain("hall");
    expect(workRoutes(scope())).not.toContain("counter");
    expect(routesFor(scope())).toContain("order");
  });

  it("на прилавке заменяет их одним экраном расчёта", () => {
    // Это не «урезанная касса», а другой набор экранов над тем же API.
    const counter = scope({ serviceMode: "counter" });
    expect(workRoutes(counter)).toContain("counter");
    expect(routesFor(counter)).not.toContain("hall");
    expect(routesFor(counter)).not.toContain("order");
  });

  it("доставка от режима обслуживания не зависит", () => {
    // Совпадение «прилавок = доставка» соблазнительно, но ложно: доставка
    // бывает и у ресторана с залом, а у шаурмечной её может не быть вовсе.
    expect(workRoutes(scope())).toContain("delivery");
    expect(workRoutes(scope({ serviceMode: "counter" }))).toContain("delivery");
  });
});

describe("тип терминала", () => {
  it("кухонный монитор не показывает зал", () => {
    expect(workRoutes(scope({ kind: "kds", permissions: permissionsOf("cook") }))).toEqual(
      ["kitchen"],
    );
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
  it("повару на кассе не остаётся ни одного рабочего экрана", () => {
    // Пустое пересечение — это отказ входа, а не пустой экран.
    expect(workRoutes(scope({ permissions: permissionsOf("cook") }))).toEqual([]);
  });

  it("официанту на кухонном мониторе тоже", () => {
    expect(workRoutes(scope({ kind: "kds" }))).toEqual([]);
  });

  /*
   * У вендорского инженера ровно одно право `terminal.service`, и проверять
   * надо не длину списка, а суть: ни заказов, ни денег он не видит. Инженер
   * с правом сторно в чужой кассе — это дыра, а не удобство.
   */
  it("тех. поддержке доступен только сервисный режим", () => {
    const support = routesFor(scope({ permissions: permissionsOf("support") }));

    expect(support).toContain("service");
    expect(support).toContain("devices");
    for (const forbidden of [
      "hall",
      "order",
      "counter",
      "payment",
      "refund",
      "cash",
      "reports",
      "documents",
      "audit",
      "personal",
    ]) {
      expect(support).not.toContain(forbidden);
    }
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
    expect(
      workRoutes(
        scope({
          kind: "kds",
          permissions: permissionsOf("cook"),
          features: new Set<FeatureCode>(),
        }),
      ),
    ).toEqual([]);
  });

  it("тариф не отменяет остальных условий", () => {
    // Все модули оплачены, но официант на кухонном мониторе всё равно никто.
    expect(workRoutes(scope({ kind: "kds" }))).toEqual([]);
  });
});

describe("стартовый экран", () => {
  /*
   * Стартовый экран — хаб: с него видно состояние обеих смен и расходятся
   * все остальные экраны. Но достаётся он только тому, у кого на терминале
   * есть работа, — иначе он подменял бы собой отказ входа.
   */
  it("в зале — главное меню", () => {
    expect(defaultRouteFor(scope())).toEqual({ name: "menu" });
  });

  it("на прилавке — тоже главное меню", () => {
    expect(defaultRouteFor(scope({ serviceMode: "counter" }))).toEqual({
      name: "menu",
    });
  });

  it("на кухне — тоже: повар попадает в хаб со своей плиткой кухни", () => {
    expect(
      defaultRouteFor(scope({ kind: "kds", permissions: permissionsOf("cook") })),
    ).toEqual({ name: "menu" });
  });

  it("никогда не открывает экран заказа: ему нужен стол", () => {
    const routes = routesFor(scope());
    expect(routes).toContain("order");
    expect(defaultRouteFor(scope())).not.toEqual({ name: "order" });
  });

  it("возвращает null, когда рабочих экранов нет вовсе", () => {
    // Не ошибка вызывающего, а нормальный ответ: дальше это превращается
    // в отказ входа. Доступные сопутствующие экраны (хаб, личная страница)
    // этого не отменяют — ради них за терминал не встают.
    const cookAtTill = scope({ permissions: permissionsOf("cook") });
    expect(routesFor(cookAtTill).length).toBeGreaterThan(0);
    expect(defaultRouteFor(cookAtTill)).toBeNull();
  });
});

/*
 * Личная страница доступна всем и везде. Если считать её наравне с рабочими
 * экранами, пересечение никогда не окажется пустым — и повар у кассы попадёт
 * внутрь, увидев один экран со своей выработкой. Формально не пустой экран,
 * фактически та же непонятная ситуация, ради которой отказ входа и вводился.
 */
describe("сопутствующие экраны", () => {
  it("личная страница есть у любой роли сотрудника", () => {
    for (const role of ["waiter", "cashier", "manager", "cook"] as const) {
      expect(routesFor(scope({ permissions: permissionsOf(role) }))).toContain(
        "personal",
      );
    }
  });

  it("у вендорской поддержки её нет: она не сотрудник заведения", () => {
    expect(
      routesFor(scope({ permissions: permissionsOf("support") })),
    ).not.toContain("personal");
  });

  it("сама по себе не даёт повода пускать за терминал", () => {
    const cookAtTill = scope({ permissions: permissionsOf("cook") });
    expect(routesFor(cookAtTill)).toContain("personal");
    expect(hasWorkOn(cookAtTill)).toBe(false);
  });

  it("возврат по чеку есть у кассира, но работой терминала не считается", () => {
    // Возвраты случаются несколько раз в день: экран нужен, но ради него
    // одного за кассу не встают — иначе он подменял бы собой отказ входа.
    const cashier = scope({ permissions: permissionsOf("cashier") });
    expect(routesFor(cashier)).toContain("refund");
    expect(workRoutes(cashier)).not.toContain("refund");
    expect(defaultRouteFor(cashier)).not.toEqual({ name: "refund" });
  });

  it("официанту экран возврата не выдаётся: права у него нет", () => {
    // Право побиваемое, но подтверждают само действие, а не вход на экран.
    expect(routesFor(scope())).not.toContain("refund");
  });

  it("экран оплаты тоже сопутствующий: без заказа он бессмыслен", () => {
    expect(routesFor(scope())).toContain("payment");
    expect(workRoutes(scope())).not.toContain("payment");
    expect(defaultRouteFor(scope())).not.toEqual({ name: "payment" });
  });

  it("личная страница не становится стартовым экраном", () => {
    expect(defaultRouteFor(scope())).not.toEqual({ name: "personal" });
  });

  it("не мешает работе там, где она есть", () => {
    expect(hasWorkOn(scope())).toBe(true);
    expect(hasWorkOn(scope({ kind: "kds", permissions: permissionsOf("cook") }))).toBe(
      true,
    );
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
