import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { ISODateString, UUID } from "@restopos/shared-types";
import { loadState, newId, saveState } from "../lib/storage";

/**
 * Гости заведения — постоянные, с именем и телефоном.
 *
 * Не путать с гостями заказа: те безымянны и различаются номером за столом
 * (`OrderItem.guestNumber`). Здесь — справочник тех, кого узнают: по телефону
 * находят при доставке, по имени здороваются в зале.
 *
 * Заготовка под лояльность: скидка и накопления навесятся сюда, а не на заказ.
 */

const STORAGE_KEY = "guests";

export interface Guest {
  id: UUID;
  fullName: string;
  phone: string;
  comment: string;
  createdAt: ISODateString;
}

interface GuestsState {
  guests: Record<UUID, Guest>;
}

const EMPTY: GuestsState = { guests: {} };

type Action =
  | { type: "save"; guest: Guest }
  | { type: "remove"; id: UUID };

function reducer(state: GuestsState, action: Action): GuestsState {
  switch (action.type) {
    case "save":
      return { guests: { ...state.guests, [action.guest.id]: action.guest } };

    case "remove": {
      const { [action.id]: _removed, ...rest } = state.guests;
      return { guests: rest };
    }

    default:
      return state;
  }
}

interface GuestsValue {
  guests: Guest[];
  /** Поиск по имени и телефону разом: гостя ищут и так, и так. */
  search: (query: string) => Guest[];
  create: (input: Omit<Guest, "id" | "createdAt">) => void;
  update: (guest: Guest) => void;
  remove: (id: UUID) => void;
}

const GuestsContext = createContext<GuestsValue | null>(null);

export function GuestsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    loadState<GuestsState>(STORAGE_KEY, EMPTY),
  );

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  const value = useMemo<GuestsValue>(() => {
    const guests = Object.values(state.guests).sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "ru"),
    );
    return {
      guests,
      search: (query) => {
        const needle = query.trim().toLowerCase();
        if (needle === "") return guests;
        return guests.filter(
          (guest) =>
            guest.fullName.toLowerCase().includes(needle) ||
            // По телефону ищут обрывком («…3344»), поэтому подстрока,
            // а не совпадение с начала.
            guest.phone.replace(/\D/g, "").includes(needle.replace(/\D/g, "")),
        );
      },
      create: (input) =>
        dispatch({
          type: "save",
          guest: { ...input, id: newId(), createdAt: new Date().toISOString() },
        }),
      update: (guest) => dispatch({ type: "save", guest }),
      remove: (id) => dispatch({ type: "remove", id }),
    };
  }, [state]);

  return (
    <GuestsContext.Provider value={value}>{children}</GuestsContext.Provider>
  );
}

export function useGuests(): GuestsValue {
  const value = useContext(GuestsContext);
  if (!value) {
    throw new Error("useGuests вызван вне GuestsProvider");
  }
  return value;
}
