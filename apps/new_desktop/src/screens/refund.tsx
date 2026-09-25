import { useState } from "react";
import { ScreenHeader } from "../components/screen-header";
import { formatMoney } from "../lib/money";
import { usePos } from "../state/pos";

interface RefundScreenProps {
  onBack: () => void;
}

const KIND_LABELS = { cash: "Наличные", card: "Карта" } as const;

/**
 * Возврат по чеку.
 *
 * Возвращается **чек целиком**: частичный возврат — это не подмножество
 * строк, а новый расчёт, потому что ККТ требует, чтобы сумма позиций сошлась
 * с суммой платежей. Возвращённый чек во второй раз не отдаётся — второе
 * нажатие отдало бы гостю сумму дважды, а замечают это при сверке кассы.
 */
export function RefundScreen({ onBack }: RefundScreenProps) {
  const pos = usePos();
  const [confirming, setConfirming] = useState<number | null>(null);

  const orders = [...pos.orders].reverse();
  const order = orders.find((candidate) => candidate.number === confirming);

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-white">
      <ScreenHeader
        title="Возврат по чеку"
        subtitle={`Чеков за смену: ${pos.orders.length}`}
        onBack={onBack}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-neutral-600">
            За смену ещё не было ни одного чека
          </p>
        ) : (
          orders.map((candidate) => (
            <article
              key={candidate.number}
              className="mb-2 flex items-center gap-4 rounded-xl bg-neutral-900 px-4 py-3"
            >
              <div className="w-24 shrink-0">
                <p className="text-2xl font-bold text-orange-500">
                  № {candidate.number}
                </p>
                <p className="text-sm text-neutral-500">
                  {new Date(candidate.at).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <p className="min-w-0 flex-1 truncate text-sm text-neutral-400">
                {candidate.lines
                  .map((line) => `${line.quantity}× ${line.name}`)
                  .join(", ")}
              </p>

              <div className="w-32 shrink-0 text-right">
                <p className="text-xl font-bold tabular-nums">
                  {formatMoney(candidate.total)}
                </p>
                <p className="text-sm text-neutral-500">
                  {KIND_LABELS[candidate.kind]}
                </p>
              </div>

              {candidate.refundedAt === null ? (
                <button
                  type="button"
                  onClick={() => setConfirming(candidate.number)}
                  className="min-h-14 w-36 shrink-0 rounded-xl bg-neutral-800 text-base font-semibold active:bg-neutral-700"
                >
                  Вернуть
                </button>
              ) : (
                <span className="w-36 shrink-0 text-center text-base font-bold text-red-500">
                  Возвращён
                </span>
              )}
            </article>
          ))
        )}
      </div>

      {order ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-5">
            <p className="text-xl font-bold">Вернуть чек № {order.number}?</p>
            <p className="mt-1 text-sm text-neutral-500">
              {/* Порядок тот же, что у продажи, только наоборот: деньги гостю,
                  затем чек возврата прихода. */}
              Гостю уходит {formatMoney(order.total)} —{" "}
              {KIND_LABELS[order.kind].toLowerCase()}. Повторный возврат
              по этому чеку будет невозможен.
            </p>
            <ul className="my-4 rounded-xl bg-neutral-950 px-4 py-3">
              {order.lines.map((line) => (
                <li key={line.id} className="flex gap-2 py-0.5 text-sm">
                  <span className="w-8 shrink-0 font-bold tabular-nums text-neutral-400">
                    {line.quantity}×
                  </span>
                  <span className="min-w-0">{line.name}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="min-h-16 flex-1 rounded-xl bg-neutral-800 text-lg font-semibold active:bg-neutral-700"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  pos.refund(order.number);
                  setConfirming(null);
                }}
                className="min-h-16 flex-1 rounded-xl bg-red-900 text-lg font-bold active:bg-red-800"
              >
                Вернуть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
