import { useMemo } from "react";
import type { Order, OrderItem, UUID } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { useSession } from "../app/session";
import { FunctionBar, FunctionKey } from "../components/functionbar";
import { useOrders } from "../state/orders";
import { useStations } from "../state/stations";
import { useTables } from "../state/tables";
import { useMenu } from "../state/menu";
import { formatElapsed, minutesSince, useNow } from "../lib/useNow";

/** Через сколько минут тикет считается просроченным. */
const LATE_AFTER_MINUTES = 15;

/**
 * Монитор кухни (KDS).
 *
 * Читает те же заказы, что и касса: отдельного «кухонного» состояния нет.
 * На экран попадают только позиции, реально отправленные на кухню
 * (`cooking` / `ready`), — то, что официант ещё набирает в чеке,
 * повар видеть не должен.
 *
 * Раскладка — как на заказе, прилавке, оплате и кассе: плоские панели,
 * разделённые границей в пиксель, без внешних отступов и скруглений,
 * функции полосой внизу. Станции — колонкой справа, как категории меню
 * на экране заказа.
 *
 * **Кегль здесь крупнее, чем на кассовых экранах, и это не украшение.**
 * В кассу смотрят с полуметра, в кухонный монитор — с двух метров, от плиты,
 * не отрываясь от сковороды. На мониторе 1366x768 пиксель — это около
 * 0.35 мм, а по правилу «высота прописной ≥ расстояние/200» с двух метров
 * нужно порядка 10 мм, то есть кегль под 40 пикселей. Столько на тикет
 * не помещается, поэтому взят достижимый предел: **ничего мельче 24 пикселей
 * внутри тикета**, а главное — стол, количество и название блюда — 30.
 * Прописная в 30 пикселях это ≈ 7.5 мм: уверенно читается с полутора метров,
 * а с двух добирается тем, что названия блюд повар знает наизусть
 * и опознаёт по силуэту слова. Проверяется замером, а не на глаз:
 * `node tools/measure-screen.mjs kitchen`.
 *
 * Тикеты выкладываются сеткой с переносом, а не строкой с горизонтальной
 * прокруткой: пролистывать вбок, стоя у плиты, некому — тикет, уехавший
 * за край, для кухни просто не существует.
 */
export function KitchenScreen() {
  const { kitchenTickets, setItemStatus } = useOrders();
  const { findTable } = useTables();
  const { stations, findStation } = useStations();
  const { stationId, setStationId } = useSession();
  const { can } = useAccess();
  const { back, canGoBack } = useNavigation();
  const now = useNow(15_000);
  // Экран доступен по `kitchen.view`, отметки — по `kitchen.item.status`:
  // просмотр и изменение разведены, чтобы монитор можно было повесить в зал.
  const canChange = can("kitchen.item.status");

  /*
   * Монитор показывает только свою станцию. Без этого бар видит стейки,
   * а горячий цех — эспрессо, и оба привыкают проматывать чужое —
   * ровно до того дня, когда промотают своё.
   *
   * `null` — станция не выбрана: показываем всё, но говорим об этом.
   */
  const tickets =
    stationId === null
      ? kitchenTickets
      : kitchenTickets.filter((ticket) => ticket.stationId === stationId);

  /**
   * Сколько тикетов ждёт на каждой станции. Считается по всем тикетам,
   * а не по показанным: смысл счётчика в том, чтобы у чужой станции было
   * видно, сколько там копится, не переключаясь на неё.
   */
  const countByStation = useMemo(() => {
    const counts = new Map<UUID | null, number>();
    for (const ticket of kitchenTickets)
      counts.set(ticket.stationId, (counts.get(ticket.stationId) ?? 0) + 1);
    return counts;
  }, [kitchenTickets]);

  const lateCount = tickets.filter(
    (ticket) => minutesSince(ticket.order.createdAt, now) >= LATE_AFTER_MINUTES,
  ).length;

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden bg-slate-950">
      {/* Шапка: чья это станция и сколько на ней висит. Просрочку выносим
          отдельным числом — по нему повар понимает, что горит, не пересчитывая
          красные тикеты глазами. */}
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4">
        <h1 className="truncate text-2xl font-black tracking-wide text-emerald-400">
          {stationId === null
            ? "Все станции"
            : (findStation(stationId)?.name ?? "Монитор кухни")}
        </h1>
        <div className="flex shrink-0 items-baseline gap-4">
          {lateCount > 0 && (
            <span className="text-xl font-black tabular-nums text-rose-400">
              просрочено {lateCount}
            </span>
          )}
          <span className="text-2xl font-black tabular-nums text-slate-400">
            {tickets.length}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {tickets.length === 0 ? (
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 text-slate-600">
            <span className="text-5xl">🍳</span>
            <p className="text-2xl font-bold">Новых заказов нет</p>
          </div>
        ) : (
          /* Пиксельный зазор на тёмной подложке вместо воздуха между
             карточками: тикеты читаются полосами таблицы, а не россыпью
             плиток, и место достаётся содержимому. */
          <div className="grid min-w-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(300px,1fr))] content-start gap-px overflow-y-auto bg-slate-800">
            {tickets.map(({ order, stationId: ticketStation, items }) => (
              <Ticket
                key={`${order.id}:${ticketStation ?? "-"}`}
                stationName={
                  stationId === null
                    ? (findStation(ticketStation)?.name ?? null)
                    : null
                }
                order={order}
                items={items}
                tableLabel={
                  order.tableId
                    ? (findTable(order.tableId)?.label ?? null)
                    : undefined
                }
                now={now}
                canChange={canChange}
                onItemStatus={setItemStatus}
              />
            ))}
          </div>
        )}

        {/* Станции колонкой справа — как категории меню на экране заказа.
            Строкой сверху они переносились бы на вторую строку, а на кухне
            каждая точка высоты уходит тикетам. */}
        <aside className="flex w-52 shrink-0 flex-col border-l border-slate-800">
          <div className="flex min-h-12 shrink-0 items-center border-b border-slate-800 bg-slate-900 px-4">
            <span className="truncate text-sm font-bold uppercase tracking-wider text-slate-400">
              Станция
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto bg-slate-800">
            <StationKey
              active={stationId === null}
              count={kitchenTickets.length}
              onClick={() => setStationId(null)}
            >
              Все станции
            </StationKey>
            {stations.map((station) => (
              <StationKey
                key={station.id}
                active={stationId === station.id}
                count={countByStation.get(station.id) ?? 0}
                onClick={() => setStationId(station.id)}
              >
                {station.name}
              </StationKey>
            ))}
          </div>
        </aside>
      </div>

      {/* Полоса функций внизу — та же, что на остальных экранах, но здесь
          она бывает и лишней: у кухонного монитора это домашний экран, стек
          пуст, и уходить с него некуда. Появляется, только когда на кухню
          зашли из хаба — менеджер с кассы или админского терминала.
          Настройке станций места в ней нет: право `station.manage` есть
          только у техподдержки, а `kitchen.view` у неё нет — клавиша
          не досталась бы никому. */}
      {canGoBack && (
        <FunctionBar>
          <FunctionKey label="← Назад" onClick={back} />
        </FunctionBar>
      )}
    </div>
  );
}

