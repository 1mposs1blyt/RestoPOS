import { useEffect, useMemo, useState } from "react";
import type { OrderItem, PaymentMethod, UUID } from "@restopos/shared-types";
import { OrderItemStatusBadge, OrderStatusBadge, cn } from "@restopos/ui-kit";
import { useNavigation } from "../app/navigation";
import { useOrders } from "../state/orders";
import { useTables } from "../state/tables";
import { MENU_CATEGORIES, findMenuItem, menuItemsOfCategory } from "../state/menu";
import { formatMoney, multiplyMoney } from "../lib/money";

/**
 * Экран заказа: чек слева, меню справа.
 *
 * Позиция редактируется, пока не ушла на кухню (`status === "new"`). После
 * отправки её нельзя удалить из чека — это инвариант №6, append-only
 * на уровне `order_items`: потерянная позиция означает несъеденное блюдо
 * либо неоплаченное.
 */
export function OrderScreen({ tableId }: { tableId: UUID }) {
  const { back } = useNavigation();
  const { findTable } = useTables();
  const {
    orderOfTable,
    openOrder,
    itemsOfOrder,
    orderTotal,
    hasPendingItems,
    addItem,
    setQuantity,
    removeItem,
    sendToKitchen,
    payOrder,
  } = useOrders();

  const table = findTable(tableId);
  const order = orderOfTable(tableId);

  useEffect(() => {
    if (!order) openOrder(tableId);
  }, [order, tableId, openOrder]);

  const [activeCategoryId, setActiveCategoryId] = useState(
    () => MENU_CATEGORIES[0].id,
  );

  const categoryItems = useMemo(
    () => menuItemsOfCategory(activeCategoryId),
    [activeCategoryId],
  );

  // Один кадр между монтированием и созданием заказа в эффекте.
  if (!order) return null;

  const items = itemsOfOrder(order.id);
  const total = orderTotal(order.id);
  const canSend = hasPendingItems(order.id);

  const handlePay = (method: PaymentMethod) => {
    payOrder(order.id, method);
    back();
  };

  return (
    <div className="flex h-full w-full select-none gap-4 overflow-hidden p-4">
      {/* Чек стола */}
      {/* На 1024 фиксированные 384px съедали больше трети экрана. */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-2xl xl:w-96">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-4">
          <div>
            <h3 className="text-lg font-black text-emerald-400">
              Стол {table?.label ?? "—"}
            </h3>
            <OrderStatusBadge status={order.status} className="mt-1" />
          </div>
          <button
            type="button"
            onClick={back}
            className="min-h-11 rounded-lg border border-slate-700/50 bg-slate-800 px-4 text-sm font-semibold transition hover:bg-slate-700 active:scale-95"
          >
            ← В зал
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-600">
              <span className="mb-2 text-3xl">📝</span>
              <p className="text-xs">Заказ пуст. Выберите блюда.</p>
            </div>
          ) : (
            items.map((item) => (
              <CheckLine
                key={item.id}
                item={item}
                onQuantity={setQuantity}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        <div className="space-y-3 border-t border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between px-1 text-lg font-black">
            <span>ИТОГО:</span>
            <span className="text-xl tabular-nums text-emerald-400">
              {formatMoney(total)}
            </span>
          </div>

          <button
            type="button"
            disabled={!canSend}
            onClick={() => sendToKitchen(order.id)}
            className="min-h-14 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            {canSend ? "Отправить на кухню" : "Всё отправлено на кухню"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() => handlePay("cash")}
              className="min-h-14 rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-slate-300 transition hover:bg-slate-700 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              Наличные
            </button>
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() => handlePay("card")}
              className="min-h-14 rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-slate-300 transition hover:bg-slate-700 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              Картой
            </button>
          </div>
        </div>
      </div>

      {/* Меню */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Переносим, а не прокручиваем: на 1024 категории не влезали в строку,
            а горизонтальный скроллбар на сенсорном экране — мишень в пару
            пикселей, и часть категорий просто не видна. */}
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

        {/* Колонки считаем от ширины самой сетки, а не от вьюпорта: ширина
            здесь зависит ещё и от панели чека, и брейкпоинты по экрану давали
            на 1024 карточки по ~145px — под названия блюд в две строки мало. */}
        <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(190px,1fr))] content-start gap-3 overflow-y-auto pr-1">
          {categoryItems.map((menuItem) => (
            <button
              key={menuItem.id}
              type="button"
              disabled={menuItem.isStopListed}
              onClick={() => addItem(order.id, menuItem.id)}
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
    </div>
  );
}

function CheckLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: OrderItem;
  onQuantity: (itemId: UUID, quantity: number) => void;
  onRemove: (itemId: UUID) => void;
}) {
  const menuItem = findMenuItem(item.menuItemId);
  const isEditable = item.status === "new";

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {menuItem?.name ?? "Позиция удалена из меню"}
          </p>
          <p className="text-xs tabular-nums text-slate-500">
            {menuItem ? formatMoney(menuItem.price) : "—"}
          </p>
        </div>
        <span className="text-sm font-bold tabular-nums">
          {menuItem ? formatMoney(multiplyMoney(menuItem.price, item.quantity)) : "—"}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {isEditable ? (
          <div className="flex items-center gap-2">
            <QuantityButton
              onClick={() => onQuantity(item.id, item.quantity - 1)}
              label="Уменьшить количество"
            >
              −
            </QuantityButton>
            <span className="min-w-6 text-center text-sm font-bold tabular-nums text-orange-400">
              {item.quantity}
            </span>
            <QuantityButton
              onClick={() => onQuantity(item.id, item.quantity + 1)}
              label="Увеличить количество"
            >
              +
            </QuantityButton>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="ml-1 inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
            >
              Удалить
            </button>
          </div>
        ) : (
          // Отправленную позицию из чека не убрать — только сторнировать,
          // и это отдельное действие менеджера.
          <span className="text-xs font-bold tabular-nums text-slate-400">
            × {item.quantity}
          </span>
        )}

        {!isEditable && <OrderItemStatusBadge status={item.status} />}
      </div>
    </div>
  );
}

function QuantityButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-11 w-11 rounded-lg bg-slate-800 text-lg font-bold text-slate-300 transition hover:bg-slate-700 active:scale-90"
    >
      {children}
    </button>
  );
}
