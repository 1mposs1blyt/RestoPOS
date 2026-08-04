import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  FeatureCode,
  Permission,
  ServiceMode,
  TerminalKind,
  UUID,
} from "@restopos/shared-types";

/**
 * Маршруты кассы.
 *
 * Полноценный роутер здесь не нужен: терминал работает в киоск-режиме,
 * URL пользователю не виден и делиться ссылкой не с кем. Зато нужен
 * типизированный переход с параметрами и стек «назад» — их и даёт этот модуль.
 */
export type Route =
  | { name: "menu" }
  | { name: "hall" }
  | { name: "order"; tableId: UUID }
  | { name: "counter" }
  | { name: "payment"; orderId: UUID }
  | { name: "cash" }
  | { name: "kitchen" }
  | { name: "stations" }
  | { name: "personal" }
  | { name: "audit" }
  | { name: "attendance" }
  | { name: "delivery" }
  | { name: "reports" }
  | { name: "stoplist" }
  | { name: "guests" }
  | { name: "documents" }
  | { name: "devices" }
  | { name: "service" };

export type RouteName = Route["name"];

interface RouteSpec {
  terminals: readonly TerminalKind[];
  /** `null` — режим обслуживания на этот экран не влияет. */
  serviceModes: readonly ServiceMode[] | null;
  permission: Permission;
  /** Модуль тарифа, без которого экрана нет. */
  feature?: FeatureCode;
  /**
   * Сопутствующий экран: доступен, но сам по себе не повод пускать сотрудника
   * на этот терминал.
   *
   * Личная страница есть у всех и везде. Без этой пометки пересечение прав
   * никогда бы не оказалось пустым, и отказ входа («повару у кассы делать
   * нечего») перестал бы срабатывать — повар попадал бы внутрь и видел один
   * экран со своей выработкой. Формально не пустой экран, фактически —
   * та же непонятная ситуация, ради которой отказ и вводился.
   */
  accessory?: true;
}

/**
 * Условия доступности каждого экрана. Их четыре, и они независимы:
 * тип терминала, режим обслуживания заведения, право сотрудника и оплаченный
 * модуль тарифа. Экран доступен, только когда выполнены все сразу.
 *
 * Держим таблицей, а не ветвлениями: набор входов уже вырос с двух до четырёх,
 * и каждый следующий `switch` по типу терминала пришлось бы переписывать целиком.
 */
