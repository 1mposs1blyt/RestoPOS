import { useMemo, useState } from "react";
import { TextKeyboard, cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { useGuests, type Guest } from "../state/guests";

/**
 * Список гостей заведения.
 *
 * Поиск с экранной клавиатурой — на кассе физической нет, а имя и телефон
 * набирают пальцем. Клавиатуру можно свернуть: в списке из десятка гостей
 * искать нечего, а она занимает пол-экрана.
 *
 * Это справочник постоянных гостей, а не гостей за столом: последние
 * безымянны и живут номерами в заказе (`OrderItem.guestNumber`).
 */
export function GuestsScreen() {
  const { can } = useAccess();
  const { back } = useNavigation();
  const { search, create, update, remove } = useGuests();
  const [query, setQuery] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [draft, setDraft] = useState<Omit<Guest, "id" | "createdAt">>({
    fullName: "",
    phone: "",
    comment: "",
  });

  const canEdit = can("guest.manage");
  const found = useMemo(() => search(query), [search, query]);

  const startNew = () => {
    setEditing(null);
    setDraft({ fullName: "", phone: "", comment: "" });
  };

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="flex shrink-0 items-baseline gap-4 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <h1 className="text-lg font-black tracking-wide">Список гостей</h1>
        <span className="text-sm text-slate-500">Найдено: {found.length}</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col border-r border-slate-800">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-800 p-3">
            <button
              type="button"
              aria-label="Экранная клавиатура"
              onClick={() => setShowKeyboard((prev) => !prev)}
              className={cn(
                "min-h-14 w-16 rounded-lg border text-lg transition",
                showKeyboard
                  ? "border-transparent bg-orange-500 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-400",
              )}
            >
              ⌨
            </button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Имя или телефон"
              className="min-h-14 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 text-base text-slate-100 placeholder:text-slate-600"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="min-h-14 w-14 rounded-lg border border-slate-700 bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {found.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-600">
                {query ? "Никого не нашлось." : "Список пуст."}
              </p>
            ) : (
              <ul className="divide-y divide-slate-900">
                {found.map((guest) => (
                  <li key={guest.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(guest);
                        setDraft({
                          fullName: guest.fullName,
                          phone: guest.phone,
                          comment: guest.comment,
                        });
                      }}
                      className={cn(
                        "flex min-h-16 w-full items-center gap-4 px-5 text-left transition active:bg-slate-800",
                        editing?.id === guest.id && "bg-orange-500/15",
                      )}
                    >
                      <span className="flex-1 text-sm font-bold text-slate-200">
                        {guest.fullName}
                      </span>
                      <span className="text-sm tabular-nums text-slate-500">
                        {guest.phone}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showKeyboard && (
            <TextKeyboard
              value={query}
              onChange={setQuery}
              className="shrink-0 rounded-none border-x-0 border-b-0"
            />
          )}
        </section>

        <section className="flex min-h-0 w-96 shrink-0 flex-col overflow-y-auto p-4">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">
            {editing ? "Гость" : "Новый гость"}
          </h2>

          <Field
            label="Имя"
            value={draft.fullName}
            onChange={(fullName) => setDraft((prev) => ({ ...prev, fullName }))}
          />
          <Field
            label="Телефон"
            value={draft.phone}
            inputMode="tel"
            onChange={(phone) => setDraft((prev) => ({ ...prev, phone }))}
          />
          <Field
            label="Комментарий"
            value={draft.comment}
            onChange={(comment) => setDraft((prev) => ({ ...prev, comment }))}
          />

          <div className="mt-3 space-y-2">
            <button
              type="button"
              // Гость без имени неотличим от следующего такого же: сохранять
              // пустую карточку значит копить мусор в справочнике.
              disabled={!canEdit || draft.fullName.trim() === ""}
              onClick={() => {
                if (editing) update({ ...editing, ...draft });
                else create(draft);
                startNew();
              }}
              className="min-h-14 w-full rounded-xl bg-orange-500 text-sm font-black text-white transition active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
            >
              {editing ? "Сохранить" : "Добавить"}
            </button>
            {editing && (
              <>
                <button
                  type="button"
                  onClick={startNew}
                  className="min-h-14 w-full rounded-xl border border-slate-700 text-sm font-bold text-slate-300 transition active:bg-slate-800"
                >
                  Новый гость
                </button>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    remove(editing.id);
                    startNew();
                  }}
                  className="min-h-14 w-full rounded-xl border border-rose-900/60 text-sm font-bold text-rose-300 transition active:bg-rose-950/40 disabled:opacity-40"
                >
                  Удалить
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      <footer className="flex shrink-0 border-t border-slate-800 bg-slate-900">
        <button
          type="button"
          onClick={back}
          className="min-h-16 min-w-32 px-6 text-sm font-bold text-slate-300 transition active:bg-slate-800"
        >
          Назад
        </button>
      </footer>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  inputMode?: "tel" | "text";
}) {
  return (
    <label className="mb-3 block">
      <span className="text-xs uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-14 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-base text-slate-100"
      />
    </label>
  );
}
