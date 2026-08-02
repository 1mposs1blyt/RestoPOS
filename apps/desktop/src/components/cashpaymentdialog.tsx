import { useMemo, useState } from "react";
import type { Money } from "@restopos/shared-types";
import { NumKeyboard, cn } from "@restopos/ui-kit";
import {
  ZERO_MONEY,
  compareMoney,
  formatMoney,
  fromMinor,
  subtractMoney,
  toMinor,
} from "../lib/money";

/**
 * Расчёт наличными.
 *
 * Нужен и официанту, и кассиру: принять купюру и отдать сдачу — обычная часть
 * их работы, а не привилегия (право одно на обоих — `payment.accept`).
 * Считать сдачу в уме кассир не должен: ошибка здесь стоит денег смены,
 * а в час пик она неизбежна.
 *
 * Ввод — как на кассовом аппарате: цифры набираются справа, в копейках.
 * «1500» означает 15 рублей, а не полторы тысячи, — иначе на каждый чек
 * пришлось бы жать «00».
 */
export function CashPaymentDialog({
  total,
  onConfirm,
  onCancel,
}: {
  total: Money;
  onConfirm: (received: Money) => void;
  onCancel: () => void;
}) {
  const [minor, setMinor] = useState(0);

  const received = fromMinor(minor);
  const change = subtractMoney(received, total);
  const isEnough = compareMoney(received, total) >= 0;
  // Пока ничего не введено, показываем «без сдачи»: это самый частый случай,
  // и лишний ноль в поле сдачи только отвлекает.
  const isUntouched = minor === 0;

  const suggestions = useMemo(() => suggestNotes(total), [total]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/95 p-4">
      <div className="flex max-h-full gap-6 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex w-64 flex-col gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              К оплате
            </p>
            <p className="text-3xl font-black tabular-nums text-slate-100">
              {formatMoney(total)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Получено
            </p>
            <p
              className={cn(
                "text-3xl font-black tabular-nums",
                isEnough ? "text-emerald-400" : "text-slate-400",
              )}
            >
              {formatMoney(received)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Сдача
            </p>
            <p
              className={cn(
                "text-2xl font-black tabular-nums",
                isEnough ? "text-orange-400" : "text-slate-700",
              )}
            >
              {isEnough && !isUntouched ? formatMoney(change) : "—"}
            </p>
          </div>

          {/* Купюры, которыми расплачиваются чаще всего при такой сумме. */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMinor(toMinor(total))}
              className="col-span-2 min-h-11 rounded-lg border border-slate-700 bg-slate-800 text-sm font-bold text-slate-300 transition hover:bg-slate-700 active:scale-95"
            >
              Без сдачи
            </button>
            {suggestions.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => setMinor(note * 100)}
                className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 text-sm font-bold tabular-nums text-slate-300 transition hover:bg-slate-700 active:scale-95"
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <NumKeyboard
            onPress={(key) =>
              setMinor((prev) =>
                key === "backspace"
                  ? Math.floor(prev / 10)
                  : // Ограничение сверху: без него длинное нажатие набирает
                    // число, которое перестаёт быть точным в double.
                    Math.min(prev * 10 + Number(key), 99_999_999),
              )
            }
          />

          <button
            type="button"
            disabled={!isEnough}
            onClick={() => onConfirm(received)}
            className="min-h-14 w-72 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            {isEnough && !isUntouched && compareMoney(change, ZERO_MONEY) > 0
              ? `Оплатить · сдача ${formatMoney(change)}`
              : "Оплатить"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="min-h-14 w-72 rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-slate-300 transition hover:bg-slate-700 active:scale-95"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ходовые купюры не мельче суммы: ими и расплачиваются чаще всего. */
const NOTES = [100, 200, 500, 1000, 2000, 5000];

function suggestNotes(total: Money): number[] {
  const rubles = toMinor(total) / 100;
  return NOTES.filter((note) => note > rubles).slice(0, 4);
}
