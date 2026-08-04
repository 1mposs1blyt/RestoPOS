import { useMemo, useState } from "react";
import type { Delivery, DeliveryKind, DeliveryStatus } from "@restopos/shared-types";
import { DELIVERY_TRANSITIONS, canAdvance } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { useDelivery } from "../state/delivery";
import { useOrders } from "../state/orders";
import { formatMoney } from "../lib/money";

/**
 * Доставка и самовывоз.
 *
 * Конвейер состояний вверху — главный элемент экрана: диспетчер смотрит
 * не список, а сколько заказов застряло на каждом шаге. Поэтому счётчики
 * стоят прямо в переключателе, а не прячутся в фильтрах.
 *
 * Опоздание считаем от `dueAt`, а не от времени создания: гость ждёт к сроку,
 * а не «через сорок минут после оформления».
 */
const STATUS_LABELS: Record<DeliveryStatus, string> = {
  unconfirmed: "Неподтв.",
  new: "Новые",
  cooking: "Готовится",
  ready: "Готовы",
  on_way: "В пути",
  closed: "Закрытые",
  canceled: "Отмена",
};

const PIPELINE: DeliveryStatus[] = [
  "unconfirmed",
  "new",
  "cooking",
  "ready",
  "on_way",
  "closed",
  "canceled",
];

const KIND_LABELS: Record<DeliveryKind, string> = {
  delivery: "Доставка",
  pickup: "Самовывоз",
};

export function DeliveryScreen() {
  const { can } = useAccess();
  const { back } = useNavigation();
  const { deliveries, countByStatus, setStatus } = useDelivery();
  const { orderTotal } = useOrders();
  const [tab, setTab] = useState<DeliveryStatus | null>(null);
  const [kind, setKind] = useState<DeliveryKind | null>(null);

  const canManage = can("delivery.manage");
  const now = Date.now();

  const visible = useMemo(
    () =>
      deliveries.filter(
        (delivery) =>
          (tab === null || delivery.status === tab) &&
          (kind === null || delivery.kind === kind),
      ),
    [deliveries, tab, kind],
  );

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-stretch border-b border-slate-800 bg-slate-900">
        <KindTab active={kind === null} onClick={() => setKind(null)}>
          Все заказы
        </KindTab>
        <KindTab active={kind === "delivery"} onClick={() => setKind("delivery")}>
          Доставка
        </KindTab>
        <KindTab active={kind === "pickup"} onClick={() => setKind("pickup")}>
          Самовывоз
        </KindTab>
      </header>

      <div className="flex shrink-0 items-stretch overflow-x-auto border-b border-slate-800">
        <StatusTab active={tab === null} onClick={() => setTab(null)}>
          Все <b className="ml-1 tabular-nums">{deliveries.length}</b>
        </StatusTab>
        {PIPELINE.map((status) => (
          <StatusTab
            key={status}
            active={tab === status}
            onClick={() => setTab(status)}
          >
            {STATUS_LABELS[status]}{" "}
            <b className="ml-1 tabular-nums">{countByStatus(status)}</b>
          </StatusTab>
        ))}
      </div>

      {/* Прокрутка в обе стороны: у доставки восемь колонок, и на моноблоке
          1024 они не помещаются. Пусть уезжает таблица, а не весь экран. */}
      <div className="min-h-0 flex-1 overflow-auto">
        {visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-600">
            Заказов нет.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Время</th>
                <th className="px-4 py-3 font-medium">Адрес</th>
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">Коммент.</th>
                <th className="px-4 py-3 text-right font-medium">Сумма</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {visible.map((delivery) => (
                <DeliveryRow
                  key={delivery.id}
                  delivery={delivery}
                  total={formatMoney(orderTotal(delivery.orderId))}
                  isLate={isLate(delivery, now)}
                  canManage={canManage}
                  onStatus={(status) => setStatus(delivery.id, status)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="flex shrink-0 border-t border-slate-800 bg-slate-900">
        <button
          type="button"
          onClick={back}
          className="min-h-16 min-w-32 px-6 text-sm font-bold text-slate-300 transition active:bg-slate-800"
        >
          Назад
        </button>
      </footer>
    </div>
  );
}

function DeliveryRow({
  delivery,
  total,
  isLate: late,
  canManage,
  onStatus,
}: {
  delivery: Delivery;
  total: string;
  isLate: boolean;
  canManage: boolean;
  onStatus: (status: DeliveryStatus) => void;
}) {
  /*
   * Показываем только переходы, разрешённые из текущего состояния и рода:
   * кнопка «В путь» у самовывоза — это обещание, которое некому выполнить.
   */
  const next = DELIVERY_TRANSITIONS[delivery.status].filter(
    (status) => status !== "canceled" && canAdvance(delivery, status),
  );

  return (
    <tr className={cn(late && "bg-rose-950/20")}>
      <td className="px-4 py-3 text-sm tabular-nums text-slate-400">
        {delivery.externalNumber ?? "—"}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-bold text-slate-300">
          {STATUS_LABELS[delivery.status]}
        </span>
        <span className="ml-2 text-xs text-slate-600">
          {KIND_LABELS[delivery.kind]}
        </span>
      </td>
      <td
        className={cn(
          "px-4 py-3 text-sm tabular-nums",
          late ? "font-bold text-rose-400" : "text-slate-300",
        )}
      >
        {formatTime(delivery.dueAt)}
        {late && <span className="ml-1 text-xs">опоздание</span>}
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">
        {delivery.address ?? "самовывоз"}
      </td>
      <td className="px-4 py-3 text-sm text-slate-300">
        {delivery.customerName}
        <span className="block text-xs text-slate-600">{delivery.phone}</span>
      </td>
      <td className="max-w-48 truncate px-4 py-3 text-xs text-slate-500">
        {delivery.comment || "—"}
      </td>
      <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-slate-200">
        {total}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          {canManage &&
            next.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatus(status)}
                className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-bold text-slate-300 transition active:bg-slate-700"
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
        </div>
      </td>
    </tr>
  );
}

/**
 * Опоздание — от срока, а не от создания: гость ждёт к назначенному времени.
 * Закрытые и отменённые не опаздывают: они уже завершены.
 */
function isLate(delivery: Delivery, now: number): boolean {
  if (delivery.status === "closed" || delivery.status === "canceled") return false;
  return new Date(delivery.dueAt).getTime() < now;
}

function KindTab({
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
        "min-h-16 px-6 text-sm font-black tracking-wide transition",
        active ? "bg-orange-500 text-white" : "text-slate-400 active:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}

function StatusTab({
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
        "min-h-14 whitespace-nowrap px-5 text-sm transition",
        active
          ? "bg-slate-800 font-bold text-slate-100"
          : "text-slate-500 active:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
