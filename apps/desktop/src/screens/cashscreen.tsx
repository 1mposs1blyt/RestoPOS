import { useMemo, useState } from "react";
import type { CashOperationKind } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { useSession } from "../app/session";
import { useOrders } from "../state/orders";
import { useShifts } from "../state/shifts";
import { cashShiftTotals } from "../lib/cash-totals";
import { formatMoney, fromMinor, toMinor, ZERO_MONEY } from "../lib/money";
import {
  fiscalCloseShift,
  fiscalOpenShift,
  fiscalXReport,
  type ZReport,
} from "../lib/fiscal";
import { openCashDrawer } from "../lib/printer";
import { useDevices } from "../state/devices";

/**
 * Кассовая смена и денежный ящик.
 *
 * Движения по ящику — отдельный класс операций, не заказы и не платежи:
 * размен утром и инкассация вечером не связаны ни с одним чеком, но обязаны
 * сходиться с наличными в ящике. Без них X-отчёт не бьётся, и непонятно,
 * недостача это или невнесённый размен.
 *
 * Все суммы считает `lib/cash-totals.ts` — чистой функцией под тестами.
 * Здесь только ввод и показ.
 */
export function CashScreen() {
  const { can } = useAccess();
  const { back } = useNavigation();
  const { cashShift, openCashShift, closeCashShift, recordCash, state } =
    useShifts();
  const { state: orders } = useOrders();
  const { drawerDevice, kkm } = useDevices();
  const { staff } = useSession();

  const [dialog, setDialog] = useState<CashOperationKind | null>(null);
  const [floatDraft, setFloatDraft] = useState("5000.00");
  const [notice, setNotice] = useState<string | null>(null);
  /** Последний отчёт ККТ. Показывается рядом со сводом кассы для сверки. */
  const [zReport, setZReport] = useState<ZReport | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * ККМ не заведена — работаем без фискализации, как и на экране оплаты
   * (`state/checkout.tsx`). Отчёты тогда чисто кассовые: сверять их не с чем.
   */
  const isNonFiscal = kkm === undefined;

  const handleXReport = async () => {
    if (isNonFiscal) {
      setNotice("ККМ не заведена — X-отчёт печатать нечем");
      return;
    }
    setBusy(true);
    try {
      setZReport(await fiscalXReport());
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "X-отчёт не снялся");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Z-отчёт закрывает смену **сначала в ККТ, потом у нас**.
   *
   * Обратный порядок означал бы кассовую смену, закрытую в интерфейсе,
   * при открытой смене в фискальном регистраторе: следующий чек уехал бы
   * в старую смену ККТ, и Z-отчёт следующего дня не сошёлся бы ни с чем.
   * Не закрылась ККТ — не закрываем и мы.
   */
  const handleCloseShift = async () => {
    if (isNonFiscal) {
      closeCashShift();
      return;
    }
    setBusy(true);
    try {
      setZReport(await fiscalCloseShift(staff?.fullName ?? "—"));
      closeCashShift();
      setNotice(null);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Смена в ККТ не закрыта: ${error.message}`
          : "Смена в ККТ не закрыта",
      );
    } finally {
      setBusy(false);
    }
  };

  /**
   * Открытие смены — тем же порядком, зеркально: сначала ККТ.
   *
   * Кассовая смена без открытой смены в ККТ — это заказы, которые нельзя
   * пробить: касса будет молча принимать оплату и отказывать на чеке.
   */
  const handleOpenShift = async () => {
    if (isNonFiscal) {
      openCashShift(floatDraft);
      return;
    }
    setBusy(true);
    try {
      await fiscalOpenShift(staff?.fullName ?? "—");
      openCashShift(floatDraft);
      setNotice(null);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Смена в ККТ не открыта: ${error.message}`
          : "Смена в ККТ не открыта",
      );
    } finally {
      setBusy(false);
    }
  };

  const totals = useMemo(() => {
    if (!cashShift) return null;
    return cashShiftTotals(
      cashShift,
      Object.values(orders.payments),
      Object.values(state.cashOperations),
    );
  }, [cashShift, orders.payments, state.cashOperations]);

  const operations = useMemo(
    () =>
      Object.values(state.cashOperations)
        .filter((op) => op.cashShiftId === cashShift?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.cashOperations, cashShift],
  );

  if (!cashShift) {
    return (
      <ClosedShift
        canOpen={can("shift.open") && !busy}
        value={floatDraft}
        onChange={setFloatDraft}
        onOpen={handleOpenShift}
        onBack={back}
        notice={notice}
      />
    );
  }

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-baseline gap-6 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <h1 className="text-lg font-black tracking-wide">
          Кассовая смена №{cashShift.number}
        </h1>
        <span className="text-sm text-slate-500">
          Открыта {formatDateTime(cashShift.openedAt)}
        </span>
        <span className="text-sm text-slate-500">
          Размен: {formatMoney(cashShift.openingFloat)}
        </span>
      </header>

      {notice && (
        <button
          type="button"
          onClick={() => setNotice(null)}
          className="shrink-0 border-b border-amber-900/60 bg-amber-950/40 px-5 py-3 text-left text-sm text-amber-300"
        >
          {notice} · нажмите, чтобы скрыть
        </button>
      )}

      <div className="flex min-h-0 flex-1">
        <section className="min-h-0 w-96 shrink-0 overflow-y-auto border-r border-slate-800">
          <h2 className="px-5 pt-4 text-xs uppercase tracking-wider text-slate-600">
            Итог по смене
          </h2>
          <dl className="divide-y divide-slate-900">
            {totals?.byPaymentType.map((row) => (
              <SumRow
                key={row.paymentTypeId}
                label={row.label}
                value={formatMoney(row.amount)}
              />
            ))}
            <SumRow label="Выручка" value={formatMoney(totals?.revenue ?? ZERO_MONEY)} strong />
            <SumRow label="Чеков" value={String(totals?.ordersCount ?? 0)} />
            <SumRow
              label="Средний чек"
              value={totals?.averageCheck ? formatMoney(totals.averageCheck) : "—"}
            />
            <SumRow label="Внесено" value={formatMoney(totals?.deposits ?? ZERO_MONEY)} />
            <SumRow label="Изъято" value={formatMoney(totals?.withdrawals ?? ZERO_MONEY)} />
            <SumRow
              label="Ожидается в ящике"
              value={formatMoney(totals?.expectedCash ?? ZERO_MONEY)}
              strong
            />
          </dl>
        </section>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="grid shrink-0 grid-cols-2 gap-3 p-4">
            <Action
              label="Внести деньги"
              disabled={!can("cash.deposit")}
              onClick={() => setDialog("deposit")}
            />
            <Action
              label="Изъять деньги"
              disabled={!can("cash.withdraw")}
              onClick={() => setDialog("withdrawal")}
            />
            <Action
              label="Инкассация"
              disabled={!can("cash.withdraw")}
              onClick={() => setDialog("collection")}
            />
            <Action
              label="Открыть денежный ящик"
              disabled={!can("cash.drawer")}
              onClick={() => {
                /*
                 * Ящик открывает устройство, у которого он включён: физически
                 * он подключён шлейфом к чековому принтеру или ККМ и
                 * открывается их же командой. Отдельного «драйвера ящика»
                 * не существует.
                 */
                if (!drawerDevice) {
                  setNotice(
                    "Нет запущенного устройства с денежным ящиком — проверьте настройку оборудования",
                  );
                  return;
                }
                openCashDrawer(drawerDevice.port, 9100).catch(
                  (error: unknown) =>
                    setNotice(
                      error instanceof Error ? error.message : "Ящик не открылся",
                    ),
                );
              }}
            />
            <Action
              label="Печать X-отчёта"
              disabled={!can("report.x") || busy}
              onClick={handleXReport}
            />
            <Action
              label="Закрыть смену (Z-отчёт)"
              tone="danger"
              disabled={!can("shift.close") || busy}
              onClick={handleCloseShift}
            />
          </div>

          {/* Свод ККТ рядом со сводом кассы. Смотреть их порознь бессмысленно:
              вопрос всегда один — сходится ли наличность в ящике с тем,
              что видел фискальный регистратор. */}
          {zReport && (
            <dl className="shrink-0 divide-y divide-slate-900 border-t border-slate-800 bg-slate-950/60">
              <SumRow
                label={`ККТ, смена №${zReport.shiftNumber} · чеков`}
                value={String(zReport.receipts)}
              />
              <SumRow
                label="Наличными по ККТ"
                value={formatMoney(fromMinor(zReport.cashTotal))}
              />
              <SumRow
                label="Безналом по ККТ"
                value={formatMoney(fromMinor(zReport.cashlessTotal))}
              />
              {zReport.refundsTotal > 0 && (
                <SumRow
                  label="Возвраты по ККТ"
                  value={formatMoney(fromMinor(zReport.refundsTotal))}
                />
              )}
              <SumRow
                label="Расхождение с ящиком"
                value={formatMoney(
                  fromMinor(
                    toMinor(totals?.expectedCash ?? ZERO_MONEY) -
                      zReport.cashTotal -
                      toMinor(cashShift.openingFloat),
                  ),
                )}
                strong
              />
            </dl>
          )}

          <h2 className="shrink-0 border-t border-slate-800 px-5 py-3 text-xs uppercase tracking-wider text-slate-600">
            Движения по ящику
          </h2>
          <ul className="min-h-0 flex-1 divide-y divide-slate-900 overflow-y-auto">
            {operations.map((operation) => (
              <li key={operation.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-20 shrink-0 text-xs text-slate-600">
                  {formatTime(operation.createdAt)}
                </span>
                <span className="flex-1 text-sm text-slate-300">
                  {OPERATION_LABELS[operation.kind]}
                  {operation.comment && (
                    <span className="text-slate-600"> · {operation.comment}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    isIncoming(operation.kind) ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {isIncoming(operation.kind) ? "+" : "−"}
                  {formatMoney(operation.amount)}
                </span>
              </li>
            ))}
            {operations.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-slate-600">
                Движений не было
              </li>
            )}
          </ul>
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

      {dialog && (
        <AmountDialog
          title={OPERATION_LABELS[dialog]}
          onCancel={() => setDialog(null)}
          onConfirm={(amount, comment) => {
            recordCash(dialog, amount, comment);
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

const OPERATION_LABELS: Record<CashOperationKind, string> = {
  deposit: "Внесение",
  withdrawal: "Изъятие",
  opening_float: "Размен",
  collection: "Инкассация",
};

/** Приходные операции увеличивают наличность в ящике, расходные — уменьшают. */
function isIncoming(kind: CashOperationKind): boolean {
  return kind === "deposit" || kind === "opening_float";
}

function ClosedShift({
  canOpen,
  value,
  onChange,
  onOpen,
  onBack,
  notice,
}: {
  canOpen: boolean;
  value: string;
  onChange: (next: string) => void;
  onOpen: () => void;
  onBack: () => void;
  /** Почему смена не открылась. Чаще всего — молчащая ККТ. */
  notice: string | null;
}) {
  return (
    <div className="flex h-full w-full select-none items-center justify-center p-8">
      <div className="w-96 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center">
        <h2 className="text-lg font-black text-slate-200">
          Кассовая смена закрыта
        </h2>
        <p className="text-sm text-slate-500">
          Пока смена не открыта, чек не к чему привязать: у него не будет
          ни номера смены, ни места в Z-отчёте.
        </p>
        {notice && (
          <p className="rounded-lg bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
            {notice}
          </p>
        )}
        <label className="block text-left">
          <span className="text-xs uppercase tracking-wider text-slate-600">
            Разменный фонд
          </span>
          <input
            inputMode="decimal"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="mt-1 min-h-14 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-right text-xl tabular-nums text-slate-100"
          />
        </label>
        <button
          type="button"
          disabled={!canOpen}
          onClick={onOpen}
          className="min-h-14 w-full rounded-xl bg-emerald-600 text-sm font-black text-white transition active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
        >
          Открыть смену
        </button>
        {!canOpen && (
          <p className="text-xs text-slate-600">Смену открывает кассир</p>
        )}
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 w-full text-sm text-slate-500"
        >
          Назад
        </button>
      </div>
    </div>
  );
}

/** Ввод суммы движения. Цифры набираются в копейках — как на весах и ФР. */
function AmountDialog({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: (amount: string, comment: string) => void;
  onCancel: () => void;
}) {
  const [minor, setMinor] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-96 space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="text-center text-lg font-black text-slate-200">{title}</h3>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-right text-3xl font-black tabular-nums text-slate-100">
          {formatMoney(fromMinor(minor))}
        </div>
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Комментарий"
          className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-200 placeholder:text-slate-600"
        />
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => setMinor((prev) => Math.min(prev * 10 + Number(digit), 99_999_999))}
              className="min-h-14 rounded-lg border border-slate-700 bg-slate-800 text-xl font-bold text-slate-200 transition active:bg-slate-700"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMinor(0)}
            className="min-h-14 rounded-lg border border-slate-700 bg-slate-800 text-xl font-bold text-slate-200 transition active:bg-slate-700"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => setMinor((prev) => Math.min(prev * 10, 99_999_999))}
            className="min-h-14 rounded-lg border border-slate-700 bg-slate-800 text-xl font-bold text-slate-200 transition active:bg-slate-700"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setMinor((prev) => Math.floor(prev / 10))}
            className="min-h-14 rounded-lg border border-slate-700 bg-slate-800 text-xl font-bold text-slate-200 transition active:bg-slate-700"
          >
            ⌫
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-14 rounded-xl border border-slate-700 text-sm font-bold text-slate-300 transition active:bg-slate-800"
          >
            Отмена
          </button>
          <button
            type="button"
            // Движение на ноль — это не операция, а промах по кнопке.
            disabled={minor === 0}
            onClick={() => onConfirm(fromMinor(minor), comment.trim())}
            className="min-h-14 rounded-xl bg-emerald-600 text-sm font-black text-white transition active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
          >
            Провести
          </button>
        </div>
      </div>
    </div>
  );
}

function Action({
  label,
  onClick,
  disabled,
  tone,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-20 rounded-xl border px-4 text-sm font-bold transition active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        tone === "danger"
          ? "border-rose-900/60 bg-rose-950/40 text-rose-300"
          : "border-slate-700 bg-slate-800 text-slate-300",
      )}
    >
      {label}
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
          strong ? "text-lg font-black text-emerald-400" : "text-sm text-slate-300",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
