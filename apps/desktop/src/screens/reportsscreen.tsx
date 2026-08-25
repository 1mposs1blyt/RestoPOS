import { useMemo, useState } from "react";
import { cn } from "@restopos/ui-kit";
import { useNavigation } from "../app/navigation";
import { FunctionBar, FunctionKey } from "../components/functionbar";
import { PanelHead } from "../components/panelhead";
import { useMenu } from "../state/menu";
import { useOrders } from "../state/orders";
import { useShifts } from "../state/shifts";
import { REPORTS, reportGroups, type ReportContext } from "../lib/reports";
import { formatMoney } from "../lib/money";

/**
 * Каталог отчётов.
 *
 * Слева список с кодами, справа сам отчёт — как в кассе iiko. Коды (011, 048…)
 * сохранены намеренно: управляющий, работавший на iiko, называет отчёт номером,
 * и переименовывать их «по-своему» значит заставить его переучиваться.
 *
 * Считают отчёты чистые функции из `lib/reports.ts` — там же они и проверяются
 * тестами. Здесь только выбор и показ.
 *
 * Раскладка — как на экране заказа, прилавке, оплате и кассе: плоские панели
 * с границей в пиксель, шапка с состоянием сверху, функции полосой внизу.
 */
export function ReportsScreen() {
  const { back } = useNavigation();
  const { state: orders } = useOrders();
  const { cashShift, state: shifts } = useShifts();
  const { findMenuItem } = useMenu();
  const [selected, setSelected] = useState<string | null>(null);

  const context = useMemo<ReportContext>(
    () => ({
      orders: Object.values(orders.orders),
      items: Object.values(orders.items),
      payments: Object.values(orders.payments),
      discounts: Object.values(orders.discounts),
      operations: Object.values(shifts.cashOperations),
      cashShift,
      findMenuItem,
    }),
    [orders, shifts.cashOperations, cashShift, findMenuItem],
  );

  const report = REPORTS.find((entry) => entry.code === selected);
  const table = useMemo(
    () => (report ? report.run(context) : null),
    [report, context],
  );

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden bg-slate-950">
      {/* Шапка: за какую смену считаем. Номер крупно справа — отчёт называют
          вместе с ним («048 за смену 17»), а закрытая смена объясняет пустые
          таблицы: без неё отчёты пусты все и одинаково. */}
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black tracking-wide text-slate-200">
            Отчёты
          </h1>
          <p className="truncate text-xs text-slate-500">
            {cashShift
              ? "За текущую кассовую смену"
              : "Кассовая смена закрыта — отчёты пусты"}
          </p>
        </div>
        <span className="shrink-0 text-2xl font-black tabular-nums text-slate-600">
          {cashShift ? `№${cashShift.number}` : "—"}
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Каталог. Ширина как у чека на соседних экранах: названия отчётов
            длинные, и в узкой колонке каждое уходит на три строки. */}
        <nav className="flex w-80 shrink-0 flex-col border-r border-slate-800 xl:w-96">
          <PanelHead label="Каталог" count={REPORTS.length} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {reportGroups().map(({ group, reports }) => (
              <div key={group}>
                <h2 className="border-b border-slate-900 bg-slate-900/60 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  {group}
                </h2>
                {reports.map((entry) => (
                  <button
                    key={entry.code}
                    type="button"
                    onClick={() => setSelected(entry.code)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm leading-tight transition",
                      selected === entry.code
                        ? "bg-orange-500/15 text-slate-100"
                        : "text-slate-400 active:bg-slate-800",
                    )}
                  >
                    <span className="w-8 shrink-0 tabular-nums text-slate-600">
                      {entry.code}
                    </span>
                    <span>{entry.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PanelHead
            label={report ? `${report.code} · ${report.title}` : "Отчёт"}
            count={table?.rows.length}
          />
          {/*
            Прокрутка — **внутри панели**, обе оси. Колонок у отчётов до шести
            (036: заказ, основание, кто, подтвердил, скидка, надбавка), и когда
            в них попадут длинные имена и комментарии, таблица сдвинется внутри
            себя, а не потянет экран вбок: за границу окна на моноблоке
            не уехать вовсе — там нет ни колеса, ни полосы под пальцем.
            Резать колонки по разрешению нельзя — это уже другой отчёт,
            не тот, который управляющий просил.
          */}
          <div className="min-h-0 flex-1 overflow-auto">
            {table === null ? (
              <p className="p-8 text-center text-sm text-slate-600">
                Выберите отчёт слева
              </p>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    {table.columns.map((column) => (
                      <th
                        key={column.key}
                        className={cn(
                          "whitespace-nowrap px-4 py-3 font-medium",
                          column.numeric && "text-right",
                        )}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {table.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={table.columns.length}
                        className="px-4 py-8 text-center text-sm text-slate-600"
                      >
                        Данных за смену нет
                      </td>
                    </tr>
                  ) : (
                    table.rows.map((row, index) => (
                      // Строки отчёта не имеют собственного идентификатора —
                      // это агрегат, а не сущность; порядок здесь и есть ключ.
                      // biome-ignore lint/suspicious/noArrayIndexKey: строки агрегата не переупорядочиваются
                      <tr key={index}>
                        {table.columns.map((column) => (
                          <td
                            key={column.key}
                            className={cn(
                              "px-4 py-3 text-sm text-slate-300",
                              column.numeric && "text-right tabular-nums",
                            )}
                          >
                            {renderCell(row[column.key], column.numeric)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
                {table.footer && (
                  <tfoot className="border-t-2 border-slate-700 bg-slate-900">
                    <tr>
                      {table.columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            "px-4 py-3 text-sm font-black text-slate-100",
                            column.numeric && "text-right tabular-nums",
                          )}
                        >
                          {renderCell(
                            table.footer?.[column.key],
                            column.numeric,
                          )}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </section>
      </div>

      <FunctionBar>
        <FunctionKey label="← Назад" onClick={back} />
        <FunctionKey
          label="Печать"
          disabled={table === null}
          onClick={() => window.print()}
        />
      </FunctionBar>
    </div>
  );
}

/**
 * Числовые ячейки показываем деньгами, если это похоже на сумму.
 *
 * Отчёты возвращают `Money` строкой («420.00»), а количество и счётчики —
 * обычным числом. Форматируем только первое: «2 ₽ борща» вместо «2 шт.»
 * читается как цена.
 */
function renderCell(value: string | undefined, numeric?: boolean): string {
  if (value === undefined || value === "") return "";
  if (!numeric) return value;
  return /^-?\d+\.\d{2}$/.test(value) ? formatMoney(value) : value;
}
