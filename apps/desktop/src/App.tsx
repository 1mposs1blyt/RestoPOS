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
import { CheckoutProvider } from "./state/checkout";
import { OrdersProvider } from "./state/orders";
import { PrintingProvider } from "./state/printing";
import { DeliveryProvider } from "./state/delivery";
import { GuestsProvider } from "./state/guests";
import { ShiftsProvider } from "./state/shifts";
import { DevicesProvider } from "./state/devices";
import { StopListProvider } from "./state/stoplist";
import { StationsProvider } from "./state/stations";
import { TablesProvider } from "./state/tables";
import { BlockScreen } from "./screens/blockscreen";
import { AttendanceScreen } from "./screens/attendancescreen";
import { AuditScreen } from "./screens/auditscreen";
import { CashScreen } from "./screens/cashscreen";
import { CounterScreen } from "./screens/counterscreen";
import { DeliveryScreen } from "./screens/deliveryscreen";
import { DevicesScreen } from "./screens/devicesscreen";
import { DocumentsScreen } from "./screens/documentsscreen";
import { PaymentScreen } from "./screens/paymentscreen";
import { RefundScreen } from "./screens/refundscreen";
import { GuestsScreen } from "./screens/guestsscreen";
import { KitchenScreen } from "./screens/kitchenscreen";
import { MainMenuScreen } from "./screens/mainmenuscreen";
import { OrderScreen } from "./screens/orderscreen";
import { PersonalScreen } from "./screens/personalscreen";
import { ReportsScreen } from "./screens/reportsscreen";
import { ServiceScreen } from "./screens/servicescreen";
import { StationsScreen } from "./screens/stationsscreen";
import { StopListScreen } from "./screens/stoplistscreen";
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
  const { isLocked, venue, shiftId, terminalId, staff, terminalKind, permissions } =
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

  // `staff` в проверке не лишний: он сужает тип для провайдеров ниже, которым
  // сотрудник нужен непустым (личная смена принадлежит человеку, а не терминалу).
  if (isLocked || !staff) {
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
      {/* Оборудование выше всего: отпущенный COM-порт ФР показывает оболочка
          на каждом экране, а денежный ящик и чековый принтер нужны кассе. */}
      <DevicesProvider>
        <StationsProvider>
        {/* Смены выше заказов: заказ закрывается в кассовую смену, и её номер
            попадает в чек. Обратный порядок означал бы, что чек уже создан,
            а смены, к которой он относится, ещё нет. */}
        <ShiftsProvider
          venueId={venue.id}
          terminalId={terminalId}
          staffId={staff.id}
          tracksAttendance={permissions.has("staff.self")}
        >
          {/* Стоп-лист выше заказов: добавление позиции обязано знать,
              не кончилось ли блюдо. */}
          <StopListProvider staffId={staff.id}>
            <TablesProvider venueId={venue.id}>
              <OrdersProvider
                venueId={venue.id}
                shiftId={shiftId}
                waiterId={staff.id}
              >
                <PrintingProvider>
                  {/* Расчёт ниже заказов и оборудования: он держит порядок
                      «эквайринг → фискальный чек → заказ оплачен» и знает
                      обоих — и ККМ из оборудования, и заказ. */}
                  <CheckoutProvider>
                    {/* Доставка ниже заказов: она надстройка над ними — позиции
                        и деньги живут в заказе, здесь только адрес, курьер и срок. */}
                    <DeliveryProvider venueId={venue.id}>
                      <GuestsProvider>
                        <NavigationProvider initialRoute={initialRoute}>
                          <AppShell scope={scope}>
                            <CurrentScreen scope={scope} />
                          </AppShell>
                        </NavigationProvider>
                      </GuestsProvider>
                    </DeliveryProvider>
                  </CheckoutProvider>
                </PrintingProvider>
              </OrdersProvider>
            </TablesProvider>
          </StopListProvider>
          </ShiftsProvider>
        </StationsProvider>
      </DevicesProvider>
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
    case "menu":
      return <MainMenuScreen scope={scope} />;

    case "hall":
      return <TableScheme />;

    case "order":
      return <OrderScreen tableId={route.tableId} />;

    case "counter":
      return <CounterScreen />;

    case "payment":
      return <PaymentScreen orderId={route.orderId} />;

    case "refund":
      return <RefundScreen />;

    case "cash":
      return <CashScreen />;

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

    case "personal":
      return <PersonalScreen />;

    case "audit":
      return <AuditScreen />;

    case "reports":
      return <ReportsScreen />;

    case "stoplist":
      return <StopListScreen />;

    case "guests":
      return <GuestsScreen />;

    case "documents":
      return <DocumentsScreen />;

    case "attendance":
      return <AttendanceScreen />;

    case "delivery":
      // Гейт — апсейл, а не защита: за отказ отвечает `requireFeature('delivery')`
      // на узле (инвариант №1).
      return (
        <FeatureGate feature="delivery">
          <DeliveryScreen />
        </FeatureGate>
      );

    case "devices":
      return <DevicesScreen />;

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
