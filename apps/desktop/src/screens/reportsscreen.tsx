import { useMemo, useState } from "react";
import { cn } from "@restopos/ui-kit";
import { useNavigation } from "../app/navigation";
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
 */
export function ReportsScreen() {
  const { back } = useNavigation();
  const { state: orders } = useOrders();
  const { cashShift, state: shifts } = useShifts();
  const [selected, setSelected] = useState<string | null>(null);

  const context = useMemo<ReportContext>(
    () => ({
      orders: Object.values(orders.orders),
      items: Object.values(orders.items),
      payments: Object.values(orders.payments),
      operations: Object.values(shifts.cashOperations),
      cashShift,
    }),
    [orders, shifts.cashOperations, cashShift],
  );

  const report = REPORTS.find((entry) => entry.code === selected);
  const table = useMemo(
    () => (report ? report.run(context) : null),
    [report, context],
  );

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-baseline gap-4 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <h1 className="text-lg font-black tracking-wide">Отчёты</h1>
        <span className="text-sm text-slate-500">
          {cashShift
            ? `Кассовая смена №${cashShift.number}`
            : "Кассовая смена закрыта — отчёты пусты"}
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="min-h-0 w-96 shrink-0 overflow-y-auto border-r border-slate-800">
          {reportGroups().map(({ group, reports }) => (
            <div key={group}>
              <h2 className="bg-slate-900 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-500">
                {group}
              </h2>
              {reports.map((entry) => (
                <button
                  key={entry.code}
                  type="button"
                  onClick={() => setSelected(entry.code)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 px-5 text-left text-sm transition",
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
        </nav>

        <section className="min-h-0 min-w-0 flex-1 overflow-auto">
          {table === null ? (
            <p className="p-8 text-center text-sm text-slate-600">
              Выберите отчёт
            </p>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  {table.columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-5 py-3 font-medium",
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
                      className="px-5 py-8 text-center text-sm text-slate-600"
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
                            "px-5 py-3 text-sm text-slate-300",
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
                          "px-5 py-3 text-sm font-black text-slate-100",
                          column.numeric && "text-right tabular-nums",
                        )}
                      >
                        {renderCell(table.footer?.[column.key], column.numeric)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          )}
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
        <button
          type="button"
          disabled={table === null}
          onClick={() => window.print()}
          className="min-h-16 px-6 text-sm font-bold text-slate-300 transition active:bg-slate-800 disabled:text-slate-700"
        >
          Печать
        </button>
      </footer>
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
