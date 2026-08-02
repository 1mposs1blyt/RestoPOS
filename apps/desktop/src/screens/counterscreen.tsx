import { useEffect, useMemo, useState } from "react";
import type {
  Money,
  Order,
  OrderItem,
  PaymentMethod,
  UUID,
} from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useOrders } from "../state/orders";
import { MENU_CATEGORIES, findMenuItem, menuItemsOfCategory } from "../state/menu";
import { formatMoney, multiplyMoney } from "../lib/money";
import { formatElapsed, minutesSince, useNow } from "../lib/useNow";

/**
 * Расчёт на прилавке — режим `counter` (шаурмечная, кофейня навынос).
 *
 * Столов нет, поэтому нет и схемы зала: заказ набирают и рассчитывают в один
 * заход, а гостя зовут по номеру. Оплата здесь же отправляет позиции на кухню —
 * на прилавке платят вперёд, и разделять эти два действия незачем.
 */
export function CounterScreen() {
  const {
    counterOrder,
    openOrder,
    itemsOfOrder,
    orderTotal,
    addItem,
    setQuantity,
    removeItem,
    sendToKitchen,
    payOrder,
    cancelOrder,
  } = useOrders();

  const [activeCategoryId, setActiveCategoryId] = useState(
    () => MENU_CATEGORIES[0].id,
  );
  /** Только что рассчитанный заказ: номер называют гостю, способ — для сверки. */
  const [served, setServed] = useState<{
    number: number;
    method: PaymentMethod;
  } | null>(null);

  useEffect(() => {
    if (!counterOrder) openOrder(null);
  }, [counterOrder, openOrder]);

  const categoryItems = useMemo(
    () => menuItemsOfCategory(activeCategoryId),
    [activeCategoryId],
  );

  if (!counterOrder) return null;

  const items = itemsOfOrder(counterOrder.id);
  const total = orderTotal(counterOrder.id);

  const handlePay = (method: PaymentMethod) => {
    // Порядок важен: сначала на кухню, потом оплата. `sendToKitchen`
    // переводит позиции в `cooking`, и тикет остаётся на кухонном экране
    // даже после того, как заказ стал `paid`.
    sendToKitchen(counterOrder.id);
    payOrder(counterOrder.id, method);
    setServed({ number: counterOrder.number, method });
  };

  return (
    // Порядок колонок = порядок в разметке: чек, меню, очередь.
    // Чек слева — как на экране заказа: кассир, привыкший к одному терминалу,
    // не должен переучиваться на другом.
    <div className="flex h-full w-full select-none gap-4 overflow-hidden p-4">
      <CounterCheck
        order={counterOrder}
        items={items}
        total={total}
        served={served}
        onQuantity={setQuantity}
        onRemove={removeItem}
        onPay={handlePay}
        onReset={() => cancelOrder(counterOrder.id)}
        onCloseOverlay={() => setServed(null)}
      />

      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 flex-wrap gap-2">
          {MENU_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={cn(
                "min-h-14 whitespace-nowrap rounded-xl border px-4 text-sm font-bold uppercase tracking-wider transition active:scale-95",
                activeCategoryId === category.id
                  ? "border-transparent bg-orange-500 text-white shadow-md shadow-orange-500/10"
                  : "border-slate-700/50 bg-slate-800 text-slate-400 hover:bg-slate-700/60",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(190px,1fr))] content-start gap-3 overflow-y-auto pr-1">
          {categoryItems.map((menuItem) => (
            <button
              key={menuItem.id}
              type="button"
              disabled={menuItem.isStopListed}
              onClick={() => addItem(counterOrder.id, menuItem.id)}
              className={cn(
                "group flex h-28 flex-col items-start justify-between rounded-2xl border p-4 text-left shadow-sm transition",
                menuItem.isStopListed
                  ? "cursor-not-allowed border-slate-800/40 bg-slate-900/40 opacity-50"
                  : "border-slate-700/40 bg-slate-800/60 hover:border-slate-600/80 hover:bg-slate-800 active:scale-95",
              )}
            >
              <span className="text-sm font-bold leading-tight text-slate-200 group-hover:text-white">
                {menuItem.name}
              </span>
              {menuItem.isStopListed ? (
                <span className="rounded-lg bg-rose-950/60 px-2 py-0.5 text-xs font-bold text-rose-400">
                  Стоп-лист
                </span>
              ) : (
                <span className="rounded-lg border border-slate-800/40 bg-slate-950/40 px-2 py-0.5 text-sm font-black tabular-nums text-orange-400">
                  {formatMoney(menuItem.price)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <OrderQueue />
    </div>
  );
}

/**
 * Очередь заказов в работе.
 *
 * На прилавке кассир обычно сам и готовит, а гости идут потоком — держать
 * в голове, что уже оплачено и ещё не выдано, нельзя. Источник тот же, что
 * у кухонного экрана (`kitchenTickets`): заказ уходит отсюда, когда еда
 * отдана, а не когда получены деньги.
 */
function OrderQueue() {
  const { kitchenTickets, setItemStatus, paymentOfOrder } = useOrders();
  const now = useNow(15_000);

  return (
    <div className="flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-2xl xl:w-72">
      <div className="flex items-baseline justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
          В работе
        </h3>
        <span className="text-sm font-bold tabular-nums text-orange-400">
          {kitchenTickets.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {kitchenTickets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-600">
            <span className="mb-2 text-3xl">✅</span>
            <p className="text-center text-xs">Очереди нет.</p>
          </div>
        ) : (
          kitchenTickets.map(({ order, items }) => (
            <QueueCard
              key={order.id}
              number={order.number}
              createdAt={order.createdAt}
              items={items}
              method={paymentOfOrder(order.id)?.method}
              now={now}
              onIssued={() => {
                for (const item of items) setItemStatus(item.id, "served");
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

/** Через сколько минут ожидания заказ подсвечивается как просроченный. */
const LATE_AFTER_MINUTES = 10;

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Наличные",
  card: "Безнал",
};

const PAYMENT_STYLES: Record<PaymentMethod, string> = {
  cash: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60",
  card: "bg-sky-950/70 text-sky-300 border-sky-800/60",
};

/** Чем рассчитались. Кассиру нужно при сверке кассы и при возврате. */
function PaymentBadge({
  method,
  className,
}: {
  method: PaymentMethod;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-bold",
        PAYMENT_STYLES[method],
        className,
      )}
    >
      {PAYMENT_LABELS[method]}
    </span>
  );
}

function QueueCard({
  number,
  createdAt,
  items,
  method,
  now,
  onIssued,
}: {
  number: number;
  createdAt: string;
  items: OrderItem[];
  /** `undefined` — заказ ещё не рассчитан (заказы из зала). */
  method: PaymentMethod | undefined;
  now: number;
  onIssued: () => void;
}) {
  const isLate = minutesSince(createdAt, now) >= LATE_AFTER_MINUTES;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-slate-900",
        isLate ? "border-rose-600" : "border-slate-800",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 font-black text-slate-950",
          isLate ? "bg-rose-500" : "bg-slate-400",
        )}
      >
        <span className="text-base tabular-nums">№ {number}</span>
        <span className="font-mono text-xs tabular-nums">
          {formatElapsed(createdAt, now)}
        </span>
      </div>

      <ul className="space-y-1 px-3 pt-2">
        {items.map((item) => (
          <li key={item.id} className="text-sm font-semibold text-slate-200">
            {item.quantity} × {findMenuItem(item.menuItemId)?.name ?? "—"}
          </li>
        ))}
      </ul>

      <div className="px-3 py-2">
        {method ? (
          <PaymentBadge method={method} />
        ) : (
          <span className="inline-flex items-center rounded-md border border-amber-800/60 bg-amber-950/70 px-2 py-1 text-xs font-bold text-amber-300">
            Не оплачен
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onIssued}
        className="min-h-11 w-full bg-emerald-600 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-emerald-500 active:scale-95"
      >
        Выдал
      </button>
    </div>
  );
}

function CounterCheck({
  order,
  items,
  total,
  served,
  onQuantity,
  onRemove,
  onPay,
  onReset,
  onCloseOverlay,
}: {
  order: Order;
  items: OrderItem[];
  total: Money;
  served: { number: number; method: PaymentMethod } | null;
  onQuantity: (itemId: UUID, quantity: number) => void;
  onRemove: (itemId: UUID) => void;
  onPay: (method: PaymentMethod) => void;
  onReset: () => void;
  onCloseOverlay: () => void;
}) {
  return (
    <div className="relative flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-2xl xl:w-96">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-4">
        <div>
          <h3 className="text-lg font-black text-emerald-400">
            Заказ № {order.number}
          </h3>
          <span className="text-xs text-slate-500">Расчёт на прилавке</span>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 rounded-lg border border-slate-700/50 bg-slate-800 px-4 text-sm font-semibold text-slate-400 transition hover:bg-slate-700 active:scale-95"
          >
            Сброс
          </button>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-600">
            <span className="mb-2 text-3xl">🥙</span>
            <p className="text-xs">Выберите позиции.</p>
          </div>
        ) : (
          items.map((item) => (
            <CounterLine
              key={item.id}
              item={item}
              onQuantity={onQuantity}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      <div className="space-y-3 border-t border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between px-1 text-lg font-black">
          <span>ИТОГО:</span>
          <span className="text-2xl tabular-nums text-emerald-400">
            {formatMoney(total)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => onPay("cash")}
            className="min-h-16 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            Наличные
          </button>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => onPay("card")}
            className="min-h-16 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-base font-bold text-white shadow-lg shadow-sky-900/20 transition hover:from-sky-500 hover:to-indigo-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            Картой
          </button>
        </div>
      </div>

      {served !== null && (
        <PaidOverlay
          number={served.number}
          method={served.method}
          onClose={onCloseOverlay}
        />
      )}
    </div>
  );
}

/**
 * Экран выдачи номера. Перекрывает чек до подтверждения кассира:
 * номер нужно успеть назвать гостю, а не потерять его при следующем касании.
 */
function PaidOverlay({
  number,
  method,
  onClose,
}: {
  number: number;
  method: PaymentMethod;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-slate-950/95 p-6 text-center">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Заказ принят, номер
        </p>
        <p className="mt-2 text-7xl font-black tabular-nums text-emerald-400">
          {number}
        </p>
        <PaymentBadge method={method} className="mt-4" />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="min-h-16 w-full rounded-xl bg-slate-800 px-6 text-base font-bold text-slate-200 transition hover:bg-slate-700 active:scale-95"
      >
        Следующий заказ
      </button>
    </div>
  );
}

function CounterLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: OrderItem;
  onQuantity: (itemId: UUID, quantity: number) => void;
  onRemove: (itemId: UUID) => void;
}) {
  const menuItem = findMenuItem(item.menuItemId);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {menuItem?.name ?? "Позиция удалена из меню"}
        </p>
        <span className="text-sm font-bold tabular-nums">
          {menuItem
            ? formatMoney(multiplyMoney(menuItem.price, item.quantity))
            : "—"}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQuantity(item.id, item.quantity - 1)}
          aria-label="Уменьшить количество"
          className="h-11 w-11 rounded-lg bg-slate-800 text-lg font-bold text-slate-300 transition hover:bg-slate-700 active:scale-90"
        >
          −
        </button>
        <span className="min-w-6 text-center text-sm font-bold tabular-nums text-orange-400">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onQuantity(item.id, item.quantity + 1)}
          aria-label="Увеличить количество"
          className="h-11 w-11 rounded-lg bg-slate-800 text-lg font-bold text-slate-300 transition hover:bg-slate-700 active:scale-90"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="ml-1 inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
