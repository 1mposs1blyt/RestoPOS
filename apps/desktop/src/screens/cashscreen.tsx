import { useCallback, useEffect, useMemo, useState } from "react";
import type { CashOperationKind } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { useSession } from "../app/session";
import { FunctionBar, FunctionKey } from "../components/functionbar";
import { useOrders } from "../state/orders";
import { useShifts } from "../state/shifts";
import { cashShiftTotals } from "../lib/cash-totals";
import { formatMoney, fromMinor, toMinor, ZERO_MONEY } from "../lib/money";
import {
  fiscalCloseShift,
  fiscalOpenShift,
  fiscalStatus,
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
 *
 * Раскладка — как на экране заказа, прилавке и оплате: плоские панели,
 * разделённые границей в пиксель, без внешних отступов и скруглений,
 * функции полосой внизу. Слева свод кассы и свод ККТ (смотреть их порознь
 * бессмысленно), по центру движения по ящику, справа денежные операции
 * клавиатурой.
 */
export function CashScreen() {
  const { can } = useAccess();
  const { back } = useNavigation();
  const { cashShift, openCashShift, closeCashShift, recordCash, state } =
    useShifts();
  const { state: orders } = useOrders();
  const { drawerDevice, kkm, fiscalKkm } = useDevices();
  const { staff } = useSession();

  const [dialog, setDialog] = useState<CashOperationKind | null>(null);
  const [floatDraft, setFloatDraft] = useState("5000.00");
  const [notice, setNotice] = useState<string | null>(null);
  /** Последний отчёт ККТ. Показывается рядом со сводом кассы для сверки. */
  const [zReport, setZReport] = useState<ZReport | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * Работаем без фискализации — как и на экране оплаты (`state/checkout.tsx`).
   *
   * Два случая: ККМ не заведена вовсе либо заведена, но фискализация у неё
   * выключена (мёртвый ФН, касса используется принтером). Отчёты тогда чисто
   * кассовые: сверять их не с чем.
   */
  const isNonFiscal = fiscalKkm === undefined;

  /** Чем объяснять отказ: «нет ККМ» и «не фискализирует» — разные причины. */
  const nonFiscalReason =
    kkm === undefined ? "ККМ не заведена" : "у ККМ выключена фискализация";

  /**
   * Состояние смены в самой ККТ. `null` — ещё не спрашивали или не ответила.
   *
   * Спрашивать обязательно, потому что **смен две и они расходятся**. Кассовая
   * смена живёт во фронте, смена ККТ — в фискальном накопителе, и открываются
   * они одной кнопкой только при заведённой ККМ. Стоит открыть смену без ККМ,
   * а завести её потом — и получается тупик: оплата падает с «смена в ККТ
   * закрыта», а закрыть кассовую смену нельзя, потому что Z-отчёт снимать
   * тоже нечего. Так уже случилось, и выйти из этого через интерфейс было
   * невозможно.
   */
  const [kktShiftOpen, setKktShiftOpen] = useState<boolean | null>(null);

  const refreshKkt = useCallback(async () => {
    if (isNonFiscal) {
      setKktShiftOpen(null);
      return;
    }
    try {
      const status = await fiscalStatus();
      setKktShiftOpen(status.shiftOpen);
    } catch {
      // Молчащая ККТ — это не повод рисовать ошибку поверх экрана кассы:
      // сюда заходят и просто посмотреть выручку. Состояние остаётся
      // неизвестным, и подсказку мы не показываем.
      setKktShiftOpen(null);
    }
  }, [isNonFiscal]);

  useEffect(() => {
    void refreshKkt();
  }, [refreshKkt]);

  /** Кассовая смена идёт, а в ККТ смена закрыта — тот самый рассинхрон. */
  const needsKktShift = Boolean(cashShift) && kktShiftOpen === false;

  /** Открыть смену в ККТ, не трогая уже открытую кассовую. */
  const handleOpenKktShift = async () => {
    setBusy(true);
    try {
      await fiscalOpenShift(staff?.fullName ?? "—");
      await refreshKkt();
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

  const handleXReport = async () => {
    if (isNonFiscal) {
      setNotice(`${nonFiscalReason} — X-отчёт печатать нечем`);
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
    /*
     * В ККТ смена уже закрыта — снимать Z-отчёт нечего, и требовать его
     * значило бы запереть кассира: закрыть смену нельзя, потому что она
     * закрыта. Закрываем кассовую и говорим, почему без отчёта.
     */
    if (kktShiftOpen === false) {
      closeCashShift();
      setNotice("Смена в ККТ была закрыта — Z-отчёт не снимался");
      return;
    }
    setBusy(true);
    try {
      setZReport(await fiscalCloseShift(staff?.fullName ?? "—"));
      closeCashShift();
      await refreshKkt();
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
      await refreshKkt();
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
        onHideNotice={() => setNotice(null)}
      />
    );
  }

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden bg-slate-950">
      {/* Шапка: чья смена и с каким разменом. Номер крупно справа — его
          называют при сверке и по нему ищут Z-отчёт; длинную подпись режем,
          а не переносим, иначе на 1024 шапка уходит на две строки. */}
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black tracking-wide text-emerald-400">
            Кассовая смена
          </h1>
          <p className="truncate text-xs text-slate-500">
            Открыта {formatDateTime(cashShift.openedAt)} · размен{" "}
            {formatMoney(cashShift.openingFloat)}
          </p>
        </div>
        <span className="shrink-0 text-2xl font-black tabular-nums text-slate-600">
          №{cashShift.number}
        </span>
      </header>

      {notice && <Notice text={notice} onHide={() => setNotice(null)} />}

      {/*
        Рассинхрон двух смен. Кассир этого сам не увидит: на экране кассы
        смена открыта, а падает — оплата, на другом экране и другими словами.
        Поэтому говорим прямо здесь и даём кнопку, а не оставляем догадываться.
      */}
      {needsKktShift && (
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-rose-900/60 bg-rose-950/40 px-4 py-2">
          <p className="text-sm text-rose-300">
            <b>Смена в ККТ закрыта</b> — чеки пробиваться не будут. Кассовая
            смена при этом идёт: её открыли, когда ККМ ещё не была заведена.
          </p>
          <button
            type="button"
            disabled={busy || !can("shift.open")}
            onClick={handleOpenKktShift}
            className="min-h-11 shrink-0 bg-rose-600 px-4 text-sm font-bold text-white transition active:scale-95 hover:bg-rose-500 disabled:pointer-events-none disabled:opacity-40"
          >
            Открыть смену в ККТ
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Свод кассы и свод ККТ — одной колонкой. Вопрос при сверке всегда
            один: сходится ли наличность в ящике с тем, что видел фискальный
            регистратор, — и смотреть эти две таблицы порознь бессмысленно.
            Колонка прокручивается: на 768 точках вместе они не влезают. */}
        <section className="flex w-80 shrink-0 flex-col border-r border-slate-800 xl:w-96">
          <PanelHead label="Итог по смене" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <dl className="divide-y divide-slate-900">
              {totals?.byPaymentType.map((row) => (
                <SumRow
                  key={row.paymentTypeId}
                  label={row.label}
                  value={formatMoney(row.amount)}
                />
              ))}
              <SumRow
                label="Выручка"
                value={formatMoney(totals?.revenue ?? ZERO_MONEY)}
                strong
              />
              <SumRow label="Чеков" value={String(totals?.ordersCount ?? 0)} />
              <SumRow
                label="Средний чек"
                value={
                  totals?.averageCheck ? formatMoney(totals.averageCheck) : "—"
                }
              />
              <SumRow
                label="Внесено"
                value={formatMoney(totals?.deposits ?? ZERO_MONEY)}
              />
              <SumRow
                label="Изъято"
                value={formatMoney(totals?.withdrawals ?? ZERO_MONEY)}
              />
              <SumRow
                label="Ожидается в ящике"
                value={formatMoney(totals?.expectedCash ?? ZERO_MONEY)}
                strong
              />
            </dl>

            {zReport && (
              <>
                <PanelHead label={`ККТ · смена №${zReport.shiftNumber}`} />
                <dl className="divide-y divide-slate-900">
                  <SumRow label="Чеков" value={String(zReport.receipts)} />
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
              </>
            )}
          </div>
        </section>

        {/* Движения по ящику. Занимают всю середину: это единственный список
            экрана, и именно по нему объясняют недостачу. */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-slate-800">
          <PanelHead label="Движения по ящику" count={operations.length} />
          <ul className="min-h-0 flex-1 divide-y divide-slate-900 overflow-y-auto">
            {operations.map((operation) => (
              <li
                key={operation.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="w-12 shrink-0 text-xs tabular-nums text-slate-600">
                  {formatTime(operation.createdAt)}
                </span>
                <span className="min-w-0 flex-1 text-sm text-slate-300">
                  {OPERATION_LABELS[operation.kind]}
                  {operation.comment && (
                    <span className="text-slate-600"> · {operation.comment}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-sm font-bold tabular-nums",
                    isIncoming(operation.kind)
                      ? "text-emerald-400"
                      : "text-rose-400",
                  )}
                >
                  {isIncoming(operation.kind) ? "+" : "−"}
                  {formatMoney(operation.amount)}
                </span>
              </li>
            ))}
            {operations.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-600">
                Движений не было
              </li>
            )}
          </ul>
        </section>

        {/* Денежные операции. Сетка разделена пикселем на тёмной подложке,
            а не отступами: панель читается цельной клавиатурой, и всё место
            между клавишами достаётся самой клавише — пальцем промахиваются
            по зазорам. */}
        <section className="flex min-h-0 w-80 shrink-0 flex-col">
          <PanelHead label="Операции" />
          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-px overflow-y-auto bg-slate-800">
            <OpKey
              label="Внести деньги"
              disabled={!can("cash.deposit")}
              onClick={() => setDialog("deposit")}
            />
            <OpKey
              label="Изъять деньги"
              disabled={!can("cash.withdraw")}
              onClick={() => setDialog("withdrawal")}
            />
            <OpKey
              label="Инкассация"
              disabled={!can("cash.withdraw")}
              onClick={() => setDialog("collection")}
            />
            <OpKey
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
                openCashDrawer(drawerDevice.port, 9100).catch((error: unknown) =>
                  setNotice(
                    error instanceof Error ? error.message : "Ящик не открылся",
                  ),
                );
              }}
            />
          </div>
        </section>
      </div>

      {/* Полоса функций внизу — та же, что на заказе, прилавке и оплате.
          Отчёты стоят здесь, а не в сетке операций: движения по ящику делают
          в течение смены, а отчёты снимают в конце, и смешав их в одной сетке,
          получаешь Z-отчёт под пальцем там, где метили в инкассацию. */}
      <FunctionBar>
        <FunctionKey label="← Назад" onClick={back} />
        <FunctionKey
          label="Печать X-отчёта"
          disabled={!can("report.x") || busy}
          onClick={handleXReport}
        />
        <FunctionKey
          label="Закрыть смену (Z-отчёт)"
          tone="danger"
          disabled={!can("shift.close") || busy}
          onClick={handleCloseShift}
        />
      </FunctionBar>

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
  onHideNotice,
}: {
  canOpen: boolean;
  value: string;
  onChange: (next: string) => void;
  onOpen: () => void;
  onBack: () => void;
  /** Почему смена не открылась. Чаще всего — молчащая ККТ. */
  notice: string | null;
  onHideNotice: () => void;
}) {
  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden bg-slate-950">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black tracking-wide text-slate-300">
            Кассовая смена
          </h1>
          <p className="truncate text-xs text-slate-500">Закрыта</p>
        </div>
        <span className="shrink-0 text-2xl font-black tabular-nums text-slate-700">
          —
        </span>
      </header>

      {notice && <Notice text={notice} onHide={onHideNotice} />}

      <div className="flex min-h-0 flex-1 justify-center overflow-y-auto p-6">
        <div className="h-fit w-96 border border-slate-800 bg-slate-900">
          <PanelHead label="Открытие смены" />
          <p className="border-b border-slate-800 px-4 py-3 text-sm text-slate-500">
            Пока смена не открыта, чек не к чему привязать: у него не будет
            ни номера смены, ни места в Z-отчёте.
          </p>
          <label className="block px-4 py-3">
            <span className="text-xs uppercase tracking-wider text-slate-600">
              Разменный фонд
            </span>
            {/* Поле высотой в клавишу: сумму размена набирают пальцем,
                а не мышью. */}
            <input
              inputMode="decimal"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="mt-2 min-h-14 w-full border border-slate-700 bg-slate-950 px-4 text-right text-2xl tabular-nums text-slate-100"
            />
          </label>
          {!canOpen && (
            <p className="border-t border-slate-800 px-4 py-3 text-xs text-slate-600">
              Смену открывает кассир
            </p>
          )}
        </div>
      </div>

      <FunctionBar>
        <FunctionKey label="← Назад" onClick={onBack} />
        <FunctionKey
          label="Открыть смену"
          tone="accept"
          span={2}
          disabled={!canOpen}
          onClick={onOpen}
        />
      </FunctionBar>
    </div>
  );
}

/**
 * Полоса предупреждения. Нажатие скрывает: текст отказа нужен один раз,
 * а место на 768 точках — всю смену. Высота держится целью касания, потому
 * что это кнопка, а не абзац.
 */
function Notice({ text, onHide }: { text: string; onHide: () => void }) {
  return (
    <button
      type="button"
      onClick={onHide}
      className="min-h-11 shrink-0 border-b border-amber-900/60 bg-amber-950/40 px-4 py-2 text-left text-sm text-amber-300"
    >
      {text} · нажмите, чтобы скрыть
    </button>
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
              onClick={() =>
                setMinor((prev) =>
                  Math.min(prev * 10 + Number(digit), 99_999_999),
                )
              }
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

/**
 * Клавиша денежной операции.
 *
 * Плоская и без скруглений — клавиши разделяет пиксельный зазор сетки,
 * а не воздух вокруг каждой. Высота задаётся `min-h-*`, а не паддингами:
 * паддинги обнуляются сбросом вне слоя (см. CLAUDE.md), и клавиша молча
 * схлопывается ниже цели касания.
 */
function OpKey({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-20 bg-slate-900 px-3 text-sm font-bold leading-tight text-slate-300 transition hover:bg-slate-800 active:bg-slate-700 disabled:pointer-events-none disabled:opacity-40"
    >
      {label}
    </button>
  );
}

/** Заголовок панели: одна высота на всех колонках, иначе панели «пляшут». */
function PanelHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4">
      <span className="truncate text-sm font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {count !== undefined && (
        <span className="shrink-0 text-sm tabular-nums text-slate-500">
          записей: {count}
        </span>
      )}
    </div>
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
    <div className="flex min-h-12 items-center justify-between gap-3 px-5">
      <dt className="min-w-0 truncate text-sm text-slate-500">{label}</dt>
      <dd
        className={cn(
          "shrink-0 tabular-nums",
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