const ROUTE_SPECS: Record<RouteName, RouteSpec> = {
  /*
   * Хаб доступен любому сотруднику и на любом терминале, поэтому сопутствующий:
   * сам по себе он не повод пускать за кассу — там не работают, оттуда только
   * расходятся. Стартовым экраном он при этом становится (см. `DEFAULT_ORDER`):
   * это независимые свойства.
   */
  menu: {
    terminals: ["pos", "kds", "admin"],
    serviceModes: null,
    permission: "staff.self",
    accessory: true,
  },
  hall: {
    terminals: ["pos", "admin"],
    serviceModes: ["tables"],
    permission: "order.view",
  },
  // Открывается только из зала и без стола бессмыслен — сопутствующий,
  // как и экран оплаты: в переключателе экранов ему делать нечего.
  order: {
    terminals: ["pos", "admin"],
    serviceModes: ["tables"],
    permission: "order.view",
    accessory: true,
  },
  // У прилавочного заведения схемы зала не существует: вместо `hall`/`order`
  // единственный экран расчёта. Это не «урезанная касса», а другой набор
  // экранов над тем же API (инвариант №5).
  counter: {
    terminals: ["pos", "admin"],
    serviceModes: ["counter"],
    permission: "order.view",
  },
  // Экран оплаты открывается из заказа и без него бессмыслен, поэтому
  // сопутствующий: в стартовые кандидаты он не идёт, как и `order`.
  payment: {
    terminals: ["pos", "admin"],
    serviceModes: null,
    permission: "payment.accept",
    accessory: true,
  },
  // Кассовая смена и движения по ящику. Режим обслуживания не важен: ящик
  // есть и у шаурмечной.
  cash: {
    terminals: ["pos", "admin"],
    serviceModes: null,
    permission: "cash.drawer",
  },
  kitchen: {
    terminals: ["kds", "admin"],
    serviceModes: null,
    permission: "kitchen.view",
    feature: "kds",
  },
  // Станции настраивает менеджер, и делать это он может у любого терминала —
  // в том числе стоя у кухонного монитора, где как раз и видно, что не так.
  stations: {
    terminals: ["pos", "kds", "admin"],
    serviceModes: null,
    permission: "station.manage",
  },
  // Своя страница есть у любого сотрудника и на любом терминале: повар у KDS
  // закрывает личную смену там же, где работает. Право `staff.self` есть
  // у всех ролей, кроме вендорского `support` — он не сотрудник заведения.
  personal: {
    terminals: ["pos", "kds", "admin"],
    serviceModes: null,
    permission: "staff.self",
    accessory: true,
  },
  // Разбор смены менеджер ведёт там, где стоит: у кассы или у админского
  // терминала. Сопутствующий — ради журнала за терминал не встают.
  audit: {
    terminals: ["pos", "kds", "admin"],
    serviceModes: null,
    permission: "audit.view",
    accessory: true,
  },
  // Табель ведут там, где стоит менеджер. Сопутствующий: ради него одного
  // за терминал не встают.
  attendance: {
    terminals: ["pos", "kds", "admin"],
    serviceModes: null,
    permission: "staff.attendance",
    accessory: true,
  },
  /*
   * Доставка — рабочий экран, а не сопутствующий: диспетчер за терминалом
   * весь день занят только ей. Модуль оплачивается отдельно (`delivery`),
   * и в зале её не бывает — у прилавочных заведений доставка как раз обычна.
   */
  delivery: {
    terminals: ["pos", "admin"],
    serviceModes: null,
    permission: "delivery.view",
    feature: "delivery",
  },
  // Отчёты смотрят между делом, не ради них встают за кассу — сопутствующий.
  reports: {
    terminals: ["pos", "admin"],
    serviceModes: null,
    permission: "report.view",
    accessory: true,
  },
  /*
   * Стоп-лист вносит и повар с кухонного монитора — он первым узнаёт, что
   * продукт кончился. Поэтому терминал любой, а не только касса.
   */
  stoplist: {
    terminals: ["pos", "kds", "admin"],
    serviceModes: null,
    permission: "menu.stoplist",
    accessory: true,
  },
  // Справочник постоянных гостей. К кухне отношения не имеет.
  guests: {
    terminals: ["pos", "admin"],
    serviceModes: null,
    permission: "guest.manage",
    accessory: true,
  },
  // Реестр заказов и документы смены.
  documents: {
    terminals: ["pos", "admin"],
    serviceModes: null,
    permission: "document.view",
    accessory: true,
  },
  // Настройка оборудования — часть сервисного режима, под тем же правом.
  devices: {
    terminals: ["pos", "kds", "admin"],
    serviceModes: null,
    permission: "terminal.service",
    accessory: true,
  },
  // Сервисный экран доступен на терминале любого типа: чинить приходится и KDS.
  service: {
    terminals: ["pos", "kds", "admin"],
    serviceModes: null,
    permission: "terminal.service",
  },
};

export interface AccessScope {
  kind: TerminalKind;
  serviceMode: ServiceMode;
  /** Права сотрудника. На проде приезжают с сервера вместе со входом по PIN. */
  permissions: ReadonlySet<Permission>;
  /** Оплаченные модули тарифа организации. */
  features: ReadonlySet<FeatureCode>;
}

const ALL_ROUTES = Object.keys(ROUTE_SPECS) as RouteName[];

/**
 * Какие экраны доступны. Инвариант №5: касса, KDS и админка — это разный набор
 * экранов над одним и тем же API, а не разные сборки.
 */
export function routesFor(scope: AccessScope): RouteName[] {
  return ALL_ROUTES.filter((name) => {
    const spec = ROUTE_SPECS[name];
    return (
      spec.terminals.includes(scope.kind) &&
      (spec.serviceModes === null ||
        spec.serviceModes.includes(scope.serviceMode)) &&
      scope.permissions.has(spec.permission) &&
      (spec.feature === undefined || scope.features.has(spec.feature))
    );
  });
}

