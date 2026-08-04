import { useMemo, useState } from "react";
import type { UUID } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { useSession } from "../app/session";
import { DISCOUNT_TYPES } from "../data/discount-types";
import { PAYMENT_TYPES, findPaymentType } from "../data/payment-types";
import { findMenuItem } from "../state/menu";
import { useOrders, type PaymentDraft } from "../state/orders";
import { useShifts } from "../state/shifts";
import { useTables } from "../state/tables";
import {
  compareMoney,
  formatMoney,
  fromMinor,
  multiplyMoney,
  toMinor,
  ZERO_MONEY,
} from "../lib/money";
import { splitPayment } from "../lib/payment-split";

/**
 * Экран оплаты заказа.
 *
 * Оплата здесь — **список строк**, а не выбор одного способа: гость платит
 * часть картой, часть наличными, и каждая часть отдельный факт. Одно поле
 * «способ оплаты» заставляло бы выбирать, какой из двух платежей настоящий.
 *
 * Главная тонкость экрана — разница между «внесено» и «суммой платежа».
 * Гость даёт 1000 за чек на 700: внесено 1000, платёж 700, сдача 300.
 * Если записать платёж на 1000, выручка смены окажется завышена ровно
 * на сумму всех сдач за день.
 */

/** Номиналы купюр. Ими набирают то, что дал гость, а не сумму чека. */
const DENOMINATIONS = [50, 100, 200, 500, 1000, 2000, 5000];

interface Line {
  id: string;
  paymentTypeId: UUID;
  /** Сколько положено на стол по этой строке. Может быть больше долга. */
  tendered: string;
}

