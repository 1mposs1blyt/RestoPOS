/**
 * Шапка панели — как в iikoFront.
 *
 * Экран кассы разложен плоскими панелями, и у каждой сверху одна и та же
 * полоса: подпись слева, счётчик справа. Копий этой полосы было уже четыре
 * (касса, оплата, кухня — дважды), и высота у них держалась только тем,
 * что их писали подряд. Отдельный компонент нужен по той же причине, что
 * и `FunctionBar`: разъедется она на первой правке, а заметно это будет
 * не на том экране, который правили.
 *
 * Высота 48px, а не цель касания: панель не нажимают, её читают. Задаётся
 * `min-h-12`, а не паддингами, — длинная подпись не должна ронять высоту
 * соседней панели.
 */
export function PanelHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4">
      <span className="truncate text-sm font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {count !== undefined && (
        <span className="shrink-0 text-sm tabular-nums text-slate-500">
          записей: {count}
        </span>
      )}
    </div>
  );
}
