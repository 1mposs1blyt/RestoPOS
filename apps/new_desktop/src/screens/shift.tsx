import { useState } from "react";
import type { Money } from "@restopos/shared-types";
import { AmountDialog } from "../components/amount-dialog";
import { ScreenHeader } from "../components/screen-header";
import { formatMoney } from "../lib/money";
import { usePos, type CashOperationKind } from "../state/pos";

interface ShiftScreenProps {
  onBack: () => void;
}

const OPERATION_TITLES: Record<CashOperationKind, string> = {
  deposit: "Внесение",
  withdraw: "Изъятие",
  collection: "Инкассация",
};

type Dialog = "float" | CashOperationKind | null;

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: Money;
  accent?: "money" | "muted";
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-neutral-900 py-2">
      <span className="text-sm text-neutral-400">{label}</span>
      <span
        className={
          accent === "money"
            ? "text-2xl font-bold tabular-nums text-emerald-400"
            : "text-lg font-semibold tabular-nums text-neutral-200"
        }
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}

/**
 * Кассовая смена: открытие с разменным фондом, движения по ящику, X-отчёт
 * и закрытие.
 *
 * Свод считает `totalsOf` в сторе, а не экран: те же числа нужны при закрытии,
 * и посчитанные дважды они разойдутся. В ожидаемую наличность идут **только**
 * наличные платежи — иначе недостача на размер безнала при каждом пересчёте.
 */
export function ShiftScreen({ onBack }: ShiftScreenProps) {
  const pos = usePos();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [closing, setClosing] = useState(false);

  const isOpen = pos.shift.status === "open";
  const openedAt = pos.shift.openedAt
    ? new Date(pos.shift.openedAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-white">
      <ScreenHeader
        title="Кассовая смена"
        subtitle={
          isOpen
            ? `Смена № ${pos.shift.number}, открыта в ${openedAt}`
            : "Смена закрыта"
        }
        onBack={onBack}
      />

      {isOpen ? (
        <div className="flex min-h-0 flex-1 gap-4 p-4">
          <section className="flex w-96 shrink-0 flex-col">
            <p className="pb-2 text-xs tracking-widest text-neutral-500">
              X-ОТЧЁТ
            </p>
            <div className="rounded-xl bg-neutral-900 px-4 py-2">
              <Row label="Наличными" value={pos.totals.cashSales} />
              <Row label="Картой" value={pos.totals.cardSales} />
              <Row label="Возвраты" value={pos.totals.refunds} />
              <Row label="Разменный фонд" value={pos.shift.openingFloat} />
              <Row label="Внесено" value={pos.totals.deposits} />
              <Row label="Изъято и инкассировано" value={pos.totals.withdrawals} />
              <div className="flex items-baseline justify-between pt-3 pb-2">
                <span className="text-sm tracking-widest text-neutral-500">
                  В ЯЩИКЕ ДОЛЖНО БЫТЬ
                </span>
              </div>
              <div className="pb-3 text-right text-4xl font-bold tabular-nums text-emerald-400">
                {formatMoney(pos.totals.expectedCash)}
              </div>
            </div>
            <p className="px-1 pt-2 text-sm text-neutral-600">
              Чеков за смену: {pos.totals.receipts}
            </p>
          </section>

          <section className="flex min-w-0 flex-1 flex-col gap-3">
            <p className="text-xs tracking-widest text-neutral-500">
              ДВИЖЕНИЯ ПО ЯЩИКУ
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(
                ["deposit", "withdraw", "collection"] as CashOperationKind[]
              ).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setDialog(kind)}
                  className="min-h-16 rounded-xl bg-neutral-800 text-lg font-semibold active:bg-neutral-700"
                >
                  {OPERATION_TITLES[kind]}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-neutral-900 p-2">
              {pos.cashOperations.length === 0 ? (
                <p className="p-4 text-center text-sm text-neutral-600">
                  Движений по ящику не было
                </p>
              ) : (
                pos.cashOperations.map((operation) => (
                  <div
                    key={operation.id}
                    className="flex items-baseline justify-between border-b border-neutral-800 px-2 py-2 last:border-0"
                  >
                    <span className="text-base">
                      {OPERATION_TITLES[operation.kind]}
                      <span className="ml-2 text-sm text-neutral-500">
                        {new Date(operation.at).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    <span className="text-lg font-semibold tabular-nums">
                      {operation.kind === "deposit" ? "+" : "−"}
                      {formatMoney(operation.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setClosing(true)}
              className="min-h-16 rounded-xl bg-red-900 text-xl font-bold active:bg-red-800"
            >
              Закрыть смену
            </button>
          </section>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <p className="text-2xl text-neutral-500">
            Смена закрыта — продавать нельзя
          </p>
          <button
            type="button"
            onClick={() => setDialog("float")}
            className="min-h-20 rounded-2xl bg-emerald-600 px-12 text-2xl font-bold active:bg-emerald-500"
          >
            Открыть смену
          </button>
        </div>
      )}

      {dialog === "float" ? (
        <AmountDialog
          title="Разменный фонд"
          hint="Сколько наличных в ящике на начало смены"
          confirmLabel="Открыть смену"
          onConfirm={(amount) => {
            pos.openShift(amount);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog !== null && dialog !== "float" ? (
        <AmountDialog
          title={OPERATION_TITLES[dialog]}
          confirmLabel="Провести"
          onConfirm={(amount) => {
            pos.cashOperation(dialog, amount);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {/*
        Закрытие показывает то же, что X-отчёт: гашение — необратимая
        операция, и подтверждать её вслепую нельзя.
      */}
      {closing ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-5">
            <p className="text-xl font-bold">Закрыть смену № {pos.shift.number}?</p>
            <p className="mt-1 text-sm text-neutral-500">
              Z-отчёт гасит счётчики. Отменить закрытие нельзя.
            </p>
            <div className="my-4 rounded-xl bg-neutral-950 px-4 py-2">
              <Row label="Наличными" value={pos.totals.cashSales} />
              <Row label="Картой" value={pos.totals.cardSales} />
              <Row label="Возвраты" value={pos.totals.refunds} />
              <Row
                label="В ящике должно быть"
                value={pos.totals.expectedCash}
                accent="money"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setClosing(false)}
                className="min-h-16 flex-1 rounded-xl bg-neutral-800 text-lg font-semibold active:bg-neutral-700"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  pos.closeShift();
                  setClosing(false);
                }}
                className="min-h-16 flex-1 rounded-xl bg-red-900 text-lg font-bold active:bg-red-800"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
