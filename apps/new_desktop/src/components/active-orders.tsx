import { formatMoney } from "../lib/money";
import type { PaidOrder } from "../state/pos";

interface ActiveOrdersProps {
  orders: PaidOrder[];
  onHand: (orderNumber: number) => void;
}

/**
 * Заказы в работе: оплачены, но ещё не отданы.
 *
 * Колонка, а не полоса с номерами: выдавая пакет, кассир сверяет его
 * с составом, и одного номера для этого мало. Колонка видна всегда, в том
 * числе пустой, — если она появлялась бы только при непустой очереди, плитки
 * меню ездили бы под пальцем ровно в тот момент, когда по ним бьют чаще всего.
 *
 * Тикетов кухни здесь нет намеренно: на прилавке кассир обычно сам и готовит,
 * отдельного кухонного экрана у такого заведения не бывает.
 */
export function ActiveOrders({ orders, onHand }: ActiveOrdersProps) {
  return (
    <section className="flex w-64 shrink-0 flex-col border-l border-neutral-800">
      <div className="flex min-h-14 items-center justify-between px-3">
        <span className="text-xs tracking-widest text-neutral-500">В РАБОТЕ</span>
        <span className="text-lg font-bold tabular-nums text-neutral-400">
          {orders.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {orders.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-neutral-600">
            Все заказы выданы
          </p>
        ) : (
          orders.map((order) => (
            <article
              key={order.number}
              className="mb-2 rounded-xl bg-neutral-900 p-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-orange-500">
                  № {order.number}
                </span>
                <span className="text-sm tabular-nums text-neutral-500">
                  {formatMoney(order.total)}
                </span>
              </div>

              <ul className="mt-2 mb-3">
                {order.lines.map((line) => (
                  <li key={line.id} className="flex gap-2 py-0.5 text-sm">
                    <span className="w-6 shrink-0 font-bold tabular-nums text-neutral-400">
                      {line.quantity}×
                    </span>
                    <span className="min-w-0 leading-tight">{line.name}</span>
                  </li>
                ))}
              </ul>

              {/*
                Выдача — отдельная кнопка, а не нажатие на карточку целиком:
                промах по карточке снимает заказ с экрана, и кассир теряет
                список того, что нужно собрать.
              */}
              <button
                type="button"
                onClick={() => onHand(order.number)}
                className="min-h-11 w-full rounded-lg bg-orange-600 text-base font-bold active:bg-orange-500"
              >
                Выдан
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
