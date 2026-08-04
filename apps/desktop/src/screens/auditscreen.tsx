import { useMemo, useState } from "react";
import type { Permission } from "@restopos/shared-types";
import { OVERRIDABLE_PERMISSIONS } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { PERMISSION_LABELS, useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";

/**
 * Журнал опасных операций.
 *
 * Механизм подтверждения чужим PIN существует **ради этого экрана**: без
 * журнала он бессмыслен — подтвердили и забыли. Разбор недостачи в конце
 * смены выглядит именно так: менеджер смотрит, кто сторнировал, что именно
 * и с чьего разрешения (в iiko это отчёт «037 Опасные операции»).
 *
 * Право на просмотр — `audit.view`, у менеджера. На сервисном экране этому
 * журналу не место: у вендорского `support` ровно одно право `terminal.service`,
 * ни заказов, ни денег он видеть не должен (`docs/access.md`), а здесь и суммы,
 * и имена сотрудников.
 *
 * Журнал локальный, до появления узла. Настоящий живёт в БД (`audit_log`)
 * и переживает очистку терминала — иначе достаточно нажать «Очистить»,
 * чтобы следы пропали, и весь смысл теряется.
 */
export function AuditScreen() {
  const { auditLog, clearAuditLog } = useAccess();
  const { back } = useNavigation();
  const [filter, setFilter] = useState<Permission | null>(null);
  /** Показывать ли действия, совершённые своим правом, без подтверждения. */
  const [onlyApproved, setOnlyApproved] = useState(false);

  const entries = useMemo(
    () =>
      auditLog.filter(
        (entry) =>
          (filter === null || entry.permission === filter) &&
          (!onlyApproved || entry.approvedByName !== null),
      ),
    [auditLog, filter, onlyApproved],
  );

  /*
   * Счётчики по типам считаем от всего журнала, а не от отфильтрованного:
   * иначе выбранный фильтр обнулял бы все остальные цифры, и сравнить
   * «сторно против отмен» стало бы невозможно.
   */
  const counts = useMemo(() => {
    const map = new Map<Permission, number>();
    for (const entry of auditLog) {
      map.set(entry.permission, (map.get(entry.permission) ?? 0) + 1);
    }
    return map;
  }, [auditLog]);

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-baseline gap-4 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <h1 className="text-lg font-black tracking-wide">Опасные операции</h1>
        <span className="text-sm text-slate-500">
          Записей: {entries.length} из {auditLog.length}
        </span>
        <span className="text-xs text-slate-600">
          Журнал локальный — до появления узла
        </span>
      </header>

      <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-800 p-3">
        <FilterChip active={filter === null} onClick={() => setFilter(null)}>
          Все · {auditLog.length}
        </FilterChip>
        {OVERRIDABLE_PERMISSIONS.map((permission) => (
          <FilterChip
            key={permission}
            active={filter === permission}
            onClick={() => setFilter(permission)}
          >
            {PERMISSION_LABELS[permission]} · {counts.get(permission) ?? 0}
          </FilterChip>
        ))}
        <FilterChip
          active={onlyApproved}
          onClick={() => setOnlyApproved((prev) => !prev)}
        >
          Только с подтверждением
        </FilterChip>
      </div>

      {/* Прокрутка в обе стороны: пять колонок с именами и датами на 1024
          не помещаются, и уезжать должна таблица, а не весь экран. */}
      <div className="min-h-0 flex-1 overflow-auto">
        {entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-600">
            {auditLog.length === 0
              ? "Опасных операций не было."
              : "Под фильтр ничего не попало."}
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3 font-medium">Время</th>
                <th className="px-5 py-3 font-medium">Операция</th>
                <th className="px-5 py-3 font-medium">Объект</th>
                <th className="px-5 py-3 font-medium">Кто</th>
                <th className="px-5 py-3 font-medium">Подтвердил</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-xs tabular-nums text-slate-500">
                    {new Date(entry.at).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-200">
                    {PERMISSION_LABELS[entry.permission]}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">
                    {entry.subject ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">
                    {entry.actorName}
                    <span className="text-slate-600"> · {entry.actorRole}</span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    {entry.approvedByName ? (
                      <span className="text-amber-300">
                        {entry.approvedByName}
                      </span>
                    ) : (
                      // Различие важное: «своим правом» — это не подтверждение,
                      // а действие, на которое у человека право есть по роли.
                      <span className="text-slate-600">своим правом</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
          onClick={clearAuditLog}
          className="min-h-16 px-6 text-sm font-bold text-slate-500 transition active:bg-slate-800"
        >
          Очистить локальный журнал
        </button>
      </footer>
    </div>
  );
}

function FilterChip({
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
        "min-h-11 rounded-lg border px-4 text-xs font-bold transition active:scale-95",
        active
          ? "border-transparent bg-orange-500 text-white"
          : "border-slate-700/50 bg-slate-800 text-slate-400",
      )}
    >
      {children}
    </button>
  );
}
