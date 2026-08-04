import { useMemo, useState } from "react";
import { cn } from "@restopos/ui-kit";
import {
  describeSplit,
  splitEqually,
  splitUneven,
} from "../lib/split-quantity";

/**
 * Деление блюда.
 *
 * Три режима, как в эталоне: на равные части, на две неравные и между гостями.
 * Третий — это тот же равный делёж, но доли сразу расходятся по номерам гостей:
 * компания просит разбить счёт, и вручную приписывать каждую половину нельзя,
 * иначе половина ужина окажется ничьей.
 *
 * Формула на экране («1 = 2 × 0,5») не украшение: официант показывает её
 * гостю, и она обязана сходиться с тем, что попадёт в чек. Поэтому доли
 * считает `lib/split-quantity.ts` — тот же код, что и запишет их.
 */
type Mode = "equal" | "uneven" | "guests";

export function SplitDialog({
  quantity,
  guestCount,
  onConfirm,
  onCancel,
}: {
  quantity: number;
  /** Сколько гостей за столом. Меньше двух — делить между ними нечего. */
  guestCount: number;
  onConfirm: (parts: number[], guestNumbers?: (number | null)[]) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<Mode>("equal");
  const [parts, setParts] = useState(2);
  /** Первая доля в неравном делении, в тысячных — чтобы не копить ошибку float. */
  const [firstMilli, setFirstMilli] = useState(() =>
    Math.round((quantity * 1000) / 2),
  );

  const preview = useMemo(() => {
    if (mode === "uneven") return splitUneven(quantity, firstMilli / 1000);
    return splitEqually(quantity, mode === "guests" ? guestCount : parts);
  }, [mode, quantity, parts, firstMilli, guestCount]);

  const guestNumbers =
    mode === "guests" ? preview.map((_, index) => index + 1) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-[34rem] space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="text-center text-lg font-black text-slate-200">
          Разделить блюдо
        </h3>

        <p className="rounded-xl border border-slate-800 bg-slate-950 py-4 text-center text-2xl font-black tabular-nums text-orange-400">
          {describeSplit(quantity, preview)}
        </p>

        <div className="grid grid-cols-3 gap-2">
          <ModeButton active={mode === "equal"} onClick={() => setMode("equal")}>
            На равные части
          </ModeButton>
          <ModeButton active={mode === "uneven"} onClick={() => setMode("uneven")}>
            На две неравные
          </ModeButton>
          <ModeButton
            active={mode === "guests"}
            // Делить между гостями, когда гость один, нечего — кнопка гаснет,
            // а не делает вид, что сработала.
            disabled={guestCount < 2}
            onClick={() => setMode("guests")}
          >
            Между гостями
            {guestCount >= 2 && (
              <span className="block text-xs font-normal opacity-70">
                их {guestCount}
              </span>
            )}
          </ModeButton>
        </div>

        {mode === "equal" && (
          <div className="grid grid-cols-5 gap-2">
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setParts(value)}
                className={cn(
                  "min-h-14 rounded-lg border text-lg font-bold tabular-nums transition active:scale-95",
                  parts === value
                    ? "border-transparent bg-orange-500 text-white"
                    : "border-slate-700 bg-slate-800 text-slate-300",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        )}

        {mode === "uneven" && (
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={Math.round(quantity * 1000)}
              step={Math.max(1, Math.round((quantity * 1000) / 20))}
              value={firstMilli}
              onChange={(event) => setFirstMilli(Number(event.target.value))}
              className="h-11 w-full accent-orange-500"
            />
            <div className="flex justify-between text-sm tabular-nums text-slate-400">
              <span>Первая: {format(preview[0])}</span>
              <span>Вторая: {format(preview[1])}</span>
            </div>
          </div>
        )}

        {mode === "guests" && (
          <p className="text-center text-sm text-slate-500">
            Каждая доля сразу закрепится за своим гостем — с первого по{" "}
            {guestCount}-го.
          </p>
        )}

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
            // Доля в ноль — не доля: в неравном делении ползунок можно увести
            // в край, и тогда деления не происходит вовсе.
            disabled={preview.some((part) => part <= 0)}
            onClick={() => onConfirm(preview, guestNumbers)}
            className="min-h-14 rounded-xl bg-orange-500 text-sm font-black text-white transition active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
          >
            Разделить
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-16 rounded-xl border px-2 text-sm font-bold transition active:scale-95 disabled:opacity-40",
        active
          ? "border-transparent bg-orange-500 text-white"
          : "border-slate-700 bg-slate-800 text-slate-300",
      )}
    >
      {children}
    </button>
  );
}

function format(value: number): string {
  return String(Number(value.toFixed(3))).replace(".", ",");
}
