import type { ReactNode } from "react";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children?: ReactNode;
}

/** Шапка служебного экрана. «Назад» слева — туда тянется большой палец. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  children,
}: ScreenHeaderProps) {
  return (
    <header className="flex min-h-14 items-center gap-4 border-b border-neutral-800 px-3">
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 rounded-lg bg-neutral-800 px-4 text-base font-semibold text-neutral-200 active:bg-neutral-700"
      >
        ← Назад
      </button>
      <div className="min-w-0">
        <p className="truncate text-xl font-bold">{title}</p>
        {subtitle ? (
          <p className="truncate text-sm text-neutral-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}
