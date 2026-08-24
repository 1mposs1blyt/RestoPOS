import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Money,
  Order,
  OrderItem,
  Payment,
  PaymentKind,
  UUID,
} from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { useOrders } from "../state/orders";
import { usePrinting } from "../state/printing";
import { useStopList } from "../state/stoplist";
import { useMenu } from "../state/menu";
import { MenuNotice } from "./menunotice";
import { formatMoney } from "../lib/money";
import { lineTotal } from "../lib/order-price";
import { formatElapsed, minutesSince, useNow } from "../lib/useNow";

/**
 * Расчёт на прилавке — режим `counter` (шаурмечная, кофейня навынос).
 *
 * Столов нет, поэтому нет и схемы зала: заказ набирают и рассчитывают в один
 * заход, а гостя зовут по номеру. Оплата здесь же отправляет позиции на кухню —
 * на прилавке платят вперёд, и разделять эти два действия незачем.
 */
export function CounterScreen() {
  const { can, authorize } = useAccess();
  const { navigate } = useNavigation();
  const {
    state: { orders },
    counterOrder,
    openOrder,
    itemsOfOrder,
    orderTotal,
    paymentsOfOrder,
    addItem,
    setQuantity,
    removeItem,
    cancelOrder,
  } = useOrders();
  const { fireOrder } = usePrinting();
  // Живой стоп-лист терминала, а не снимок `isStopListed` из меню: его правит
  // повар в течение смены, и на прилавке это заметно сразу.
  const { isStopped } = useStopList();
  const { categories, itemsOfCategory, status: menuStatus } = useMenu();

  /*
   * Категория выбирается лениво: меню приезжает с узла, и на первом рендере
   * его ещё нет. `null` — «ни одна не выбрана», а не «первая»; какая из них
   * первая, станет известно ниже, когда меню доедет.
   */
  const [pickedCategoryId, setPickedCategoryId] = useState<UUID | null>(null);
  // Пропавшая из меню категория не должна оставаться выбранной — см. `orderscreen`.
  const activeCategoryId =
    categories.find((category) => category.id === pickedCategoryId)?.id ??
    categories[0]?.id ??
    null;
  /** Только что рассчитанный заказ: номер называют гостю, способ — для сверки. */
  const [served, setServed] = useState<{
    number: number;
    payments: Payment[];
  } | null>(null);

  useEffect(() => {
    if (!counterOrder) openOrder(null);
  }, [counterOrder, openOrder]);

  /*
   * Заказ закрылся на экране оплаты — показываем номер здесь, вернувшись.
   * Следим за исчезновением активного заказа, а не за нажатием «Оплатить»:
   * оплата происходит на другом экране, и этот про её кнопку ничего не знает.
   */
  const previousOrderRef = useRef<Order | null>(null);
  useEffect(() => {
    const previous = previousOrderRef.current;
    previousOrderRef.current = counterOrder ?? null;
    if (!previous || counterOrder?.id === previous.id) return;
    const closed = orders[previous.id];
    if (closed?.status !== "paid") return;
    setServed({ number: closed.number, payments: paymentsOfOrder(closed.id) });
  }, [counterOrder, orders, paymentsOfOrder]);

  const categoryItems = useMemo(
    () => (activeCategoryId ? itemsOfCategory(activeCategoryId) : []),
    [activeCategoryId, itemsOfCategory],
  );

  if (!counterOrder) return null;

  const items = itemsOfOrder(counterOrder.id);
  const total = orderTotal(counterOrder.id);

  /*
   * Порядок важен: сначала на кухню, потом оплата. `fireOrder` переводит
   * позиции в работу, и тикет остаётся на кухонном экране даже после того,
   * как заказ стал `paid` — на прилавке платят вперёд, но еда от этого
   * не готова.
   */
  const goToPayment = () => {
    fireOrder(counterOrder.id);
    navigate({ name: "payment", orderId: counterOrder.id });
  };

  /*
   * «Сброс» отменяет набранный заказ целиком — это `order.cancel`, а не
   * очистка формы: у заказа уже есть номер в смене, и он не переиспользуется.
   * У кассира право своё, официант за прилавком спросит подтверждение.
   */
  const handleReset = () => {
    authorize("order.cancel", `Заказ № ${counterOrder.number}`).then(
      () => cancelOrder(counterOrder.id),
      () => undefined,
    );
  };

  return (
    /*
     * Раскладка та же, что на экране заказа: чек слева, сетка блюд по центру,
     * категории колонкой справа, функции полосой внизу. Плюс очередь заказов
     * с краю — её на экране заказа нет, а на прилавке без неё нельзя:
     * кассир тут обычно сам и готовит.
     *
     * Без внешних отступов и скруглений: на моноблоке 1024x768 рамка по кругу
     * съедает проценты площади ни за что. Панели разделены границей
     * в один пиксель, а не воздухом.
     */
    <div className="flex h-full w-full select-none overflow-hidden bg-slate-950">
      <CounterCheck
        order={counterOrder}
        items={items}
        total={total}
        served={served}
        canEdit={can("order.item.add")}
        onQuantity={setQuantity}
        onRemove={removeItem}
        onCloseOverlay={() => setServed(null)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          {menuStatus === "ready" ? null : (
            <div className="p-3">
              <MenuNotice />
            </div>
          )}

          {/* Плотнее и площе прежнего: в запару важно, сколько позиций видно
              без прокрутки, а не мягкость углов. Цену держим крупной —
              по ней кассир сверяется с гостем вслух. */}
          <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(150px,1fr))] content-start gap-2 overflow-y-auto p-3">
            {categoryItems.map((menuItem) => (
              <button
                key={menuItem.id}
                type="button"
                disabled={isStopped(menuItem.id) || !can("order.item.add")}
                onClick={() => addItem(counterOrder.id, menuItem.id)}
                className={cn(
                  "flex h-24 flex-col justify-between rounded border-b-4 p-2 text-left transition",
                  isStopped(menuItem.id)
                    ? "cursor-not-allowed border-slate-800 bg-slate-900/60 opacity-50"
                    : "border-orange-500/70 bg-slate-800 active:scale-95 hover:bg-slate-700",
                )}
              >
                <span className="line-clamp-3 text-sm font-bold leading-tight text-slate-100">
                  {menuItem.name}
                </span>
                {isStopped(menuItem.id) ? (
                  <span className="text-xs font-bold uppercase text-rose-400">
                    Стоп-лист
                  </span>
                ) : (
                  <span className="text-base font-black tabular-nums text-orange-400">
                    {formatMoney(menuItem.price)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Полоса функций. Действия над заказом собраны в одном месте
              и не разъезжаются по экрану — как в iikoFront. */}
          <div className="flex shrink-0 gap-px border-t border-slate-800 bg-slate-800">
            <CounterKey
              label="Сброс"
              disabled={items.length === 0}
              onClick={handleReset}
            />
            <CounterKey
              label={can("payment.accept") ? "К оплате" : "Оплату принимает кассир"}
              tone="pay"
              disabled={items.length === 0 || !can("payment.accept")}
              onClick={goToPayment}
            />
          </div>
        </div>

        {/* Категории колонкой: строкой сверху они переносились на две
            и съедали высоту сетки. */}
        <div className="flex w-32 shrink-0 flex-col gap-px overflow-y-auto border-l border-slate-800 bg-slate-800">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setPickedCategoryId(category.id)}
              className={cn(
                "min-h-14 shrink-0 px-3 py-2 text-left text-sm font-bold uppercase leading-tight tracking-wide transition",
                activeCategoryId === category.id
                  ? "bg-orange-500 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800",
              )}
            >
              {category.name}
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
  const { kitchenTickets, setItemStatus, paymentsOfOrder } = useOrders();
  const { can } = useAccess();
  const now = useNow(15_000);
  // Выдача гостю, а не кухонный статус: на прилавке заказ отдаёт кассир.
  const canIssue = can("order.item.serve");

  return (
    <div className="flex w-52 shrink-0 flex-col overflow-hidden border-l border-slate-800 bg-slate-950">
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
              payments={paymentsOfOrder(order.id)}
              now={now}
              canIssue={canIssue}
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

const PAYMENT_STYLES: Record<PaymentKind, string> = {
  cash: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60",
  card: "bg-sky-950/70 text-sky-300 border-sky-800/60",
  external: "bg-violet-950/70 text-violet-300 border-violet-800/60",
  no_revenue: "bg-slate-800/70 text-slate-400 border-slate-700/60",
};

/**
 * Чем рассчитались. Кассиру нужно при сверке кассы и при возврате.
 *
 * Бейджей может быть несколько: чек, оплаченный частью картой и частью
 * наличными, — обычное дело, и показывать только первый способ значит
 * подсказать кассиру неверную сумму при возврате.
 */
function PaymentBadges({
  payments,
  className,
}: {
  payments: Payment[];
  className?: string;
}) {
  return (
    <>
      {payments
        .filter((payment) => payment.refundOf === null)
        .map((payment) => (
          <span
            key={payment.id}
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-1 text-xs font-bold",
              PAYMENT_STYLES[payment.kind],
              className,
            )}
          >
            {payment.label}
          </span>
        ))}
    </>
  );
}

function QueueCard({
  number,
  createdAt,
  items,
  payments,
  now,
  canIssue,
  onIssued,
}: {
  number: number;
  createdAt: string;
  items: OrderItem[];
  /** Пусто — заказ ещё не рассчитан (заказы из зала). */
  payments: Payment[];
  now: number;
  canIssue: boolean;
  onIssued: () => void;
}) {
  const { findMenuItem } = useMenu();
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

      <div className="flex flex-wrap gap-1 px-3 py-2">
        {payments.length > 0 ? (
          <PaymentBadges payments={payments} />
        ) : (
          <span className="inline-flex items-center rounded-md border border-amber-800/60 bg-amber-950/70 px-2 py-1 text-xs font-bold text-amber-300">
            Не оплачен
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={!canIssue}
        onClick={onIssued}
        className="min-h-11 w-full bg-emerald-600 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-emerald-500 active:scale-95 disabled:pointer-events-none disabled:bg-slate-800 disabled:text-slate-600"
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
  canEdit,
  onQuantity,
  onRemove,
  onCloseOverlay,
}: {
  order: Order;
  items: OrderItem[];
  total: Money;
  served: { number: number; payments: Payment[] } | null;
  canEdit: boolean;
  onQuantity: (itemId: UUID, quantity: number) => void;
  onRemove: (itemId: UUID) => void;
  onCloseOverlay: () => void;
}) {
  return (
    <div className="relative flex w-72 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-3">
        <div>
          <h3 className="text-lg font-black text-emerald-400">
            Заказ № {order.number}
          </h3>
          <span className="text-xs text-slate-500">Расчёт на прилавке</span>
        </div>
        {/* Номер крупно: его называют гостю, и он же на ленте. */}
        <span className="text-2xl font-black tabular-nums text-slate-600">
          №{order.number}
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
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
              canEdit={canEdit}
              onQuantity={onQuantity}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Итог в чеке, действия — внизу экрана: сумма нужна глазу постоянно,
          а «К оплате» нажимается один раз за заказ. */}
      <div className="flex items-baseline justify-between border-t-2 border-slate-800 bg-slate-900 px-3 py-3">
        <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Итого
        </span>
        <span className="text-3xl font-black tabular-nums text-emerald-400">
          {formatMoney(total)}
        </span>
      </div>

      {served !== null && (
        <PaidOverlay
          number={served.number}
          payments={served.payments}
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
  payments,
  onClose,
}: {
  number: number;
  payments: Payment[];
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
        <div className="mt-4 flex flex-wrap justify-center gap-1">
          <PaymentBadges payments={payments} />
        </div>
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
  canEdit,
  onQuantity,
  onRemove,
}: {
  item: OrderItem;
  canEdit: boolean;
  onQuantity: (itemId: UUID, quantity: number) => void;
  onRemove: (itemId: UUID) => void;
}) {
  const { findMenuItem } = useMenu();
  const menuItem = findMenuItem(item.menuItemId);

  return (
    <div className="rounded border-l-2 border-slate-700 bg-slate-900 p-2">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {menuItem?.name ?? "Позиция удалена из меню"}
        </p>
        <span className="text-sm font-bold tabular-nums">
          {formatMoney(lineTotal(item, findMenuItem))}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onQuantity(item.id, item.quantity - 1)}
          aria-label="Уменьшить количество"
          className="h-11 w-11 rounded-lg bg-slate-800 text-lg font-bold text-slate-300 transition hover:bg-slate-700 active:scale-90 disabled:pointer-events-none disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-6 text-center text-sm font-bold tabular-nums text-orange-400">
          {item.quantity}
        </span>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onQuantity(item.id, item.quantity + 1)}
          aria-label="Увеличить количество"
          className="h-11 w-11 rounded-lg bg-slate-800 text-lg font-bold text-slate-300 transition hover:bg-slate-700 active:scale-90 disabled:pointer-events-none disabled:opacity-40"
        >
          +
        </button>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onRemove(item.id)}
          className="ml-1 inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:pointer-events-none disabled:opacity-40"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

/**
 * Клавиша нижней панели прилавка.
 *
 * Та же, что на экране заказа (`orderscreen.tsx`): высота 64px вместо
 * минимальных 44, потому что это самые нажимаемые кнопки смены, и в запару
 * по ним попадают боковым зрением. Высота задаётся `min-h-16`, а не
 * вертикальными паддингами: паддинги обнуляются сбросом вне слоя, и кнопка
 * молча схлопывается.
 */
function CounterKey({
  label,
  onClick,
  disabled = false,
  tone = "plain",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "plain" | "pay";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-16 flex-1 px-2 text-sm font-black uppercase leading-tight tracking-wide transition active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        tone === "pay"
          ? "bg-orange-500 text-white hover:bg-orange-400"
          : "bg-slate-900 text-slate-300 hover:bg-slate-800",
      )}
    >
      {label}
    </button>
  );
}
