import { useMemo, useState } from "react";
import { cn } from "@restopos/ui-kit";
import { useNavigation } from "../app/navigation";
import { findStaff } from "../data/session-source";
import { findMenuItem } from "../state/menu";
import { useOrders } from "../state/orders";
import { formatMoney } from "../lib/money";

/**
 * Документы и реестр заказов.
 *
 * Три вкладки, как в кассе iiko: собственно документы, открытые заказы
 * и закрытые. Объединены не случайно — это всё «бумаги смены», и кассир
 * ищет их в одном месте: то незакрытый стол, то чек для возврата.
 *
 * Вкладка «Документы» пока пуста честно: типов внутренних документов
 * (списание, перемещение, приход) в системе ещё нет, и рисовать пустую
 * таблицу с колонками, которые никогда не заполнятся, значит обещать больше,
 * чем есть.
 */
type Tab = "documents" | "open" | "closed";

export function DocumentsScreen() {
  const { back } = useNavigation();
  const { state, itemsOfOrder, orderTotal, paymentsOfOrder } = useOrders();
  const [tab, setTab] = useState<Tab>("open");

  const orders = useMemo(() => Object.values(state.orders), [state.orders]);

  const open = useMemo(
    () =>
      orders
        .filter((order) => order.status === "open" || order.status === "sent_to_kitchen")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders],
  );

  const closed = useMemo(
    () =>
      orders
        .filter((order) => order.status === "paid")
        // Свежие сверху: возврат делают по последнему чеку, а не по вчерашнему.
        .sort((a, b) => (b.receiptNumber ?? 0) - (a.receiptNumber ?? 0)),
    [orders],
  );

  const composition = (orderId: string) =>
    itemsOfOrder(orderId)
      .filter((item) => item.status !== "voided" && item.status !== "split")
      .map((item) => findMenuItem(item.menuItemId)?.name ?? "—")
      .join("; ");

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-stretch border-b border-slate-800 bg-slate-900">
        <TabButton active={tab === "documents"} onClick={() => setTab("documents")}>
          Документы <b className="ml-2 tabular-nums">0</b>
        </TabButton>
        <TabButton active={tab === "open"} onClick={() => setTab("open")}>
          Открытые заказы <b className="ml-2 tabular-nums">{open.length}</b>
        </TabButton>
        <TabButton active={tab === "closed"} onClick={() => setTab("closed")}>
          Закрытые заказы <b className="ml-2 tabular-nums">{closed.length}</b>
        </TabButton>
      </header>

      {/* Прокрутка в обе стороны: у закрытых заказов семь колонок, на 1024
          они не помещаются — уезжать должна таблица, а не весь экран. */}
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "documents" && (
          <p className="p-8 text-center text-sm text-slate-600">
            Внутренних документов пока нет: списание, перемещение и приход
            появятся вместе со складом.
          </p>
        )}

        {tab === "open" && (
          <Table
            columns={["№", "Время", "Официант", "Гостей", "Состав", "Сумма"]}
            rows={open.map((order) => [
              String(order.number),
              formatTime(order.createdAt),
              findStaff(order.waiterId)?.fullName ?? order.waiterId,
              String(order.guestCount ?? 1),
              composition(order.id),
              formatMoney(orderTotal(order.id)),
            ])}
            empty="Открытых заказов нет."
          />
        )}

        {tab === "closed" && (
          <Table
            columns={["Чек", "Смена", "№", "Время", "Оплата", "Состав", "Сумма"]}
            rows={closed.map((order) => [
              String(order.receiptNumber ?? "—"),
              String(order.cashShiftNumber ?? "—"),
              String(order.number),
              formatTime(order.createdAt),
              paymentsOfOrder(order.id)
                .filter((payment) => payment.refundOf === null)
                .map((payment) => payment.label)
                .join(", ") || "—",
              composition(order.id),
              formatMoney(orderTotal(order.id)),
            ])}
            empty="Закрытых заказов в этой смене нет."
          />
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

function Table({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="p-8 text-center text-sm text-slate-600">{empty}</p>;
  }

  return (
    <table className="w-full text-left">
      <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wider text-slate-600">
        <tr>
          {columns.map((column, index) => (
            <th
              key={column}
              className={cn(
                "px-5 py-3 font-medium",
                index === columns.length - 1 && "text-right",
              )}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-900">
        {rows.map((row) => (
          // Первая ячейка — номер чека или заказа: он уникален в пределах
          // вкладки, поэтому годится ключом.
          <tr key={row.join("|")}>
            {row.map((cell, index) => (
              <td
                key={columns[index]}
                className={cn(
                  "px-5 py-3 text-sm text-slate-300",
                  index === row.length - 1 &&
                    "text-right font-bold tabular-nums text-slate-100",
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
        "min-h-16 px-6 text-sm font-black tracking-wide transition",
        active ? "bg-orange-500 text-white" : "text-slate-400 active:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
