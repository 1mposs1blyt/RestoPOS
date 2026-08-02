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
  const { route } = useNavigation();
  const { terminalKind, venue } = useSession();

  // Инвариант №5: терминалы различаются набором экранов, а не сборкой.
  if (!routesFor(terminalKind, venue.serviceMode).includes(route.name)) {
    return <ScreenUnavailable />;
  }

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

function ScreenUnavailable() {
  return (
    <div className="flex h-full w-full items-center justify-center text-slate-600">
      <p className="text-sm">Этот экран недоступен на текущем терминале.</p>
    </div>
  );
}
