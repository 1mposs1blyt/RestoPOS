import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
  secondary:
    "bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400 " +
    "dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 " +
    "dark:text-slate-200 dark:hover:bg-slate-800",
};

// Размеры заданы с прицелом на пальцы, а не мышь: минимальная цель ~44px,
// на кассе по кнопкам попадают в спешке.
const SIZES: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-14 px-6 text-base",
  xl: "min-h-20 px-8 text-xl",
};

export function Button({
  variant = "primary",
  size = "lg",
  fullWidth = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold",
        "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
