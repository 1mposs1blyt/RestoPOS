import { useMemo, useState } from "react";
import type { StaffShift } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useNavigation } from "../app/navigation";
import { roleLabel } from "../app/session";
import { findStaff, staffRoster } from "../data/session-source";
import { useShifts } from "../state/shifts";

/**
 * Табель явок.
 *
 * Показывает **фактическое** против **зачтённого**: человек пробил приход
 * в 6:40, а смена по расписанию с 7:00. Разница и есть «серая зона» из iiko —
 * то, за что бухгалтерия задаёт вопросы, и то, ради чего табель существует.
 *
 * Зачтённое правится, фактическое — нет (`state/shifts-reducer.ts`): стерев
 * факт, мы уничтожим само расхождение, а вместе с ним и смысл экрана.
 * Поэтому «принять» не меняет `openedAt`, а проставляет `acceptedAt`.
 *
 * Расписания в системе пока нет — колонка «по расписанию» показывает прочерк.
 * Когда оно появится, серая зона станет считаться от него, а не от факта.
 */
type Tab = "all" | "open" | "closed" | "grey";

/**
 * Есть ли расхождение зачтённого с фактическим — та самая «серая зона».
 * Функция вынесена из компонента: она чистая, и внутри её пришлось бы
 * тащить в зависимости каждого `useMemo`.
 */
function isGrey(shift: StaffShift): boolean {
  return shift.acceptedAt !== null || shift.acceptedUntil !== null;
}

const TAB_LABELS: Record<Tab, string> = {
  all: "Все явки",
  open: "Открытые",
  closed: "Закрытые",
  grey: "Серая зона",
};

export function AttendanceScreen() {
  const { back } = useNavigation();
  const { state, acceptStaffShift, workedMinutes } = useShifts();
  const [tab, setTab] = useState<Tab>("all");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const shifts = useMemo(
    () =>
      Object.values(state.staffShifts).sort((a, b) =>
        b.openedAt.localeCompare(a.openedAt),
      ),
    [state.staffShifts],
  );

  const visible = useMemo(
    () =>
      shifts.filter((shift) => {
        const staff = findStaff(shift.staffId);
        if (roleFilter && staff?.role !== roleFilter) return false;
        switch (tab) {
          case "open":
            return shift.status === "open";
          case "closed":
            return shift.status === "closed";
          case "grey":
            return isGrey(shift);
          default:
            return true;
        }
      }),
    [shifts, tab, roleFilter],
  );

  /*
   * Должности берём из штата, а не из явок: должность без единой явки тоже
   * должна быть в фильтре — иначе непонятно, что повар сегодня не выходил,
   * и это выглядит как отсутствие такой должности вообще.
   */
  const roles = useMemo(() => {
    const seen = new Map<string, number>();
    for (const staff of staffRoster()) {
      const count = shifts.filter((s) => findStaff(s.staffId)?.role === staff.role)
        .length;
      seen.set(staff.role, count);
    }
    return [...seen.entries()];
  }, [shifts]);

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-stretch border-b border-slate-800 bg-slate-900">
        {(Object.keys(TAB_LABELS) as Tab[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={cn(
              "min-h-16 px-6 text-sm font-black tracking-wide transition",
              tab === name
                ? "bg-orange-500 text-white"
                : "text-slate-400 active:bg-slate-800",
            )}
          >
            {TAB_LABELS[name]}
          </button>
        ))}
        <div className="flex-1" />
        <span className="self-center px-5 text-sm text-slate-500">
          Записей: {visible.length}
        </span>
      </header>

      <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-800 p-3">
        <RoleChip active={roleFilter === null} onClick={() => setRoleFilter(null)}>
          Все должности
        </RoleChip>
        {roles.map(([role, count]) => (
          <RoleChip
            key={role}
            active={roleFilter === role}
            onClick={() => setRoleFilter(role)}
          >
            {roleLabel(role as never)} · {count}
          </RoleChip>
        ))}
      </div>

      {/* Прокрутка в обе стороны: две группы колонок («принято» и «по
          расписанию») на 1024 не помещаются. */}
      <div className="min-h-0 flex-1 overflow-auto">
        {visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-600">
            {tab === "grey" ? "Расхождений нет." : "Явок нет."}
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3 font-medium">Сотрудник</th>
                <th className="px-5 py-3 font-medium" colSpan={3}>
                  Принято
                </th>
                <th className="px-5 py-3 font-medium" colSpan={2}>
                  По расписанию
                </th>
                <th className="px-5 py-3" />
              </tr>
              <tr className="text-[0.65rem]">
                <th className="px-5 pb-2 font-normal" />
                <th className="px-5 pb-2 font-normal">Приход</th>
                <th className="px-5 pb-2 font-normal">Уход</th>
                <th className="px-5 pb-2 font-normal">Зачтено</th>
                <th className="px-5 pb-2 font-normal">Приход</th>
                <th className="px-5 pb-2 font-normal">Примечание</th>
                <th className="px-5 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {visible.map((shift) => {
                const staff = findStaff(shift.staffId);
                const grey = isGrey(shift);
                return (
                  <tr key={shift.id} className={cn(grey && "bg-amber-950/20")}>
                    <td className="px-5 py-3 text-sm text-slate-200">
                      {staff?.fullName ?? shift.staffId}
                      <span className="block text-xs text-slate-600">
                        {staff ? roleLabel(staff.role) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums text-slate-300">
                      {formatTime(shift.acceptedAt ?? shift.openedAt)}
                      {shift.acceptedAt && (
                        // Факт показываем рядом зачёркнутым: без него
                        // расхождение невидимо, а оно и есть суть табеля.
                        <span className="ml-2 text-xs text-slate-600 line-through">
                          {formatTime(shift.openedAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums text-slate-300">
                      {shift.closedAt || shift.acceptedUntil
                        ? formatTime(shift.acceptedUntil ?? shift.closedAt ?? "")
                        : "—:—"}
                    </td>
                    <td className="px-5 py-3 text-sm tabular-nums text-slate-300">
                      {formatDuration(workedMinutes(shift))}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">—</td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {shift.status === "open" ? "смена открыта" : ""}
                      {grey && (
                        <span className="text-amber-400"> зачёт изменён</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          acceptStaffShift(
                            shift.id,
                            // Зачесть с ближайшего получаса — самый частый
                            // случай правки: человек пришёл раньше начала смены.
                            roundUpToHalfHour(shift.openedAt),
                            shift.acceptedUntil,
                          )
                        }
                        className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-4 text-xs font-bold text-slate-300 transition active:bg-slate-700"
                      >
                        Зачесть с :00/:30
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <footer className="flex shrink-0 border-t border-slate-800 bg-slate-900">
        <button
          type="button"
          onClick={back}
          className="min-h-16 min-w-32 px-6 text-sm font-bold text-slate-300 transition active:bg-slate-800"
        >
          Назад
        </button>
      </footer>
    </div>
  );
}

function RoleChip({
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

/** Округление вверх до получаса — типовая правка прихода. */
function roundUpToHalfHour(iso: string): string {
  const date = new Date(iso);
  const minutes = date.getMinutes();
  date.setSeconds(0, 0);
  date.setMinutes(minutes <= 30 ? 30 : 60);
  return date.toISOString();
}

function formatTime(iso: string): string {
  if (!iso) return "—:—";
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}
