import { useState } from "react";
import type { UUID } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { findStaff } from "../data/session-source";
import { useMenu } from "../state/menu";
import { MenuNotice } from "./menunotice";
import { useStopList } from "../state/stoplist";
import { formatMoney } from "../lib/money";

/**
 * Стоп-лист.
 *
 * Слева — что уже в стоп-листе, справа классификатор меню: чтобы внести
 * позицию, её выбирают там же, где обычно набирают заказ. Отдельного поиска
 * не заводим — повар помнит блюдо в лицо, а не по названию в списке.
 *
 * Остаток вместо флага: «осталось три порции» позволяет дораспродать то,
 * что есть, вместо снятия блюда с продажи целиком.
 */
export function StopListScreen() {
  const { can } = useAccess();
  const { back } = useNavigation();
  const { entries, entryOf, put, remove, clear } = useStopList();
  const {
    categories,
    findMenuItem,
    itemsOfCategory,
    status: menuStatus,
  } = useMenu();

  // Категория выбирается лениво: меню приезжает с узла и на первом рендере
  // ещё пусто. `null` — «ни одна не выбрана», а не «первая».
  const [pickedCategoryId, setPickedCategoryId] = useState<UUID | null>(null);
  // Пропавшая из меню категория не должна оставаться выбранной — см. `orderscreen`.
  const categoryId =
    categories.find((category) => category.id === pickedCategoryId)?.id ??
    categories[0]?.id ??
    null;

  const canEdit = can("menu.stoplist");

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-baseline gap-4 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <h1 className="text-lg font-black tracking-wide">Стоп-лист</h1>
        <span className="text-sm text-slate-500">
          Выберите позицию в классификаторе, чтобы внести её
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border-r border-slate-800">
          {entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-600">
              Стоп-лист пуст — продаётся всё меню.
            </p>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-medium">Наименование</th>
                    <th className="px-5 py-3 font-medium">Внёс</th>
                    <th className="px-5 py-3 font-medium">Время</th>
                    <th className="px-5 py-3 text-right font-medium">Остаток</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {entries.map((entry) => (
                    <tr
                      key={entry.menuItemId}
                      className={cn(entry.remainder === 0 && "bg-rose-950/20")}
                    >
                      <td className="px-5 py-3 text-sm text-slate-200">
                        {findMenuItem(entry.menuItemId)?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400">
                        {findStaff(entry.staffId)?.fullName ?? entry.staffId}
                      </td>
                      <td className="px-5 py-3 text-sm tabular-nums text-slate-500">
                        {formatTime(entry.at)}
                      </td>
                      <td
                        className={cn(
                          "px-5 py-3 text-right text-sm font-bold tabular-nums",
                          entry.remainder === 0
                            ? "text-rose-400"
                            : "text-amber-300",
                        )}
                      >
                        {entry.remainder === 0 ? "кончилось" : entry.remainder}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => remove(entry.menuItemId)}
                            className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-4 text-xs font-bold text-slate-300 transition active:bg-slate-700"
                          >
                            Убрать
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex min-h-0 w-[28rem] shrink-0 flex-col">
          <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-800 p-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setPickedCategoryId(category.id)}
                className={cn(
                  "min-h-11 rounded-lg border px-3 text-xs font-bold transition active:scale-95",
                  categoryId === category.id
                    ? "border-transparent bg-orange-500 text-white"
                    : "border-slate-700/50 bg-slate-800 text-slate-400",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {menuStatus === "ready" ? null : <MenuNotice />}

            <div className="grid grid-cols-2 gap-2">
              {(categoryId ? itemsOfCategory(categoryId) : []).map((menuItem) => {
                const entry = entryOf(menuItem.id);
                return (
                  <button
                    key={menuItem.id}
                    type="button"
                    disabled={!canEdit}
                    // Одно касание вносит «кончилось» — самый частый случай.
                    // Остаток правится кнопками ниже, когда он вообще нужен.
                    onClick={() => put(menuItem.id, 0)}
                    className={cn(
                      "flex min-h-20 flex-col items-start justify-between rounded-xl border p-3 text-left transition active:scale-95 disabled:opacity-40",
                      entry
                        ? "border-amber-800/60 bg-amber-950/30"
                        : "border-slate-700/40 bg-slate-800/60",
                    )}
                  >
                    <span className="text-sm font-bold text-slate-200">
                      {menuItem.name}
                    </span>
                    <span className="text-xs tabular-nums text-slate-500">
                      {entry
                        ? `в стоп-листе · ${entry.remainder || "кончилось"}`
                        : formatMoney(menuItem.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <footer className="flex shrink-0 items-stretch border-t border-slate-800 bg-slate-900">
        <button
          type="button"
          onClick={back}
          className="min-h-16 min-w-32 px-6 text-sm font-bold text-slate-300 transition active:bg-slate-800"
        >
          Назад
        </button>
        <div className="flex-1" />
        {canEdit && entries.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="min-h-16 px-6 text-sm font-bold text-slate-500 transition active:bg-slate-800"
          >
            Очистить стоп-лист
          </button>
        )}
      </footer>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
