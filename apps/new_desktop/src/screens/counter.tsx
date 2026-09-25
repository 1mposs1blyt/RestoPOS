import { useEffect, useState } from "react";
import type { UUID } from "@restopos/shared-types";
import { ActiveOrders } from "../components/active-orders";
import { ServiceDrawer } from "../components/service-drawer";
import { DEMO_CATEGORIES, DEMO_ITEMS } from "../data/demo-menu";
import { formatMoney, multiplyMoney } from "../lib/money";
import { usePos } from "../state/pos";
import { PaymentPanel } from "./payment-panel";
import type { ServiceScreen } from "./routes";

interface CounterScreenProps {
  onNavigate: (screen: ServiceScreen) => void;
  onLock: () => void;
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);
  return now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Единственный рабочий экран прилавка: чек слева, меню посередине, заказы
 * в работе справа, оплата панелью поверх.
 *
 * Раскладка выбрана под то, как кассир работает голосом: он зачитывает гостю
 * состав, поэтому чек не должен прятаться ни на шаг. Категории стоят лентой
 * над плитками, а не колонкой у другого края экрана, — иначе на каждую позицию
 * взгляд проходит через весь экран и обратно.
 */
export function CounterScreen({ onNavigate, onLock }: CounterScreenProps) {
  const pos = usePos();
  const clock = useClock();
  const [picked, setPicked] = useState<UUID | null>(null);
  const [paying, setPaying] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  /*
   * Категория выбирается лениво: когда меню приедет с узла, на первом рендере
   * его ещё не будет, и `DEMO_CATEGORIES[0].id` в инициализаторе состояния
   * пришлось бы переписывать.
   */
  const categoryId = picked ?? DEMO_CATEGORIES[0]?.id ?? null;
  const items = DEMO_ITEMS.filter((item) => item.categoryId === categoryId);
  const isEmpty = pos.lines.length === 0;
  const isShiftOpen = pos.shift.status === "open";

  return (
    <div className="relative flex h-screen flex-col bg-neutral-950 text-white">
      <header className="flex min-h-14 items-center justify-between border-b border-neutral-800 px-4">
        <p className="text-xl font-bold">
          Заказ <span className="text-orange-500">№ {pos.orderNumber}</span>
        </p>
        <div className="flex items-center gap-4">
          {isShiftOpen ? null : (
            <span className="rounded-lg bg-red-950 px-3 py-1 text-sm font-semibold text-red-400">
              Смена закрыта
            </span>
          )}
          <span className="text-lg tabular-nums text-neutral-400">{clock}</span>
          <span className="text-base text-neutral-300">Игорь</span>
          <button
            type="button"
            aria-label="Служебное меню"
            onClick={() => setServiceOpen(true)}
            className="h-11 w-11 rounded-lg bg-neutral-800 text-xl active:bg-neutral-700"
          >
            ☰
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex w-80 shrink-0 flex-col border-r border-neutral-800">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isEmpty ? (
              <p className="p-6 text-center text-neutral-600">
                Выберите позиции справа
              </p>
            ) : (
              pos.lines.map((line) => (
                <div
                  key={line.id}
                  className="border-b border-neutral-900 px-3 py-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-medium">{line.name}</span>
                    <span className="shrink-0 text-base font-semibold tabular-nums text-neutral-300">
                      {formatMoney(multiplyMoney(line.price, line.quantity))}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Убрать одну"
                      onClick={() => pos.decrement(line.id)}
                      className="h-11 w-11 rounded-lg bg-neutral-800 text-xl font-bold active:bg-neutral-700"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-lg font-bold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Добавить одну"
                      onClick={() => pos.increment(line.id)}
                      className="h-11 w-11 rounded-lg bg-neutral-800 text-xl font-bold active:bg-neutral-700"
                    >
                      +
                    </button>
                    <span className="ml-auto text-sm tabular-nums text-neutral-500">
                      {formatMoney(line.price)} / шт
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-neutral-800 p-3">
            <div className="flex items-baseline justify-between px-1 pb-3">
              <span className="text-sm tracking-widest text-neutral-500">
                ИТОГО
              </span>
              <span className="text-4xl font-bold tabular-nums text-emerald-400">
                {formatMoney(pos.total)}
              </span>
            </div>

            {/*
              Закрытая смена гасит оплату с прямым текстом, а не молча:
              «кнопка не нажимается» кассир объясняет гостю дольше, чем
              открывает смену.
            */}
            {isShiftOpen ? null : (
              <button
                type="button"
                onClick={() => onNavigate("shift")}
                className="mb-2 min-h-11 w-full rounded-lg bg-red-950 px-3 text-sm font-semibold text-red-300 active:bg-red-900"
              >
                Смена закрыта — открыть
              </button>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isEmpty}
                onClick={pos.clear}
                className="min-h-16 w-20 rounded-xl bg-neutral-800 text-sm font-semibold text-neutral-300 active:bg-neutral-700 disabled:text-neutral-700"
              >
                Сброс
              </button>
              <button
                type="button"
                disabled={isEmpty || !isShiftOpen}
                onClick={() => setPaying(true)}
                className="min-h-16 flex-1 rounded-xl bg-emerald-600 text-2xl font-bold active:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600"
              >
                Оплатить
              </button>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-14 items-center gap-2 overflow-x-auto px-3">
            {DEMO_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setPicked(category.id)}
                className={
                  category.id === categoryId
                    ? "min-h-11 shrink-0 rounded-lg bg-orange-600 px-5 text-base font-bold"
                    : "min-h-11 shrink-0 rounded-lg bg-neutral-800 px-5 text-base font-semibold text-neutral-300 active:bg-neutral-700"
                }
              >
                {category.name}
              </button>
            ))}
          </div>

          {/*
            Ширина плитки задана, а число колонок считает браузер: на 1024
            их две, на 1366 — три, на большом мониторе — пять. Фиксированное
            `grid-cols-3` на 1024 сжало бы плитку до нечитаемой, а на 1920
            растянуло бы на треть экрана.
          */}
          <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 overflow-y-auto p-3">
            {items.map((item) => {
              const remainder = pos.remainderOf(item.id);
              const isOut = remainder === 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isOut}
                  onClick={() => pos.add(item)}
                  className="flex min-h-28 flex-col justify-between rounded-xl bg-neutral-800 p-3 text-left active:bg-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-600"
                >
                  <span className="text-lg font-semibold leading-tight">
                    {item.name}
                  </span>
                  {/*
                    Позиция в стоп-листе гасится, но остаётся на месте: кассир
                    должен видеть, что она существует, иначе он ищет её в других
                    категориях, пока гость ждёт.
                  */}
                  {isOut ? (
                    <span className="text-sm font-bold tracking-widest text-red-500">
                      СТОП-ЛИСТ
                    </span>
                  ) : (
                    <span className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-orange-500">
                        {formatMoney(item.price)}
                      </span>
                      {remainder === undefined ? null : (
                        <span className="text-sm font-semibold text-amber-500">
                          осталось {remainder}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <ActiveOrders orders={pos.queue} onHand={pos.hand} />
      </div>

      {paying ? (
        <PaymentPanel
          orderNumber={pos.orderNumber}
          total={pos.total}
          onPaid={(kind) => {
            pos.pay(kind);
            setPaying(false);
          }}
          onClose={() => setPaying(false)}
        />
      ) : null}

      {serviceOpen ? (
        <ServiceDrawer
          shiftHint={
            isShiftOpen
              ? `смена № ${pos.shift.number} открыта`
              : "закрыта — продавать нельзя"
          }
          onNavigate={(screen) => {
            setServiceOpen(false);
            onNavigate(screen);
          }}
          onLock={() => {
            setServiceOpen(false);
            onLock();
          }}
          onClose={() => setServiceOpen(false)}
        />
      ) : null}
    </div>
  );
}