export function PaymentScreen({ orderId }: { orderId: UUID }) {
  const { back } = useNavigation();
  const { staff } = useSession();
  const { cashShift } = useShifts();
  const {
    state,
    itemsOfOrder,
    orderTotals,
    discountsOfOrder,
    applyDiscount,
    removeDiscount,
    payOrder,
  } = useOrders();
  const { can, isPossible, authorize } = useAccess();
  const { tables } = useTables();

  const order = state.orders[orderId];
  const items = itemsOfOrder(orderId).filter((item) => item.status !== "voided");
  const totals = order
    ? orderTotals(orderId)
    : { subtotal: ZERO_MONEY, discount: ZERO_MONEY, surcharge: ZERO_MONEY, total: ZERO_MONEY };
  const total = totals.total;
  const appliedDiscounts = discountsOfOrder(orderId);

  const [lines, setLines] = useState<Line[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDiscountOpen, setDiscountOpen] = useState(false);

  /**
   * Скидку применяем до набора оплаты. Иначе строки, уже погасившие старый
   * итог, останутся с прежними суммами: гость доплатит или переплатит,
   * а расхождение вылезет при сверке кассы.
   */
  const handleDiscount = (discountTypeId: string, needsApproval: boolean) => {
    setDiscountOpen(false);
    if (!needsApproval && can("order.discount")) {
      applyDiscount(orderId, discountTypeId);
      return;
    }
    authorize("order.discount", `Заказ № ${order?.number ?? "—"}`).then(
      (approval) =>
        applyDiscount(orderId, discountTypeId, approval.approvedBy?.id ?? null),
      // Отказались подтверждать — штатный путь, делать нечего.
      () => undefined,
    );
  };

  // Вся денежная арифметика экрана — в `lib/payment-split.ts`: она проверяется
  // тестами, а не кликами по кассе.
  const { applied, tendered, due, change, isSettled } = useMemo(
    () => splitPayment(total, lines),
    [total, lines],
  );

  /**
   * Сдачу выдают только из ящика. Карта её не даёт: переплата по карте — это
   * не сдача, а лишний списанный рубль, поэтому безналичные строки ограничены
   * остатком долга.
   */
  const canOverpay = (paymentTypeId: UUID) =>
    findPaymentType(paymentTypeId)?.kind === "cash";

  const addLine = (paymentTypeId: UUID) => {
    const id = crypto.randomUUID();
    // Новая строка сразу берёт на себя весь остаток: в большинстве чеков
    // способ один, и лишнего ввода быть не должно.
    setLines((prev) => [...prev, { id, paymentTypeId, tendered: dueFor(prev) }]);
    setActiveId(id);
  };

  const dueFor = (current: Line[]): string => {
    const takenMinor = current.reduce(
      (acc, line) => acc + toMinor(line.tendered),
      0,
    );
    return fromMinor(Math.max(0, toMinor(total) - takenMinor));
  };

  const setActiveAmount = (next: string) => {
    setLines((prev) =>
      prev.map((line) =>
        line.id === activeId ? { ...line, tendered: next } : line,
      ),
    );
  };

  const bumpActive = (rubles: number) => {
    const line = lines.find((item) => item.id === activeId);
    if (!line) return;
    const nextMinor = toMinor(line.tendered) + rubles * 100;
    const capMinor = canOverpay(line.paymentTypeId)
      ? nextMinor
      : Math.min(nextMinor, toMinor(total));
    setActiveAmount(fromMinor(capMinor));
  };

  const pushDigit = (digit: string) => {
    const line = lines.find((item) => item.id === activeId);
    if (!line) return;
    const nextMinor = toMinor(line.tendered) * 10 + Number(digit);
    if (nextMinor > 99_999_999) return;
    const capMinor = canOverpay(line.paymentTypeId)
      ? nextMinor
      : Math.min(nextMinor, toMinor(total));
    setActiveAmount(fromMinor(capMinor));
  };

  const dropDigit = () => {
    const line = lines.find((item) => item.id === activeId);
    if (!line) return;
    setActiveAmount(fromMinor(Math.floor(toMinor(line.tendered) / 10)));
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handlePay = () => {
    if (!isSettled) return;
    const drafts: PaymentDraft[] = lines
      .map<PaymentDraft>((line) => ({
        paymentTypeId: line.paymentTypeId,
        amount: applied.get(line.id) ?? ZERO_MONEY,
        // Внесённое сохраняем только там, где оно отличается от платежа,
        // то есть у наличных со сдачей: у карты это всегда одна и та же сумма.
        tendered: canOverpay(line.paymentTypeId) ? line.tendered : null,
      }))
      // Строка, из которой в оплату не ушло ничего, — это след отменённого
      // ввода, а не платёж. В чек её класть незачем.
      .filter((draft) => compareMoney(draft.amount, ZERO_MONEY) > 0);

    payOrder(orderId, drafts);
    back();
  };

  if (!order) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Заказ не найден
      </div>
    );
  }

  const tableLabel = order.tableId
    ? (tables.find((table) => table.id === order.tableId)?.label ?? "—")
    : "Прилавок";

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-baseline gap-6 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <h1 className="text-lg font-black tracking-wide">
          Оплата заказа №{order.number}
        </h1>
        <span className="text-sm text-slate-500">
          Открыт {formatTime(order.createdAt)}
        </span>
        <span className="text-sm text-slate-500">
          Официант: {staff?.fullName ?? "—"}
        </span>
        <span className="text-sm text-slate-500">Стол: {tableLabel}</span>
      </header>

      {!cashShift && (
        <p className="shrink-0 border-b border-amber-900/60 bg-amber-950/40 px-5 py-3 text-sm text-amber-300">
          Кассовая смена не открыта — чек не к чему привязать. Откройте смену
          на экране кассы.
        </p>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Состав чека */}
        <section className="flex w-80 shrink-0 flex-col border-r border-slate-800 bg-slate-950 xl:w-96">
          <ul className="min-h-0 flex-1 divide-y divide-slate-900 overflow-y-auto">
            {items.map((item) => {
              const menuItem = findMenuItem(item.menuItemId);
              return (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-8 shrink-0 text-sm tabular-nums text-slate-500">
                    {item.quantity}
                  </span>
                  <span className="flex-1 text-sm text-slate-200">
                    {menuItem?.name ?? "—"}
                  </span>
                  <span className="text-sm tabular-nums text-slate-400">
                    {menuItem
                      ? formatMoney(multiplyMoney(menuItem.price, item.quantity))
                      : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
          {/* Применённые скидки видно строками: «Скидка 100 ₽» без указания,
              откуда она взялась, при разборе смены ничего не объясняет. */}
          {appliedDiscounts.length > 0 && (
            <ul className="shrink-0 divide-y divide-slate-900 border-t border-slate-800">
              {appliedDiscounts.map((discount) => (
                <li
                  key={discount.id}
                  className="flex min-h-12 items-center gap-2 px-5"
                >
                  <span className="flex-1 truncate text-xs text-slate-400">
                    {discount.label}
                  </span>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      discount.kind === "discount"
                        ? "text-rose-400"
                        : "text-emerald-400",
                    )}
                  >
                    {discount.kind === "discount" ? "−" : "+"}
                    {formatMoney(discount.amount)}
                  </span>
                  <button
                    type="button"
                    aria-label="Убрать скидку"
                    onClick={() => removeDiscount(discount.id)}
                    className="flex h-11 w-11 items-center justify-center text-slate-600 transition active:bg-slate-800"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <dl className="shrink-0 divide-y divide-slate-900 border-t border-slate-800">
            <SumRow label="Подытог" value={formatMoney(totals.subtotal)} />
            <SumRow label="Скидка" value={formatMoney(totals.discount)} />
            <SumRow label="Надбавка" value={formatMoney(totals.surcharge)} />
            <SumRow label="Итого" value={formatMoney(totals.total)} strong />
          </dl>

          <div className="shrink-0 border-t border-slate-800 p-3">
            <button
              type="button"
              // Право побиваемое: нет своего — ведём в подтверждение, а не гасим.
              disabled={!isPossible("order.discount") || lines.length > 0}
              onClick={() => setDiscountOpen(true)}
              className="min-h-14 w-full rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-slate-300 transition active:bg-slate-700 disabled:opacity-40"
            >
              {lines.length > 0 ? "Сначала уберите строки оплаты" : "Скидка / надбавка"}
            </button>
          </div>
        </section>

        {/* Строки оплаты */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-slate-800">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-3">
            <span className="text-sm uppercase tracking-wider text-slate-500">
              К оплате
            </span>
            <span className="text-xl font-black tabular-nums text-slate-100">
              {formatMoney(total)}
            </span>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {lines.map((line) => {
              const type = findPaymentType(line.paymentTypeId);
              // Две соседние кнопки, а не вложенные: выбор строки и её удаление
              // — разные действия, и цель касания у крестика должна быть своей,
              // а не куском строки.
              return (
                <li
                  key={line.id}
                  className={cn(
                    "flex items-center border-b border-slate-800",
                    line.id === activeId && "bg-orange-500/15",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(line.id)}
                    className="flex min-h-16 flex-1 items-center gap-3 px-5 text-left transition active:bg-slate-800"
                  >
                    <span className="flex-1 text-sm font-bold text-slate-200">
                      {type?.label ?? "—"}
                    </span>
                    <span className="text-lg tabular-nums text-slate-100">
                      {formatMoney(line.tendered)}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Убрать строку"
                    onClick={() => removeLine(line.id)}
                    className="flex min-h-16 w-14 items-center justify-center text-slate-500 transition active:bg-slate-700"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
            {lines.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-slate-600">
                Выберите способ оплаты справа
              </li>
            )}
          </ul>

          <dl className="shrink-0 divide-y divide-slate-800 border-t border-slate-800 bg-slate-900">
            <SumRow label="Внесено" value={formatMoney(tendered)} />
            <SumRow label="Внести" value={formatMoney(due)} />
            <SumRow
              label="Сдача"
              value={formatMoney(change)}
              strong={compareMoney(change, ZERO_MONEY) > 0}
            />
          </dl>
        </section>

        {/* Типы оплаты и ввод суммы */}
        <section className="flex w-[26rem] shrink-0 flex-col">
          <div className="grid shrink-0 grid-cols-2 border-b border-slate-800">
            {[...PAYMENT_TYPES]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => addLine(type.id)}
                  className="min-h-20 border-b border-r border-slate-800 px-3 text-sm font-bold text-slate-300 transition active:bg-slate-700"
                >
                  {type.label}
                </button>
              ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-3">
            <div className="mb-3 shrink-0 rounded-xl border border-slate-800 bg-slate-950 p-4 text-right">
              <div className="text-xs uppercase tracking-wider text-slate-600">
                {activeLabel(lines, activeId)}
              </div>
              <div className="text-3xl font-black tabular-nums text-slate-100">
                {formatMoney(activeAmount(lines, activeId))}
              </div>
            </div>

            <div className="mb-2 grid shrink-0 grid-cols-4 gap-2">
              {DENOMINATIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={activeId === null}
                  onClick={() => bumpActive(value)}
                  className="min-h-14 rounded-lg border border-slate-700 bg-slate-800 text-sm font-bold tabular-nums text-slate-300 transition active:bg-slate-700 disabled:opacity-40"
                >
                  +{value}
                </button>
              ))}
              <button
                type="button"
                disabled={activeId === null}
                onClick={() => setActiveAmount(dueFor(lines.filter((l) => l.id !== activeId)))}
                className="min-h-14 rounded-lg border border-emerald-800 bg-emerald-950/60 text-xs font-bold text-emerald-300 transition active:bg-emerald-900 disabled:opacity-40"
              >
                Точная сумма
              </button>
            </div>

            <div className="grid flex-1 grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <NumKey
                  key={digit}
                  disabled={activeId === null}
                  onClick={() => pushDigit(digit)}
                >
                  {digit}
                </NumKey>
              ))}
              <NumKey disabled={activeId === null} onClick={() => setActiveAmount(ZERO_MONEY)}>
                C
              </NumKey>
              <NumKey disabled={activeId === null} onClick={() => pushDigit("0")}>
                0
              </NumKey>
              <NumKey disabled={activeId === null} onClick={dropDigit}>
                ⌫
              </NumKey>
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
        <button
          type="button"
          disabled={!isSettled || !cashShift}
          onClick={handlePay}
          className="min-h-16 min-w-64 bg-emerald-600 px-8 text-lg font-black tracking-wide text-white transition active:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600"
        >
          Оплатить
        </button>
      </footer>

      {isDiscountOpen && (
        <DiscountDialog
          onPick={handleDiscount}
          onCancel={() => setDiscountOpen(false)}
        />
      )}
    </div>
  );
}

/** Выбор скидки из справочника. Свободный ввод сюда не входит намеренно:
 *  скидка «от руки» не даёт свести отчёт «кто и за что скидывал». */
function DiscountDialog({
  onPick,
  onCancel,
}: {
  onPick: (discountTypeId: string, needsApproval: boolean) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-[30rem] space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="text-center text-lg font-black text-slate-200">
          Скидка и надбавка
        </h3>
        <div className="space-y-2">
          {[...DISCOUNT_TYPES]
            .filter((type) => type.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => onPick(type.id, type.requiresApproval)}
                className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4 text-left transition active:bg-slate-700"
              >
                <span className="flex-1 text-sm font-bold text-slate-200">
                  {type.label}
                </span>
                {type.requiresApproval && (
                  <span className="rounded-md bg-amber-950/60 px-2 py-1 text-xs font-bold text-amber-300">
                    с подтверждением
                  </span>
                )}
                <span
                  className={cn(
                    "text-sm font-black tabular-nums",
                    type.kind === "discount" ? "text-rose-400" : "text-emerald-400",
                  )}
                >
                  {type.kind === "discount" ? "−" : "+"}
                  {type.mode === "percent" ? `${type.value}%` : type.value}
                </span>
              </button>
            ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-14 w-full rounded-xl border border-slate-700 text-sm font-bold text-slate-300 transition active:bg-slate-800"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

function NumKey({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-14 rounded-lg border border-slate-700 bg-slate-800 text-xl font-bold text-slate-200 transition active:bg-slate-700 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function SumRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between px-5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          strong
            ? "text-lg font-black text-emerald-400"
            : "text-sm text-slate-300",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function activeAmount(lines: Line[], activeId: string | null): string {
  return lines.find((line) => line.id === activeId)?.tendered ?? ZERO_MONEY;
}

function activeLabel(lines: Line[], activeId: string | null): string {
  const line = lines.find((item) => item.id === activeId);
  return line ? (findPaymentType(line.paymentTypeId)?.label ?? "—") : "Сумма";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