/**
 * Клавиша выбора станции.
 *
 * Со счётчиком: у чужой станции важно не название, а то, сколько на ней
 * копится. Плоская и без скруглений — колонку разделяет пиксельный зазор,
 * а не воздух вокруг каждой клавиши.
 */
function StationKey({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-16 shrink-0 items-center justify-between gap-2 px-4 text-left text-lg font-bold transition",
        active
          ? "bg-emerald-600 text-slate-950"
          : "bg-slate-900 text-slate-300 hover:bg-slate-800 active:bg-slate-700",
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
      <span
        className={cn(
          "shrink-0 tabular-nums",
          active ? "text-slate-900" : "text-slate-500",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function Ticket({
  order,
  items,
  tableLabel,
  stationName,
  now,
  canChange,
  onItemStatus,
}: {
  order: Order;
  items: OrderItem[];
  /** Подпись станции. `null` — монитор и так показывает одну станцию. */
  stationName: string | null;
  /**
   * Подпись стола. `undefined` — заказ на вынос, `null` — стол у заказа указан,
   * но не найден в схеме. Разные вещи: во втором случае повару нельзя
   * показывать «На вынос», иначе блюдо унесут не туда.
   */
  tableLabel: string | undefined | null;
  now: number;
  canChange: boolean;
  onItemStatus: (itemId: UUID, status: OrderItem["status"]) => void;
}) {
  const { findMenuItem } = useMenu();
  const isLate = minutesSince(order.createdAt, now) >= LATE_AFTER_MINUTES;
  const allReady = items.every((item) => item.status === "ready");

  return (
    <article className="flex flex-col bg-slate-950">
      {/* Полоса заголовка сплошным цветом: с двух метров тикет опознают
          по ней, а не по тексту. Красная — просрочен. */}
      <div
        className={cn(
          "flex min-h-14 items-center justify-between gap-2 px-3 font-black",
          isLate ? "bg-rose-600 text-white" : "bg-slate-700 text-white",
        )}
      >
        <span className="min-w-0 truncate text-3xl">
          {tableLabel === undefined
            ? `№ ${order.number}`
            : tableLabel === null
              ? "⚠ Стол не найден"
              : `Стол ${tableLabel}`}
        </span>
        <span className="shrink-0 text-2xl tabular-nums">
          {formatElapsed(order.createdAt, now)}
        </span>
      </div>

      {stationName && (
        <div className="bg-slate-900 px-3 py-1 text-2xl font-bold uppercase tracking-wide text-slate-400">
          {stationName}
        </div>
      )}

      <ul className="flex-1 divide-y divide-slate-900">
        {items.map((item) => {
          const menuItem = findMenuItem(item.menuItemId);
          const isReady = item.status === "ready";

          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={!canChange}
                onClick={() =>
                  onItemStatus(item.id, isReady ? "cooking" : "ready")
                }
                className={cn(
                  // На кухне жмут в перчатках и не глядя — цель заметно
                  // крупнее минимальных 44 пикселей.
                  "flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left transition",
                  isReady ? "opacity-40" : "hover:bg-slate-900",
                )}
              >
                {/* Количество отдельной колонкой и цветом: «2» в начале строки
                    повар видит раньше, чем прочтёт название, а спутанное
                    количество — это недоготовленная порция. */}
                <span className="w-10 shrink-0 text-3xl font-black tabular-nums text-amber-400">
                  {item.quantity}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-3xl font-bold leading-tight text-slate-100",
                    isReady && "line-through",
                  )}
                >
                  {menuItem?.name ?? "—"}
                </span>
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center border-2 text-2xl font-black",
                    isReady
                      ? "border-emerald-500 bg-emerald-500 text-slate-950"
                      : "border-slate-600",
                  )}
                  aria-hidden
                >
                  {isReady ? "✓" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        disabled={!allReady || !canChange}
        onClick={() => {
          for (const item of items) onItemStatus(item.id, "served");
        }}
        className="min-h-16 w-full bg-emerald-600 px-3 text-2xl font-black uppercase tracking-wide text-white transition hover:bg-emerald-500 active:bg-emerald-700 disabled:pointer-events-none disabled:bg-slate-900 disabled:text-slate-600"
      >
        {allReady ? "Отдано" : "Готовится"}
      </button>
    </article>
  );
}
