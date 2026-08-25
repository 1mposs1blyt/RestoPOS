import { cn } from "@restopos/ui-kit";

/**
 * Полоса функций внизу экрана — как в iikoFront.
 *
 * Действия над тем, что на экране, собраны в одном месте и не разъезжаются
 * по углам: в запару по ним попадают не глядя, боковым зрением, и мишень
 * должна быть там же, где была в прошлый раз. Разделители в один пиксель
 * дают полосе вид цельной клавиатуры, а не набора раскиданных кнопок.
 *
 * Компонент общий на все экраны намеренно: копий было уже две (заказ
 * и прилавок), третья на экране оплаты означала бы, что высота клавиши
 * или её тон разъедутся на первой же правке.
 */
export function FunctionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 gap-px border-t border-slate-800 bg-slate-800">
      {children}
    </div>
  );
}

/**
 * Клавиша полосы функций.
 *
 * Высота 64px, а не минимальные 44: это самые нажимаемые кнопки экрана.
 * Задаётся `min-h-16`, а не вертикальными паддингами, — паддинги обнуляются
 * сбросом вне слоя, и кнопка молча схлопывается (см. ловушки вёрстки
 * в CLAUDE.md).
 *
 * Тон несёт смысл, а не украшает: зелёная завершает действие (отправить
 * на кухню, оплатить), оранжевая ведёт к деньгам, красная закрывает
 * необратимое (Z-отчёт смену уже не вернёт). Кассир различает их не читая.
 *
 * `span` расширяет клавишу вдвое. Нужен там, где в полосе главное действие
 * одно: «Оплатить» рядом с «Назад» одинаковой ширины теряется, а промах
 * по ней стоит дороже.
 */
export function FunctionKey({
  label,
  onClick,
  disabled = false,
  tone = "plain",
  span = 1,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "plain" | "accept" | "pay" | "danger";
  span?: 1 | 2;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-16 px-2 text-sm font-black uppercase leading-tight tracking-wide transition active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        span === 2 ? "flex-[2]" : "flex-1",
        tone === "accept" && "bg-emerald-600 text-white hover:bg-emerald-500",
        tone === "pay" && "bg-orange-500 text-white hover:bg-orange-400",
        tone === "danger" &&
          "bg-rose-950/60 text-rose-300 hover:bg-rose-900/60",
        tone === "plain" && "bg-slate-900 text-slate-300 hover:bg-slate-800",
      )}
    >
      {label}
    </button>
  );
}
