import { useMemo, useState } from "react";
import type { Order } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { findStaff } from "../data/session-source";
import { formatMoney } from "../lib/money";
import { refundableTotal, refundedTotal } from "../lib/refund";
import { useCheckout } from "../state/checkout";
import { findMenuItem } from "../state/menu";
import { useOrders } from "../state/orders";
import { useShifts } from "../state/shifts";
import { CheckoutOverlay } from "./checkoutoverlay";

/**
 * Возврат по чеку.
 *
 * Возврат делают по закрытому чеку, а не «по товару из воздуха»: гость
 * приходит с чеком, кассир находит его в смене и возвращает деньги тем же
 * способом, каким они пришли. Отсюда и устройство экрана — список чеков смены
 * слева, состав выбранного справа.
 *
 * Возвращается **чек целиком**: почему не по позициям — в `state/checkout.tsx`,
 * там же живёт порядок операций (деньги гостю → чек возврата прихода →
 * встречные строки в кассе).
 *
 * Право `payment.refund` побиваемое: у официанта его нет, но возврат он
 * оформляет с подтверждением кассира или менеджера — иначе гостя с чеком
 * отправляли бы искать, кто в зале главный.
 */
export function RefundScreen() {
  const { authorize } = useAccess();
  const { back } = useNavigation();
  const { cashShift } = useShifts();
  const { state, itemsOfOrder, paymentsOfOrder, orderTotal } = useOrders();
  const { refund, status, isBusy, reset } = useCheckout();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /*
   * Чеки текущей кассовой смены, свежие сверху: возврат делают по последнему
   * чеку, а не по вчерашнему. Чек прошлой смены возвращается по кассовому
   * ордеру, и делать вид, что касса это умеет, нельзя.
   */
  const receipts = useMemo(
    () =>
      Object.values(state.orders)
        .filter(
          (order) =>
            order.status === "paid" &&
            order.cashShiftNumber === (cashShift?.number ?? null),
        )
        .sort((a, b) => (b.receiptNumber ?? 0) - (a.receiptNumber ?? 0)),
    [state.orders, cashShift],
  );

  const selected = selectedId ? state.orders[selectedId] : undefined;
  const payments = selected ? paymentsOfOrder(selected.id) : [];
  const toReturn = refundableTotal(payments);
  const alreadyReturned = refundedTotal(payments);
  const isReturned = toReturn === "0.00";

  const handleRefund = async (order: Order) => {
    setNotice(null);
    try {
      await authorize("payment.refund", `Чек №${order.receiptNumber ?? "—"}`);
    } catch {
      // Подтверждение отменили — штатный путь, молча остаёмся на месте.
      return;
    }

    const outcome = await refund(order.id);
    if (outcome.stage === "done") {
      setNotice(
        `Возврат по чеку №${order.receiptNumber ?? "—"} проведён: ${formatMoney(toReturn)}`,
      );
      reset();
    }
    // Остальные исходы показывает `CheckoutOverlay`: у «требует человека»
    // свой текст и своя кнопка, дублировать их строкой сверху незачем.
  };

  if (!cashShift) {
    return (
      <Empty
        title="Кассовая смена закрыта"
        text="Возврат проводится внутри смены: встречной строке нужны её номер и место в Z-отчёте. Откройте смену на экране кассы."
        onBack={back}
      />
    );
  }

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-baseline gap-6 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <h1 className="text-lg font-black tracking-wide">Возврат по чеку</h1>
        <span className="text-sm text-slate-500">
          Смена №{cashShift.number}, чеков: {receipts.length}
        </span>
      </header>

      {notice && (
        <button
          type="button"
          onClick={() => setNotice(null)}
          className="min-h-11 shrink-0 border-b border-emerald-900/60 bg-emerald-950/40 px-5 text-left text-sm text-emerald-300"
        >
          {notice} · нажмите, чтобы скрыть
        </button>
      )}

      <div className="flex min-h-0 flex-1">
        <section className="min-h-0 w-80 shrink-0 overflow-y-auto border-r border-slate-800">
          {receipts.length === 0 && (
            <p className="p-6 text-sm text-slate-600">
              В этой смене закрытых чеков ещё нет.
            </p>
          )}
          {receipts.map((order) => {
            const orderPayments = paymentsOfOrder(order.id);
            const returned = refundableTotal(orderPayments) === "0.00";
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedId(order.id)}
                className={cn(
                  "flex min-h-16 w-full flex-col justify-center gap-1 border-b border-slate-900 px-5 text-left transition active:bg-slate-800",
                  order.id === selectedId && "bg-slate-800",
                )}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <b className="text-sm text-slate-100">
                    Чек №{order.receiptNumber ?? "—"}
                  </b>
                  <span className="text-sm font-bold tabular-nums text-slate-300">
                    {formatMoney(orderTotal(order.id))}
                  </span>
                </span>
                <span className="flex items-baseline justify-between gap-3 text-xs text-slate-500">
                  <span>
                    Заказ №{order.number} · {formatTime(order.createdAt)}
                  </span>
                  {returned && (
                    <span className="font-bold text-amber-400">возвращён</span>
                  )}
                </span>
              </button>
            );
          })}
        </section>

        <section className="flex min-h-0 flex-1 flex-col">
          {!selected && (
            <p className="p-8 text-sm text-slate-600">
              Выберите чек слева — возвращается он целиком.
            </p>
          )}

          {selected && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <dl className="divide-y divide-slate-900 border-b border-slate-800">
                  {/* В режиме узла сотрудники приезжают с него, и локальный
                      справочник их не знает. Показывать вместо имени UUID
                      незачем: кассиру он ничего не говорит. */}
                  <Row
                    label="Официант"
                    value={findStaff(selected.waiterId)?.fullName ?? "—"}
                  />
                  <Row label="Открыт" value={formatTime(selected.createdAt)} />
                  <Row label="Гостей" value={String(selected.guestCount ?? 1)} />
                  <Row label="Итог чека" value={formatMoney(orderTotal(selected.id))} strong />
                </dl>

                <h2 className="px-5 pt-4 text-xs uppercase tracking-wider text-slate-600">
                  Состав
                </h2>
                <ul className="divide-y divide-slate-900">
                  {itemsOfOrder(selected.id)
                    .filter(
                      (item) => item.status !== "voided" && item.status !== "split",
                    )
                    .map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline justify-between gap-3 px-5 py-2 text-sm text-slate-300"
                      >
                        <span>{findMenuItem(item.menuItemId)?.name ?? "Позиция"}</span>
                        <span className="tabular-nums text-slate-500">
                          ×{item.quantity}
                        </span>
                      </li>
                    ))}
                </ul>

                <h2 className="px-5 pt-4 text-xs uppercase tracking-wider text-slate-600">
                  Оплата
                </h2>
                <ul className="divide-y divide-slate-900">
                  {payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex items-baseline justify-between gap-3 px-5 py-2 text-sm"
                    >
                      {/* Встречная строка видна отдельной строкой, а не правкой
                          исходной: возврат — самостоятельный факт (инвариант №6). */}
                      <span
                        className={
                          payment.refundOf === null ? "text-slate-300" : "text-amber-400"
                        }
                      >
                        {payment.refundOf === null
                          ? payment.label
                          : `${payment.label} · возврат`}
                      </span>
                      <span className="tabular-nums text-slate-400">
                        {payment.refundOf === null ? "" : "−"}
                        {formatMoney(payment.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <footer className="shrink-0 border-t border-slate-800 bg-slate-900 p-4">
                {isReturned ? (
                  <p className="text-sm text-amber-400">
                    Чек уже возвращён на {formatMoney(alreadyReturned)}.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={isBusy || status.stage === "acquiring"}
                    onClick={() => handleRefund(selected)}
                    className="min-h-16 w-full rounded-xl bg-amber-600 text-base font-black text-white transition active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
                  >
                    Вернуть {formatMoney(toReturn)}
                  </button>
                )}
              </footer>
            </>
          )}
        </section>
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

      <CheckoutOverlay />
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 py-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          strong ? "text-base font-black text-slate-100" : "text-sm text-slate-300",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Empty({
  title,
  text,
  onBack,
}: {
  title: string;
  text: string;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full w-full select-none flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-black text-slate-100">{title}</h1>
      <p className="max-w-md text-sm leading-snug text-slate-500">{text}</p>
      <button
        type="button"
        onClick={onBack}
        className="min-h-14 w-64 rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-slate-300 transition active:scale-95"
      >
        Назад
      </button>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
