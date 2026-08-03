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
  | { name: "hall" }
  | { name: "order"; tableId: UUID }
  | { name: "counter" }
  | { name: "kitchen" }
  | { name: "stations" }
  | { name: "service" };

export type RouteName = Route["name"];

interface RouteSpec {
  terminals: readonly TerminalKind[];
  /** `null` — режим обслуживания на этот экран не влияет. */
  serviceModes: readonly ServiceMode[] | null;
  permission: Permission;
  /** Модуль тарифа, без которого экрана нет. */
  feature?: FeatureCode;
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
  hall: {
    terminals: ["pos", "admin"],
    serviceModes: ["tables"],
    permission: "order.view",
  },
  order: {
    terminals: ["pos", "admin"],
    serviceModes: ["tables"],
    permission: "order.view",
  },
  // У прилавочного заведения схемы зала не существует: вместо `hall`/`order`
  // единственный экран расчёта. Это не «урезанная касса», а другой набор
  // экранов над тем же API (инвариант №5).
  counter: {
    terminals: ["pos", "admin"],
    serviceModes: ["counter"],
    permission: "order.view",
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
 * Порядок, в котором ищется стартовый экран. `order` сюда не входит:
 * он требует стол и открывается только переходом из зала.
 */
const DEFAULT_ORDER: readonly RouteName[] = [
  "hall",
  "counter",
  "kitchen",
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