/**
 * Есть ли сотруднику что делать на этом терминале.
 *
 * Отличается от «есть ли доступные экраны» ровно на сопутствующие маршруты:
 * личная страница доступна всегда, но ради неё одной пускать за терминал
 * незачем. Пустой ответ — это отказ входа (`session.tsx`), а не пустой экран.
 */
export function hasWorkOn(scope: AccessScope): boolean {
  return workRoutesFor(scope).length > 0;
}

/**
 * Доступные **рабочие** экраны — без сопутствующих.
 *
 * Отдельная функция, а не фильтр по списку имён у вызывающего: пометка
 * `accessory` живёт в `ROUTE_SPECS`, и знание о том, какие маршруты
 * сопутствующие, не должно расползаться по коду и тестам.
 */
export function workRoutesFor(scope: AccessScope): RouteName[] {
  return routesFor(scope).filter((name) => ROUTE_SPECS[name].accessory !== true);
}

/**
 * Порядок, в котором ищется стартовый экран. `order` сюда не входит:
 * он требует стол и открывается только переходом из зала.
 */
const DEFAULT_ORDER: readonly RouteName[] = [
  // Хаб первым: с него видно состояние обеих смен и расходятся все экраны.
  // Повару, которого вход не пустил бы, он не достаётся — отказ решается
  // раньше, в `hasWorkOn`.
  "menu",
  "hall",
  "counter",
  "kitchen",
  // Кассир, которому нечего делать в зале, попадает на экран кассы.
  "cash",
  // Настройка станций — последний кандидат: менеджер на KDS-терминале
  // без оплаченного модуля кухни должен куда-то попасть.
  "stations",
  "service",
];

/**
 * Первый доступный экран или `null`, если доступных нет вовсе.
 *
 * `null` — не ошибка вызывающего кода, а нормальный ответ: повар у кассы
 * и официант у кухонного монитора получают именно его. Дальше это превращается
 * в отказ входа, а не в пустой экран (см. `session.tsx`).
 */
export function defaultRouteFor(scope: AccessScope): Route | null {
  /*
   * Сопутствующие экраны не делают терминал пригодным для работы, поэтому
   * и стартовым экраном не становятся: иначе повар у кассы получал бы хаб
   * с одной плиткой «Личная страница» вместо внятного отказа входа.
   * Хаб — стартовый экран для тех, у кого работа тут есть, и только.
   */
  if (!hasWorkOn(scope)) return null;

  const available = routesFor(scope);
  const name = DEFAULT_ORDER.find((candidate) => available.includes(candidate));
  return name === undefined ? null : ({ name } as Route);
}

interface NavigationValue {
  route: Route;
  canGoBack: boolean;
  /** Переход с добавлением в стек. */
  navigate: (route: Route) => void;
  /** Возврат на предыдущий экран стека. */
  back: () => void;
  /** Сброс стека — например, при смене типа терминала или блокировке. */
  reset: (route: Route) => void;
}

const NavigationContext = createContext<NavigationValue | null>(null);

export function NavigationProvider({
  initialRoute,
  children,
}: {
  initialRoute: Route;
  children: ReactNode;
}) {
  const [stack, setStack] = useState<Route[]>([initialRoute]);

  const navigate = useCallback((route: Route) => {
    setStack((prev) => [...prev, route]);
  }, []);

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback((route: Route) => {
    setStack([route]);
  }, []);

  const value = useMemo<NavigationValue>(
    () => ({
      // Стек не бывает пустым по построению: инициализируется одним маршрутом,
      // а `back` не снимает последний.
      route: stack[stack.length - 1],
      canGoBack: stack.length > 1,
      navigate,
      back,
      reset,
    }),
    [stack, navigate, back, reset],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationValue {
  const value = useContext(NavigationContext);
  if (!value) {
    throw new Error("useNavigation вызван вне NavigationProvider");
  }
  return value;
}
