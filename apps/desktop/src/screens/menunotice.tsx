import { useMenu } from "../state/menu";

/**
 * Состояние загрузки меню для экранов, которые по нему заказывают.
 *
 * Отдельным компонентом, потому что мест три (зал, прилавок, стоп-лист),
 * а сообщение обязано быть одним: «меню не доехало» и «в меню пусто» —
 * разные вещи, и разъехавшиеся формулировки этой разницы не удержат.
 * Готовое меню он не рисует вовсе — возвращает `null`.
 */
export function MenuNotice() {
  const { status, error, reload, categories } = useMenu();

  if (status === "loading") {
    return (
      <p className="px-1 py-8 text-center text-sm text-slate-500">
        Меню загружается…
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3 rounded-xl border border-rose-900/60 bg-rose-950/30 p-4 text-center">
        <p className="text-sm font-bold text-rose-300">Меню не загрузилось</p>
        {/* Текст отказа виден целиком: без него «попробуйте ещё раз» посреди
            смены не отличить от выключенного узла, и звонить некому. */}
        <p className="text-xs text-slate-500">{error}</p>
        <button
          type="button"
          onClick={reload}
          className="min-h-11 w-full rounded-xl bg-slate-800 px-4 text-sm font-bold text-slate-200 transition active:scale-95"
        >
          Повторить
        </button>
      </div>
    );
  }

  /*
   * Меню доехало и оказалось пустым — это настройка заведения, а не поломка,
   * и говорить о ней надо иначе: блюда заводит менеджер, а не касса.
   */
  if (categories.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-slate-500">
        В меню заведения нет ни одной категории.
      </p>
    );
  }

  return null;
}
