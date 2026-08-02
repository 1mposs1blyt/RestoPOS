import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ServiceMode, TerminalKind, UUID } from "@restopos/shared-types";

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
  | { name: "kitchen" };

export type RouteName = Route["name"];

/**
 * Какие экраны доступны терминалу. Инвариант №5: касса, KDS и админка —
 * это разный набор экранов над одним и тем же API, а не разные сборки.
 *
 * Набор зависит ещё и от режима заведения: у прилавочного (`counter`) схемы
 * зала не существует, поэтому вместо `hall`/`order` там единственный экран
 * расчёта. Это не «урезанная касса», а другой набор экранов над тем же API.
 */
export function routesFor(
  kind: TerminalKind,
  serviceMode: ServiceMode,
): RouteName[] {
  const posRoutes: RouteName[] =
    serviceMode === "counter" ? ["counter"] : ["hall", "order"];

  switch (kind) {
    case "pos":
      return posRoutes;
    case "kds":
      return ["kitchen"];
    case "admin":
      return [...posRoutes, "kitchen"];
  }
}

export function defaultRouteFor(
  kind: TerminalKind,
  serviceMode: ServiceMode,
): Route {
  if (kind === "kds") return { name: "kitchen" };
  return serviceMode === "counter" ? { name: "counter" } : { name: "hall" };
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
      route: stack[stack.length - 1]!,
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
