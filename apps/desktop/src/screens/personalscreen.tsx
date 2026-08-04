import { useMemo, useState } from "react";
import { cn } from "@restopos/ui-kit";
import { useNavigation } from "../app/navigation";
import { roleLabel, useSession } from "../app/session";
import { useOrders } from "../state/orders";
import { useShifts } from "../state/shifts";
import {
  formatMoney,
  fromMinor,
  sumMoney,
  toMinor,
  ZERO_MONEY,
} from "../lib/money";

/**
 * Личная страница сотрудника.
 *
 * Показывает **личную** смену, а не кассовую: сколько человек отработал и на
 * сколько продал. Отсюда же он уходит с работы — закрытие личной смены
 * не трогает кассовый день, и наоборот (см. `state/shifts.tsx`).
 *
 * «Начисления» отдельной вкладкой, потому что это другой вопрос: не «что я
 * сделал», а «сколько мне за это причитается». Расчёт по ставке и проценту
 * приезжает с сервера, локально его не бывает.
 */
type Tab = "results" | "payroll";

export function PersonalScreen() {
  const [tab, setTab] = useState<Tab>("results");
  const { staff } = useSession();
  const { back } = useNavigation();
  const { myShift, workedMinutes, closeMyShift } = useShifts();
  const { state, orderTotal } = useOrders();

  /**
   * Личные продажи: заказы, закрытые этим сотрудником в текущей личной смене.
   * Считаем от заказов, а не от платежей: заказ принадлежит официанту,
   * а платёж мог провести кассир на другом терминале.
   */
  const personal = useMemo(() => {
    if (!staff || !myShift) {
      return { revenue: ZERO_MONEY, count: 0 };
    }
    const mine = Object.values(state.orders).filter(
      (order) =>
        order.waiterId === staff.id &&
        order.status === "paid" &&
        order.createdAt >= myShift.openedAt,
    );
    return {
      revenue: sumMoney(mine.map((order) => orderTotal(order.id))),
      count: mine.length,
    };
  }, [state.orders, staff, myShift, orderTotal]);

  const minutes = myShift ? workedMinutes(myShift) : 0;

  /**
   * Средние продажи в час. `null`, пока не отработано хотя бы несколько минут:
   * делить выручку на первые секунды смены — значит показать кассиру
   * четырёхзначную «производительность» и научить его не верить экрану.
   */
  const perHour = useMemo(() => {
    if (minutes < 5) return null;
    // Через копейки, а не через float по строке: `Money` — это `NUMERIC(10,2)`,
    // и арифметика по нему идёт только в минорных единицах (`lib/money.ts`).
    return formatMoney(fromMinor(toMinor(personal.revenue) / (minutes / 60)));
  }, [minutes, personal.revenue]);

  return (
    <div className="flex h-full w-full select-none flex-col">
      <header className="flex items-stretch border-b border-slate-700/50 bg-slate-800">
        <div className="flex-1 px-5 py-3">
          <h1 className="text-lg font-black tracking-wide">
            {staff?.fullName ?? "—"}
          </h1>
          <p className="text-sm text-slate-400">
            {staff ? roleLabel(staff.role) : ""}
            {myShift
              ? ` · смена открыта ${formatTime(myShift.openedAt)}`
              : " · личная смена закрыта"}
          </p>
        </div>
        <TabButton active={tab === "results"} onClick={() => setTab("results")}>
          Итоги работы
        </TabButton>
        <TabButton active={tab === "payroll"} onClick={() => setTab("payroll")}>
          Начисления
        </TabButton>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "results" ? (
          <div className="mx-auto max-w-2xl divide-y divide-slate-800 rounded-xl border border-slate-700/50 bg-slate-900">
            <Row label="Личные продажи (ЛП)" value={formatMoney(personal.revenue)} />
            <Row label="Закрыто заказов" value={String(personal.count)} />
            <Row
              label="Средние продажи в час (СПЧ)"
              value={perHour ?? "—"}
            />
            <Row label="Отработано" value={formatDuration(minutes)} />
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-xl border border-slate-700/50 bg-slate-900 p-6 text-center text-sm text-slate-500">
            Начисления считает сервер по ставке и проценту сотрудника.
            Локально их нет — терминал не знает условий оплаты труда.
          </div>
        )}
      </div>

      <footer className="flex items-stretch border-t border-slate-700/50 bg-slate-800">
        <button
          type="button"
          onClick={back}
          className="min-h-14 min-w-32 px-6 text-sm font-bold text-slate-300 transition active:bg-slate-700"
        >
          Назад
        </button>
        <div className="flex-1" />
        {myShift && (
          <button
            type="button"
            onClick={closeMyShift}
            className="min-h-14 px-6 text-sm font-black tracking-wide text-amber-300 transition active:bg-slate-700"
          >
            Закрыть личную смену
          </button>
        )}
      </footer>
    </div>
  );
}

function TabButton({
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
        "min-h-14 min-w-44 px-6 text-sm font-black tracking-wide transition",
        active
          ? "bg-orange-500 text-white"
          : "text-slate-400 active:bg-slate-700",
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between px-5">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-lg font-bold tabular-nums text-slate-100">
        {value}
      </span>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** «0 ч. 07 м.» — как в iiko: часы и минуты, без секунд. */
function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)} ч. ${String(minutes % 60).padStart(2, "0")} м.`;
}
