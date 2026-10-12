import { ScreenHeader } from "../components/screen-header";
import { DEMO_CATEGORIES, DEMO_ITEMS } from "../data/demo-menu";
import { formatMoney } from "../lib/money";
import { usePos } from "../state/pos";

interface StopListScreenProps {
  onBack: () => void;
}

/**
 * Стоп-лист: что кончилось и сколько осталось.
 *
 * Хранится **остаток**, а не флаг: «осталось три порции» флагом не выражается,
 * а кассиру это нужно знать до того, как он пробьёт четвёртую. Остаток
 * тратится сам при добавлении позиции в чек.
 *
 * Позиция в стопе не исчезает из меню, а гасится: кассир должен видеть,
 * что она существует, иначе он ищет её в других категориях, пока гость ждёт.
 */
export function StopListScreen({ onBack }: StopListScreenProps) {
  const pos = usePos();
  const stopped = Object.keys(pos.stopList).length;

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-white">
      <ScreenHeader
        title="Стоп-лист"
        subtitle={
          stopped === 0 ? "Ограничений нет" : `Позиций с ограничением: ${stopped}`
        }
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {DEMO_CATEGORIES.map((category) => (
          <section key={category.id} className="mb-4">
            <p className="px-1 pb-2 text-xs tracking-widest text-neutral-500">
              {category.name.toUpperCase()}
            </p>

            {DEMO_ITEMS.filter((item) => item.categoryId === category.id).map(
              (item) => {
                const remainder = pos.remainderOf(item.id);
                const isOut = remainder === 0;
                const isLimited = remainder !== undefined && remainder > 0;

                return (
                  <div
                    key={item.id}
                    className="mb-2 flex items-center gap-3 rounded-xl bg-neutral-900 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          isOut
                            ? "truncate text-lg font-semibold text-neutral-600"
                            : "truncate text-lg font-semibold"
                        }
                      >
                        {item.name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {formatMoney(item.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label="Уменьшить остаток"
                      disabled={remainder === undefined || remainder === 0}
                      onClick={() =>
                        pos.setStop(item.id, Math.max((remainder ?? 0) - 1, 0))
                      }
                      className="h-11 w-11 shrink-0 rounded-lg bg-neutral-800 text-xl font-bold active:bg-neutral-700 disabled:text-neutral-700"
                    >
                      −
                    </button>

                    <span
                      className={
                        isOut
                          ? "w-20 text-center text-base font-bold text-red-500"
                          : "w-20 text-center text-lg font-bold tabular-nums"
                      }
                    >
                      {isOut ? "нет" : isLimited ? remainder : "—"}
                    </span>

                    <button
                      type="button"
                      aria-label="Увеличить остаток"
                      onClick={() => pos.setStop(item.id, (remainder ?? 0) + 1)}
                      className="h-11 w-11 shrink-0 rounded-lg bg-neutral-800 text-xl font-bold active:bg-neutral-700"
                    >
                      +
                    </button>

                    {remainder === undefined ? (
                      <button
                        type="button"
                        onClick={() => pos.setStop(item.id, 0)}
                        className="min-h-11 w-44 shrink-0 rounded-lg bg-neutral-800 text-base font-semibold text-neutral-300 active:bg-neutral-700"
                      >
                        Нет в наличии
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => pos.clearStop(item.id)}
                        className="min-h-11 w-44 shrink-0 rounded-lg bg-emerald-700 text-base font-semibold active:bg-emerald-600"
                      >
                        Вернуть в продажу
                      </button>
                    )}
                  </div>
                );
              },
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
