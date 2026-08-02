import type { Order, OrderItem, UUID } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useSession } from "../app/session";
import { useOrders } from "../state/orders";
import { useStations } from "../state/stations";
import { useTables } from "../state/tables";
import { findMenuItem } from "../state/menu";
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
 */
export function KitchenScreen() {
  const { kitchenTickets, setItemStatus } = useOrders();
  const { findTable } = useTables();
  const { stations, findStation } = useStations();
  const { stationId, setStationId } = useSession();
  const { can } = useAccess();
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

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden p-4">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h1 className="text-2xl font-black tracking-wide text-emerald-400">
          {findStation(stationId)?.name ?? "Монитор кухни"}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <StationTab
            active={stationId === null}
            onClick={() => setStationId(null)}
          >
            Все станции
          </StationTab>
          {stations.map((station) => (
            <StationTab
              key={station.id}
              active={stationId === station.id}
              onClick={() => setStationId(station.id)}
            >
              {station.name}
            </StationTab>
          ))}
          <span className="ml-2 font-mono text-xl tabular-nums">
            {tickets.length}
          </span>
        </div>
      </header>

      {tickets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-slate-600">
          <span className="mb-2 text-4xl">🍳</span>
          <p className="text-sm">Новых заказов нет.</p>
        </div>
      ) : (
        <div className="flex flex-1 items-start gap-4 overflow-x-auto pb-4">
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
    </div>
  );
}

function StationTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-lg px-4 text-sm font-bold transition active:scale-95",
        active
          ? "bg-emerald-600 text-slate-950"
          : "border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700",
      )}
    >
      {children}
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
  const isLate = minutesSince(order.createdAt, now) >= LATE_AFTER_MINUTES;
  const allReady = items.every((item) => item.status === "ready");

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border bg-slate-900 shadow-xl",
        isLate ? "border-rose-600" : "border-slate-700",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between p-3 font-black text-slate-950",
          isLate ? "bg-rose-500" : "bg-slate-400",
        )}
      >
        <span className="text-lg">
          {tableLabel === undefined
            ? `Навынос № ${order.number}`
            : tableLabel === null
              ? "⚠ Стол не найден"
              : `Стол ${tableLabel}`}
        </span>
        <span className="rounded bg-black/20 px-2 py-0.5 font-mono text-sm tabular-nums">
          {formatElapsed(order.createdAt, now)}
        </span>
      </div>

      {stationName && (
        <div className="bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
          {stationName}
        </div>
      )}

      <div className="min-h-60 flex-1 space-y-1 p-3">
        {items.map((item) => {
          const menuItem = findMenuItem(item.menuItemId);
          const isReady = item.status === "ready";

          return (
            <button
              key={item.id}
              type="button"
              disabled={!canChange}
              onClick={() =>
                onItemStatus(item.id, isReady ? "cooking" : "ready")
              }
              className={cn(
                // На кухне жмут в перчатках и не глядя — цель крупнее обычной.
                "flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border-b border-slate-800 px-3 py-2 text-left transition",
                isReady ? "opacity-50" : "hover:bg-slate-800/60",
              )}
            >
              <span
                className={cn(
                  "text-lg font-bold text-slate-100",
                  isReady && "line-through",
                )}
              >
                {item.quantity} × {menuItem?.name ?? "—"}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 text-xs font-black",
                  isReady
                    ? "border-emerald-500 bg-emerald-500 text-slate-950"
                    : "border-slate-600",
                )}
                aria-hidden
              >
                {isReady ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!allReady || !canChange}
        onClick={() => {
          for (const item of items) onItemStatus(item.id, "served");
        }}
        className="w-full bg-emerald-600 py-4 text-lg font-black uppercase tracking-wider text-slate-950 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
      >
        {allReady ? "Отдано" : "Готовится"}
      </button>
    </div>
  );
}
