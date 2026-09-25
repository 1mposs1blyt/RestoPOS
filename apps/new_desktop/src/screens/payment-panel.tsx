import { useState } from "react";
import type { Money } from "@restopos/shared-types";
import { NumKeyboard, type NumKeyboardKey } from "@restopos/ui-kit";
import { DENOMINATIONS, formatDenomination } from "../lib/denominations";
import type { PaymentKind } from "../state/pos";
import {
  compareMoney,
  formatMoney,
  fromMinor,
  subtractMoney,
  sumMoney,
  toMinor,
  ZERO_MONEY,
} from "../lib/money";

interface PaymentPanelProps {
  orderNumber: number;
  total: Money;
  onPaid: (kind: PaymentKind) => void;
  onClose: () => void;
}

/**
 * Оплата панелью поверх экрана, а не отдельным маршрутом.
 *
 * Переход на свой экран прячет состав заказа ровно в тот момент, когда гость
 * спрашивает «а сколько без колы»: кассиру приходится возвращаться назад
 * и открывать оплату заново.
 *
 * Внесённое набирается тремя способами сразу, и ни один не заменяет другие:
 * номиналами (гость кладёт купюры по одной), клавиатурой (пересчитал мелочь
 * и назвал сумму) и кнопкой «под расчёт». Внесённое и сумма платежа — разные
 * величины: в выручку идёт сумма чека, а не то, что дал гость, иначе она
 * завышена на все сдачи за день.
 */
export function PaymentPanel({
  orderNumber,
  total,
  onPaid,
  onClose,
}: PaymentPanelProps) {
  const [tendered, setTendered] = useState<Money>(ZERO_MONEY);

  const difference = subtractMoney(tendered, total);
  const isEnough = compareMoney(tendered, total) >= 0;
  const hasTender = toMinor(tendered) > 0;

  /*
   * Клавиатура набирает рубли, а не копейки: наличными меньше рубля
   * не расплачиваются — самая мелкая монета в обороте как раз рубль.
   * Каждая цифра сдвигает разряд, стирание убирает последний.
   */
  function press(key: NumKeyboardKey) {
    const rubles = Math.trunc(toMinor(tendered) / 100);
    const next =
      key === "backspace"
        ? Math.trunc(rubles / 10)
        : rubles * 10 + Number(key);
    setTendered(fromMinor(next * 100));
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900">
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
          <div>
            <p className="text-xs tracking-widest text-neutral-500">
              ЗАКАЗ № {orderNumber}
            </p>
            <p className="text-3xl font-bold text-white">{formatMoney(total)}</p>
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
              <p className="text-xs tracking-widest text-neutral-500">ВНЕСЕНО</p>
              <p className="text-3xl font-bold tabular-nums text-white">
                {formatMoney(tendered)}
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
                  /* Номиналы складываются, а не заменяют друг друга: гость
                     кладёт на прилавок купюру за купюрой, и касса должна
                     повторять этот счёт, а не начинать его заново. */
                  onClick={() =>
                    setTendered((current) =>
                      sumMoney([current, fromMinor(note * 100)]),
                    )
                  }
                  className="min-h-14 rounded-xl bg-neutral-800 text-lg font-semibold tabular-nums text-white active:bg-neutral-700"
                >
                  {formatDenomination(note)}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTendered(total)}
                className="min-h-14 flex-1 rounded-xl bg-neutral-800 text-base font-semibold text-white active:bg-neutral-700"
              >
                Под расчёт
              </button>
              <button
                type="button"
                disabled={!hasTender}
                onClick={() => setTendered(ZERO_MONEY)}
                className="min-h-14 w-28 rounded-xl bg-neutral-800 text-base font-semibold text-neutral-300 active:bg-neutral-700 disabled:text-neutral-700"
              >
                Сброс
              </button>
            </div>

            {/*
              Недобор показывается так же заметно, как сдача: кассир, который
              не увидел, что денег не хватает, отдаёт заказ бесплатно.
            */}
            {hasTender && !isEnough ? (
              <div className="rounded-xl bg-red-950 px-4 py-2">
                <p className="text-xs tracking-widest text-red-400">НЕ ХВАТАЕТ</p>
                <p className="text-3xl font-bold tabular-nums text-red-400">
                  {formatMoney(subtractMoney(ZERO_MONEY, difference))}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-950 px-4 py-2">
                <p className="text-xs tracking-widest text-emerald-500">СДАЧА</p>
                <p className="text-3xl font-bold tabular-nums text-emerald-400">
                  {formatMoney(isEnough ? difference : ZERO_MONEY)}
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={!isEnough || !hasTender}
              onClick={() => onPaid("cash")}
              className="min-h-16 rounded-xl bg-emerald-600 text-2xl font-bold text-white active:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              Принять наличные
            </button>
          </section>

          <section className="flex w-56 flex-col gap-2">
            <p className="text-xs tracking-widest text-neutral-500">КАРТА</p>
            <button
              type="button"
              onClick={() => onPaid("card")}
              className="flex flex-1 flex-col items-center justify-center rounded-xl bg-sky-700 p-3 text-center text-xl font-bold text-white active:bg-sky-600"
            >
              Оплата картой
              <span className="mt-2 text-sm font-normal text-sky-200">
                {formatMoney(total)} на терминал
              </span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
