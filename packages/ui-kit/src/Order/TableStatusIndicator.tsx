import type { TableStatus } from "@restopos/shared-types";
import { cn } from "../cn";

export interface TableStatusIndicatorProps {
  label: string;
  status: TableStatus;
  /** Сколько минут стол занят — помогает менеджеру видеть «зависшие» столы. */
  occupiedForMinutes?: number;
  onClick?: () => void;
  className?: string;
}

const STATUS_STYLES: Record<TableStatus, string> = {
  free: "border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
  occupied: "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  reserved: "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
};

const STATUS_LABELS: Record<TableStatus, string> = {
  free: "Свободен",
  occupied: "Занят",
  reserved: "Бронь",
};

export function TableStatusIndicator({
  label,
  status,
  occupiedForMinutes,
  onClick,
  className,
}: TableStatusIndicatorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Стол ${label}: ${STATUS_LABELS[status]}`}
      className={cn(
        "flex aspect-square min-h-24 flex-col items-center justify-center gap-1",
        "rounded-2xl border-2 p-3 transition-transform active:scale-95",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="text-2xl font-bold leading-none">{label}</span>
      <span className="text-xs opacity-80">{STATUS_LABELS[status]}</span>
      {status === "occupied" && occupiedForMinutes !== undefined && (
        <span className="text-xs font-medium tabular-nums opacity-70">
          {occupiedForMinutes} мин
        </span>
      )}
    </button>
  );
}
