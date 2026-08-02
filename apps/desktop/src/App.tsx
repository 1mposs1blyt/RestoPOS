import { useEffect, useMemo } from "react";
import { AccessProvider } from "./app/access";
import {
  EntitlementsProvider,
  FeatureGate,
  useEntitlements,
} from "./app/entitlements";
import {
  NavigationProvider,
  defaultRouteFor,
  routesFor,
  useNavigation,
  type AccessScope,
} from "./app/navigation";
import { SessionProvider, roleLabel, useSession } from "./app/session";
import { AppShell } from "./layout/AppShell";
import { OrdersProvider } from "./state/orders";
import { PrintingProvider } from "./state/printing";
import { StationsProvider } from "./state/stations";
import { TablesProvider } from "./state/tables";
import { BlockScreen } from "./screens/blockscreen";
import { CounterScreen } from "./screens/counterscreen";
import { KitchenScreen } from "./screens/kitchenscreen";
import { OrderScreen } from "./screens/orderscreen";
import { ServiceScreen } from "./screens/servicescreen";
import { StationsScreen } from "./screens/stationsscreen";
import { TableScheme } from "./screens/tablescheme";

/**
 * Тариф снаружи сессии, а не наоборот: он свойство организации и существует
 * независимо от того, кто сейчас за терминалом. Обратный порядок не работает —
 * вход по PIN обязан знать оплаченные модули, чтобы решить, есть ли сотруднику
 * что делать на этом терминале (пустое пересечение = отказ входа).
 */
export const App = () => (
  <EntitlementsProvider>
    <SessionProvider>
      <Terminal />
    </SessionProvider>
  </EntitlementsProvider>
);

/**
 * Корень терминала.
 *
 * Провайдеры данных живут внутри разблокированной сессии: смена терминала
 * закрывается вместе с ней, а состояние переживает блокировку в localStorage
 * (см. `lib/storage.ts`).
 */
function Terminal() {
  const { isLocked, venue, shiftId, staff, terminalKind, permissions } =
    useSession();
  const { features } = useEntitlements();

  // Ссылка на scope должна быть стабильной: она уезжает в зависимости эффекта,
  // который сбрасывает маршрут, — новый объект на каждый рендер гонял бы его
  // вхолостую по кругу.
  const scope = useMemo<AccessScope>(
    () => ({
      kind: terminalKind,
      serviceMode: venue.serviceMode,
      permissions,
      features,
    }),
    [terminalKind, venue.serviceMode, permissions, features],
  );

  if (isLocked) {
    return <BlockScreen />;
  }

  const initialRoute = defaultRouteFor(scope);

  /*
   * Экранов не осталось уже после входа: сменили тип терминала или режим
   * заведения из дев-панели, отключили модуль тарифа. Сам вход такую роль
   * на такой терминал не пустил бы, так что это состояние достижимо только
   * изменением конфигурации под ногами.
   */
  if (!initialRoute) {
    return (
      <AppShell>
        <NoRoutes />
      </AppShell>
    );
  }

  return (
    <AccessProvider>
      {/* Станции выше заказов: отправка на кухню решает по ним, куда уезжает
          позиция и надо ли считать её готовой сразу (станция без экрана). */}
      <StationsProvider>
        <TablesProvider venueId={venue.id}>
          <OrdersProvider
            venueId={venue.id}
            shiftId={shiftId}
            waiterId={staff?.id ?? null}
          >
            <PrintingProvider>
              <NavigationProvider initialRoute={initialRoute}>
                <AppShell scope={scope}>
                  <CurrentScreen scope={scope} />
                </AppShell>
              </NavigationProvider>
            </PrintingProvider>
          </OrdersProvider>
        </TablesProvider>
      </StationsProvider>
    </AccessProvider>
  );
}

function CurrentScreen({ scope }: { scope: AccessScope }) {
  const { route, reset } = useNavigation();

  // Инвариант №5: терминалы различаются набором экранов, а не сборкой.
  const isAllowed = routesFor(scope).includes(route.name);

  /*
   * Конфигурация терминала меняется под ногами: сменили тип терминала, режим
   * заведения или тариф — и текущий маршрут перестал существовать.
   *
   * Приводим стек в порядок здесь, а не в обработчиках переключения. Там
   * пришлось бы вручную сводить несколько независимых кусков состояния, и то
   * из них, что прочитано из устаревшего замыкания, снова роняло бы экран
   * в заглушку «недоступен». Здесь же все значения актуальны на момент
   * рендера, так что чинится весь класс ошибки, а не отдельный её случай.
   */
  useEffect(() => {
    if (isAllowed) return;
    const fallback = defaultRouteFor(scope);
    // `null` тут невозможен: `Terminal` в этом случае не дошёл бы до навигации.
    if (fallback) reset(fallback);
  }, [isAllowed, reset, scope]);

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

    case "stations":
      return <StationsScreen />;

    case "service":
      return <ServiceScreen />;
  }
}

/** Роли нечего делать на этом терминале после смены его конфигурации. */
function NoRoutes() {
  const { staff, lock } = useSession();

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center">
        <span className="text-4xl">🚫</span>
        <h2 className="text-lg font-bold text-slate-200">
          Нет доступных экранов
        </h2>
        <p className="text-sm text-slate-500">
          {staff ? roleLabel(staff.role) : "Этой роли"} на терминале с текущими
          настройками работать не с чем.
        </p>
        <button
          type="button"
          onClick={lock}
          className="min-h-14 w-full rounded-xl bg-slate-800 text-sm font-bold text-slate-200 transition hover:bg-slate-700 active:scale-95"
        >
          Сменить сотрудника
        </button>
      </div>
    </div>
  );
}
