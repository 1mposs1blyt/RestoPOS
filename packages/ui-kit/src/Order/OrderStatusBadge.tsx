import type { OrderItemStatus, OrderStatus } from "@restopos/shared-types";
import { cn } from "../cn";

const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  open: { label: "Открыт", className: "bg-slate-200 text-slate-800" },
  sent_to_kitchen: { label: "На кухне", className: "bg-blue-100 text-blue-900" },
  paid: { label: "Оплачен", className: "bg-emerald-100 text-emerald-900" },
  canceled: { label: "Отменён", className: "bg-red-100 text-red-900" },
};

const ITEM_STATUS: Record<OrderItemStatus, { label: string; className: string }> = {
  new: { label: "Новая", className: "bg-slate-200 text-slate-800" },
  cooking: { label: "Готовится", className: "bg-amber-100 text-amber-900" },
  ready: { label: "Готово", className: "bg-emerald-100 text-emerald-900" },
  served: { label: "Подано", className: "bg-slate-100 text-slate-500" },
  voided: { label: "Сторно", className: "bg-red-100 text-red-900" },
};

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const { label, className: tone } = ORDER_STATUS[status];
  return <Badge label={label} tone={tone} className={className} />;
}

export interface OrderItemStatusBadgeProps {
  status: OrderItemStatus;
  className?: string;
}

export function OrderItemStatusBadge({
  status,
  className,
}: OrderItemStatusBadgeProps) {
  const { label, className: tone } = ITEM_STATUS[status];
  return <Badge label={label} tone={tone} className={className} />;
}

function Badge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
