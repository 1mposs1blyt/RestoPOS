import { cn } from "../cn";

export interface PinDotsProps {
  /** Сколько символов уже введено. */
  filled: number;
  /** Общая длина пин-кода. */
  length: number;
  /** Подсветить красным — например, после отказа сервера. */
  invalid?: boolean;
  className?: string;
}

export function PinDots({ filled, length, invalid, className }: PinDotsProps) {
  return (
    <div
      className={cn("flex h-6 items-center justify-center gap-5", className)}
      role="status"
      aria-label={`Введено ${filled} из ${length} символов`}
    >
      {Array.from({ length }, (_, index) => {
        const isFilled = index < filled;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: точки различаются только позицией, другого ключа у них нет и список не переупорядочивается
            key={index}
            className={cn(
              "h-5 w-5 rounded-full border-2 transition-all duration-300 ease-out",
              isFilled
                ? invalid
                  ? "scale-110 border-rose-500 bg-rose-500 shadow-lg shadow-rose-500/40"
                  : "scale-110 border-orange-500 bg-orange-500 shadow-lg shadow-orange-500/40"
                : "scale-100 border-slate-600 bg-transparent",
            )}
          />
        );
      })}
    </div>
  );
}
