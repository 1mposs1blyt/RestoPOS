import type { Money, Order } from "@restopos/shared-types";
import { cn } from "./cn";
import { OrderStatusBadge } from "./OrderStatusBadge";

export interface OrderCardProps {
  order: Order;
  /** Подпись стола. Отдельным пропом: `Order` хранит только `tableId`. */
  tableLabel?: string;
  waiterName?: string;
  itemCount: number;
  total: Money;
  onClick?: () => void;
  className?: string;
}

export function OrderCard({
  order,
  tableLabel,
  waiterName,
  itemCount,
  total,
  onClick,
  className,
}: OrderCardProps) {
  const openedAt = new Date(order.createdAt).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4",
        "shadow-sm transition-shadow dark:border-slate-700 dark:bg-slate-800",
        onClick && "cursor-pointer hover:shadow-md active:scale-[0.99]",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {tableLabel ? `Стол ${tableLabel}` : "На вынос"}
          </h3>
          {waiterName && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {waiterName}
            </p>
          )}
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <footer className="flex items-end justify-between gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {openedAt} · {itemCount} поз.
        </span>
        <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
          {total} ₽
        </span>
      </footer>
    </article>
  );
}
