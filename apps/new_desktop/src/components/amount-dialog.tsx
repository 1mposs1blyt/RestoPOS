import { useState } from "react";
import type { Money } from "@restopos/shared-types";
import { NumKeyboard, type NumKeyboardKey } from "@restopos/ui-kit";
import { DENOMINATIONS, formatDenomination } from "../lib/denominations";
import { formatMoney, fromMinor, sumMoney, toMinor, ZERO_MONEY } from "../lib/money";

interface AmountDialogProps {
  title: string;
  hint?: string;
  confirmLabel: string;
  onConfirm: (amount: Money) => void;
  onClose: () => void;
}

/**
 * Ввод суммы: разменный фонд, внесение, изъятие, инкассация.
 *
 * Один диалог на все четыре операции намеренно. Скопированный в каждую,
 * он разъехался бы на первой правке — а расхождение здесь означает деньги,
 * посчитанные двумя способами в одной смене.
 */
export function AmountDialog({
  title,
  hint,
  confirmLabel,
  onConfirm,
  onClose,
}: AmountDialogProps) {
  const [amount, setAmount] = useState<Money>(ZERO_MONEY);
  const isEmpty = toMinor(amount) === 0;

  /* Клавиатура набирает рубли: наличными меньше рубля не расплачиваются. */
  function press(key: NumKeyboardKey) {
    const rubles = Math.trunc(toMinor(amount) / 100);
    const next =
      key === "backspace" ? Math.trunc(rubles / 10) : rubles * 10 + Number(key);
    setAmount(fromMinor(next * 100));
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900">
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
          <div>
            <p className="text-xl font-bold text-white">{title}</p>
            {hint ? <p className="text-sm text-neutral-500">{hint}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-14 rounded-xl border border-neutral-700 px-6 text-base font-semibold text-neutral-300 active:bg-neutral-800"
          >
            Отмена
          </button>
        </header>

        <div className="flex gap-4 p-4">
          <section className="flex flex-col gap-2">
            <div className="rounded-xl bg-neutral-800 px-4 py-2">
              <p className="text-xs tracking-widest text-neutral-500">СУММА</p>
              <p className="text-3xl font-bold tabular-nums text-white">
                {formatMoney(amount)}
              </p>
            </div>
            <NumKeyboard onPress={press} />
          </section>

          <section className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-xs tracking-widest text-neutral-500">НОМИНАЛЫ</p>
            <div className="grid grid-cols-4 gap-2">
              {DENOMINATIONS.map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() =>
                    setAmount((current) =>
                      sumMoney([current, fromMinor(note * 100)]),
                    )
                  }
                  className="min-h-14 rounded-xl bg-neutral-800 text-lg font-semibold tabular-nums text-white active:bg-neutral-700"
                >
                  {formatDenomination(note)}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isEmpty}
              onClick={() => setAmount(ZERO_MONEY)}
              className="min-h-14 rounded-xl bg-neutral-800 text-base font-semibold text-neutral-300 active:bg-neutral-700 disabled:text-neutral-700"
            >
              Сброс
            </button>

            <button
              type="button"
              disabled={isEmpty}
              onClick={() => onConfirm(amount)}
              className="mt-auto min-h-16 rounded-xl bg-emerald-600 text-2xl font-bold text-white active:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              {confirmLabel}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
