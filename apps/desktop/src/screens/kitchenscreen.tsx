import type { Order, OrderItem, UUID } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useOrders } from "../state/orders";
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
  const { kitchenTickets: tickets, setItemStatus } = useOrders();
  const { findTable } = useTables();
  const now = useNow(15_000);

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden p-4">
      <header className="mb-6 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h1 className="text-2xl font-black tracking-wide text-emerald-400">
          Монитор кухни
        </h1>
        <div className="font-mono text-xl tabular-nums">
          Активных тикетов: {tickets.length}
        </div>
      </header>

      {tickets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-slate-600">
          <span className="mb-2 text-4xl">🍳</span>
          <p className="text-sm">Новых заказов нет.</p>
        </div>
      ) : (
        <div className="flex flex-1 items-start gap-4 overflow-x-auto pb-4">
          {tickets.map(({ order, items }) => (
            <Ticket
              key={order.id}
              order={order}
              items={items}
              tableLabel={
                order.tableId
                  ? (findTable(order.tableId)?.label ?? null)
                  : undefined
              }
              now={now}
              onItemStatus={setItemStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Ticket({
  order,
  items,
  tableLabel,
  now,
  onItemStatus,
}: {
  order: Order;
  items: OrderItem[];
  /**
   * Подпись стола. `undefined` — заказ на вынос, `null` — стол у заказа указан,
   * но не найден в схеме. Разные вещи: во втором случае повару нельзя
   * показывать «На вынос», иначе блюдо унесут не туда.
   */
  tableLabel: string | undefined | null;
  now: number;
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

      <div className="min-h-60 flex-1 space-y-1 p-3">
        {items.map((item) => {
          const menuItem = findMenuItem(item.menuItemId);
          const isReady = item.status === "ready";

          return (
            <button
              key={item.id}
              type="button"
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
        disabled={!allReady}
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
