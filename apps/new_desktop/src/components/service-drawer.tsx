import type { ServiceScreen } from "../screens/routes";

interface ServiceDrawerProps {
  onNavigate: (screen: ServiceScreen) => void;
  onLock: () => void;
  onClose: () => void;
  /** Подпись под «Кассовой сменой»: закрытая смена запрещает продажу. */
  shiftHint: string;
}

/**
 * Служебное меню кассира.
 *
 * Отдельного экрана-хаба у прилавка нет: кассир весь день продаёт, и экран,
 * через который надо пройти, чтобы начать продавать, — лишнее нажатие
 * на каждом госте. Всё непродажное живёт здесь, за одной кнопкой.
 */
export function ServiceDrawer({
  onNavigate,
  onLock,
  onClose,
  shiftHint,
}: ServiceDrawerProps) {
  const entries: { id: ServiceScreen; title: string; hint: string }[] = [
    { id: "shift", title: "Кассовая смена", hint: shiftHint },
    { id: "stoplist", title: "Стоп-лист", hint: "что кончилось и сколько осталось" },
    { id: "refund", title: "Возврат по чеку", hint: "вернуть деньги гостю" },
  ];

  return (
    <div className="absolute inset-0 z-10 flex justify-end bg-black/60">
      {/* Тап мимо панели закрывает её: на сенсорном экране это привычнее крестика. */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="flex-1"
      />
      <aside className="flex w-96 flex-col border-l border-neutral-700 bg-neutral-900 p-4">
        <p className="px-2 py-3 text-xs tracking-widest text-neutral-500">
          СЛУЖЕБНОЕ
        </p>
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onNavigate(entry.id)}
              className="min-h-16 rounded-xl bg-neutral-800 px-4 text-left active:bg-neutral-700"
            >
              <span className="block text-lg font-semibold text-white">
                {entry.title}
              </span>
              <span className="block text-sm text-neutral-400">{entry.hint}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={onLock}
            className="min-h-16 rounded-xl bg-neutral-800 px-4 text-left active:bg-neutral-700"
          >
            <span className="block text-lg font-semibold text-white">
              Блокировать терминал
            </span>
            <span className="block text-sm text-neutral-400">отойти от кассы</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
