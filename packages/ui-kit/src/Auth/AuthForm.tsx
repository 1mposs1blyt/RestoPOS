import type { ReactNode } from "react";
import { cn } from "../cn";
import { PinPad } from "./PinPad";

export interface AuthFormProps {
  /** Проверка пин-кода. Отклонённый промис = неверный пин (см. `PinPad`). */
  onSubmit: (pin: string) => void | Promise<void>;
  /** Название системы на брендовой половине. */
  productName?: string;
  /** Подпись под названием. */
  tagline?: string;
  /** Заголовок над точками ввода. */
  title?: string;
  /** Подсказка под заголовком. */
  hint?: string;
  /**
   * Фоновый паттерн брендовой половины. Путь резолвится браузером,
   * то есть должен быть от корня раздачи (`/bg-logo.webp`), а не от `public/`.
   */
  backgroundUrl?: string;
  /** Произвольный контент вместо стандартного блока с названием. */
  brand?: ReactNode;
  length?: number;
  error?: string | null;
  className?: string;
}

export function AuthForm({
  onSubmit,
  productName = "RestoPOS",
  tagline = "Терминал обслуживания ресторанов",
  title = "Авторизация",
  hint = "Введите персональный PIN-код",
  backgroundUrl,
  brand,
  length = 4,
  error,
  className,
}: AuthFormProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full select-none overflow-hidden bg-slate-900 text-slate-100",
        className,
      )}
    >
      {/* Брендовая половина. На узких экранах (мобильный терминал) скрыта. */}
      <div className="relative hidden w-1/2 shrink-0 flex-col items-center justify-center overflow-hidden bg-slate-100 p-8 md:flex">
        {backgroundUrl && (
          <div
            className="absolute inset-0 bg-repeat opacity-50"
            style={{
              backgroundImage: `url("${backgroundUrl}")`,
              backgroundSize: "320px",
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10 space-y-2 text-center">
          {brand ?? (
            <>
              <h1 className="text-3xl font-black tracking-wider text-slate-800">
                {productName}
              </h1>
              <p className="text-sm font-medium text-slate-600">{tagline}</p>
            </>
          )}
        </div>
      </div>

      {/* Половина с вводом пин-кода */}
      <div className="flex w-full flex-col items-center justify-center gap-8 border-l border-slate-800/50 bg-[#1e2530] p-12 md:w-1/2">
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold tracking-wide text-slate-200">
            {title}
          </h2>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>

        <PinPad onSubmit={onSubmit} length={length} error={error} />
      </div>
    </div>
  );
}
