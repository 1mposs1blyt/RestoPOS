/**
 * Минимальная склейка классов. Отдельная зависимость (clsx/cva) здесь
 * не нужна — ui-kit намеренно держится без рантайм-зависимостей,
 * чтобы одинаково линковаться и в desktop-, и в mobile-сборку.
 */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
