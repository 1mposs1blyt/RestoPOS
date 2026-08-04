import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { ISODateString, UUID } from "@restopos/shared-types";
import { loadState, saveState } from "../lib/storage";

/**
 * Стоп-лист: чего сегодня нет.
 *
 * Хранит **остаток**, а не просто флаг «нет». Разница существенная: «осталось
 * три порции» и «кончилось» — разные сообщения официанту, и первое позволяет
 * дораспродать то, что есть, вместо того чтобы снимать блюдо с продажи целиком.
 *
 * Запись хранит, кто и когда внёс: в конце смены разбирают, почему полдня
 * не продавали хит меню.
 */

const STORAGE_KEY = "stoplist";

export interface StopListEntry {
  menuItemId: UUID;
  /** Сколько ещё можно продать. `0` — кончилось совсем. */
  remainder: number;
  staffId: UUID;
  at: ISODateString;
}

interface StopListState {
  entries: Record<UUID, StopListEntry>;
}

const EMPTY: StopListState = { entries: {} };

type Action =
  | { type: "put"; entry: StopListEntry }
  | { type: "remove"; menuItemId: UUID }
  | { type: "clear" };

function reducer(state: StopListState, action: Action): StopListState {
  switch (action.type) {
    case "put":
      return {
        entries: {
          ...state.entries,
          [action.entry.menuItemId]: action.entry,
        },
      };

    case "remove": {
      const { [action.menuItemId]: _removed, ...rest } = state.entries;
      return { entries: rest };
    }

    case "clear":
      return EMPTY;

    default:
      return state;
  }
}

interface StopListValue {
  entries: StopListEntry[];
  /** Есть ли позиция в стоп-листе (остаток исчерпан или задан нулём). */
  isStopped: (menuItemId: UUID) => boolean;
  entryOf: (menuItemId: UUID) => StopListEntry | undefined;
  put: (menuItemId: UUID, remainder: number) => void;
  remove: (menuItemId: UUID) => void;
  clear: () => void;
}

const StopListContext = createContext<StopListValue | null>(null);

export function StopListProvider({
  staffId,
  children,
}: {
  staffId: UUID;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    loadState<StopListState>(STORAGE_KEY, EMPTY),
  );

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  const value = useMemo<StopListValue>(() => {
    const entries = Object.values(state.entries).sort((a, b) =>
      b.at.localeCompare(a.at),
    );
    return {
      entries,
      isStopped: (menuItemId) => {
        const entry = state.entries[menuItemId];
        // Запись с положительным остатком — это предупреждение, а не запрет:
        // блюдо ещё можно продать, и гасить кнопку рано.
        return entry !== undefined && entry.remainder <= 0;
      },
      entryOf: (menuItemId) => state.entries[menuItemId],
      put: (menuItemId, remainder) =>
        dispatch({
          type: "put",
          entry: {
            menuItemId,
            remainder: Math.max(0, remainder),
            staffId,
            at: new Date().toISOString(),
          },
        }),
      remove: (menuItemId) => dispatch({ type: "remove", menuItemId }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [state, staffId]);

  return (
    <StopListContext.Provider value={value}>{children}</StopListContext.Provider>
  );
}

export function useStopList(): StopListValue {
  const value = useContext(StopListContext);
  if (!value) {
    throw new Error("useStopList вызван вне StopListProvider");
  }
  return value;
}
