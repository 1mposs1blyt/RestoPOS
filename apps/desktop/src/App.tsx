import { useEffect } from "react";
import { EntitlementsProvider, FeatureGate } from "./app/entitlements";
import {
  NavigationProvider,
  defaultRouteFor,
  routesFor,
  useNavigation,
} from "./app/navigation";
import { SessionProvider, useSession } from "./app/session";
import { AppShell } from "./layout/AppShell";
import { OrdersProvider } from "./state/orders";
import { TablesProvider } from "./state/tables";
import { BlockScreen } from "./screens/blockscreen";
import { CounterScreen } from "./screens/counterscreen";
import { KitchenScreen } from "./screens/kitchenscreen";
import { OrderScreen } from "./screens/orderscreen";
import { TableScheme } from "./screens/tablescheme";

export const App = () => (
  <SessionProvider>
    <EntitlementsProvider>
      <Terminal />
    </EntitlementsProvider>
  </SessionProvider>
);

/**
 * Корень терминала.
 *
 * Провайдеры данных живут внутри разблокированной сессии: смена терминала
 * закрывается вместе с ней, а состояние переживает блокировку в localStorage
 * (см. `lib/storage.ts`).
 */
function Terminal() {
  const { isLocked, venue, shiftId, staff, terminalKind } = useSession();

  if (isLocked) {
    return <BlockScreen />;
  }

  return (
    <TablesProvider venueId={venue.id}>
      <OrdersProvider
        venueId={venue.id}
        shiftId={shiftId}
        waiterId={staff?.id ?? null}
      >
        <NavigationProvider
          initialRoute={defaultRouteFor(terminalKind, venue.serviceMode)}
        >
          <AppShell>
            <CurrentScreen />
          </AppShell>
        </NavigationProvider>
      </OrdersProvider>
    </TablesProvider>
  );
}

function CurrentScreen() {
  const { route, reset } = useNavigation();
  const { terminalKind, venue } = useSession();

  // Инвариант №5: терминалы различаются набором экранов, а не сборкой.
  const isAllowed = routesFor(terminalKind, venue.serviceMode).includes(
    route.name,
  );

  /*
   * Конфигурация терминала меняется под ногами: сменили тип терминала или
   * режим заведения — и текущий маршрут перестал существовать.
   *
   * Приводим стек в порядок здесь, а не в обработчиках переключения. Там
   * пришлось бы вручную сводить два независимых куска состояния, и то из них,
   * что прочитано из устаревшего замыкания, снова роняло бы экран в заглушку
   * «недоступен». Здесь же оба значения всегда актуальны на момент рендера,
   * так что чинится весь класс ошибки, а не отдельный её случай.
   */
  useEffect(() => {
    if (!isAllowed) reset(defaultRouteFor(terminalKind, venue.serviceMode));
  }, [isAllowed, reset, terminalKind, venue.serviceMode]);

  // Один кадр между сменой конфигурации и сбросом стека в эффекте.
  if (!isAllowed) return null;

  switch (route.name) {
    case "hall":
      return <TableScheme />;

    case "order":
      return <OrderScreen tableId={route.tableId} />;

    case "counter":
      return <CounterScreen />;

    case "kitchen":
      // Гейт — это UX-апсейл, а не защита: за реальный отказ отвечает
      // `requireFeature('kds')` на бэкенде (инвариант №1).
      return (
        <FeatureGate feature="kds">
          <KitchenScreen />
        </FeatureGate>
      );
  }
}
