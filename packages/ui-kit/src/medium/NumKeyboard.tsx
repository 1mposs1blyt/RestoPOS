import { cn } from "../cn";

/**
 * Клавиша цифровой клавиатуры. Стирание — это семантическое значение,
 * а не символ «✕»: рисунок кнопки меняется вместе с оформлением,
 * а обработчики в потребителях от этого зависеть не должны.
 */
export type NumKeyboardKey =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "backspace";

export interface NumKeyboardProps {
  onPress: (key: NumKeyboardKey) => void;
  disabled?: boolean;
  className?: string;
}

const DIGITS: NumKeyboardKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

// Кнопки «литые»: разделители нарисованы границами, а не gap-ом, —
// на тач-экране между клавишами не должно быть мёртвых зон.
const KEY_BASE =
  "h-16 text-xl font-bold transition-colors select-none " +
  "disabled:cursor-default disabled:opacity-40";

export function NumKeyboard({ onPress, disabled, className }: NumKeyboardProps) {
  return (
    <div
      className={cn(
        // Ширина именно определённая (`w-72`), а не `w-full`: клавиатуру часто
        // ставят во flex-колонку с `items-center`, где родитель сам shrink-to-fit.
        // Там `w-full` резолвится в max-content от содержимого клавиш и
        // схлопывает сетку до ~140px.
        "w-72 overflow-hidden rounded-2xl border shadow-xl backdrop-blur-sm",
        "border-slate-600/50 bg-slate-700/40",
        className,
      )}
    >
      <div className="grid grid-cols-3">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => onPress(digit)}
            className={cn(
              KEY_BASE,
              "border-b border-r border-slate-600/40 text-slate-200",
              "hover:bg-slate-600/40 active:bg-slate-600/70",
            )}
          >
            {digit}
          </button>
        ))}

        {/* Пустая клетка ради симметрии нижнего ряда */}
        <div className="h-16 border-r border-slate-600/40" />

        <button
          type="button"
          disabled={disabled}
          onClick={() => onPress("0")}
          className={cn(
            KEY_BASE,
            "border-r border-slate-600/40 text-slate-200",
            "hover:bg-slate-600/40 active:bg-slate-600/70",
          )}
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onPress("backspace")}
          aria-label="Стереть"
          className={cn(
            KEY_BASE,
            "flex items-center justify-center text-rose-400",
            "hover:bg-rose-500/10 active:bg-rose-500/20",
          )}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
