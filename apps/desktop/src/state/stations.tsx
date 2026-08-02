import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { PrepStation, StationOutput, UUID } from "@restopos/shared-types";
import { hasScreen } from "@restopos/shared-types";
import { loadState, newId, saveState } from "../lib/storage";

/**
 * Станции приготовления заведения и их точки вывода.
 *
 * Справочник, а не перечисление: у ресторана бывают холодный и горячий цеха,
 * пицца, суши, бар — двумя зашитыми значениями это не описать, а менять
 * перечисление под каждого клиента означает пересборку ради данных.
 *
 * Экран и принтер лежат в одной таблице выводов намеренно (см. `kitchen.ts`
 * в shared-types): «на кухне монитор и принтер дублируют друг друга» — это
 * станция с двумя выводами, а не отдельная ветка в коде.
 */

const STATIONS_KEY = "kitchen.stations";
const OUTPUTS_KEY = "kitchen.outputs";

const VENUE_ID: UUID = "venue-demo";

/**
 * Стартовая конфигурация: кухня с экраном и (выключенным) принтером, бар
 * с экраном. Принтер выключен, потому что по адресу из сида его нет, а марка,
 * молча падающая в ошибку при каждом заказе, — плохой первый опыт. Включается
 * на экране станций, когда железо появилось.
 */
const SEED_STATIONS: PrepStation[] = [
  { id: "station-kitchen", venueId: VENUE_ID, name: "Кухня", sortOrder: 1 },
  { id: "station-bar", venueId: VENUE_ID, name: "Бар", sortOrder: 2 },
];

const SEED_OUTPUTS: StationOutput[] = [
  {
    id: "output-kitchen-screen",
    stationId: "station-kitchen",
    kind: "screen",
    name: "Монитор кухни",
    host: null,
    port: null,
    isEnabled: true,
  },
  {
    id: "output-kitchen-printer",
    stationId: "station-kitchen",
    kind: "printer",
    name: "Принтер кухни",
    host: "192.168.1.50",
    port: 9100,
    isEnabled: false,
  },
  {
    id: "output-bar-screen",
    stationId: "station-bar",
    kind: "screen",
    name: "Монитор бара",
    host: null,
    port: null,
    isEnabled: true,
  },
];

interface StationsState {
  stations: PrepStation[];
  outputs: StationOutput[];
}

type StationsAction =
  | { type: "station/add"; name: string }
  | { type: "station/rename"; stationId: UUID; name: string }
  | { type: "station/remove"; stationId: UUID }
  | { type: "output/add"; output: StationOutput }
  | { type: "output/update"; outputId: UUID; patch: Partial<StationOutput> }
  | { type: "output/remove"; outputId: UUID };

function reducer(state: StationsState, action: StationsAction): StationsState {
  switch (action.type) {
    case "station/add": {
      const sortOrder =
        state.stations.reduce((max, s) => Math.max(max, s.sortOrder), 0) + 1;
      return {
        ...state,
        stations: [
          ...state.stations,
          { id: newId(), venueId: VENUE_ID, name: action.name, sortOrder },
        ],
      };
    }

    case "station/rename":
      return {
        ...state,
        stations: state.stations.map((station) =>
          station.id === action.stationId
            ? { ...station, name: action.name }
            : station,
        ),
      };

    case "station/remove":
      // Выводы удаляем вместе со станцией: осиротевший вывод не получает
      // тикеты никогда, но продолжает занимать место в настройках.
      return {
        stations: state.stations.filter((s) => s.id !== action.stationId),
        outputs: state.outputs.filter((o) => o.stationId !== action.stationId),
      };

    case "output/add":
      return { ...state, outputs: [...state.outputs, action.output] };

    case "output/update":
      return {
        ...state,
        outputs: state.outputs.map((output) =>
          output.id === action.outputId ? { ...output, ...action.patch } : output,
        ),
      };

    case "output/remove":
      return {
        ...state,
        outputs: state.outputs.filter((o) => o.id !== action.outputId),
      };
  }
}

interface StationsValue {
  stations: PrepStation[];
  outputs: StationOutput[];
  findStation: (stationId: UUID | null) => PrepStation | undefined;
  outputsOf: (stationId: UUID) => StationOutput[];
  /** Есть ли у станции включённый экран. Нет — станция работает по бумаге. */
  hasScreenOf: (stationId: UUID) => boolean;
  addStation: (name: string) => void;
  renameStation: (stationId: UUID, name: string) => void;
  removeStation: (stationId: UUID) => void;
  addOutput: (stationId: UUID, kind: StationOutput["kind"]) => void;
  updateOutput: (outputId: UUID, patch: Partial<StationOutput>) => void;
  removeOutput: (outputId: UUID) => void;
}

const StationsContext = createContext<StationsValue | null>(null);

export function StationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    stations: loadState<PrepStation[]>(STATIONS_KEY, SEED_STATIONS),
    outputs: loadState<StationOutput[]>(OUTPUTS_KEY, SEED_OUTPUTS),
  }));

  useEffect(() => {
    saveState(STATIONS_KEY, state.stations);
    saveState(OUTPUTS_KEY, state.outputs);
  }, [state]);

  const findStation = useCallback(
    (stationId: UUID | null) =>
      stationId === null
        ? undefined
        : state.stations.find((station) => station.id === stationId),
    [state.stations],
  );

  const outputsOf = useCallback(
    (stationId: UUID) =>
      state.outputs.filter((output) => output.stationId === stationId),
    [state.outputs],
  );

  const hasScreenOf = useCallback(
    (stationId: UUID) => hasScreen(stationId, state.outputs),
    [state.outputs],
  );

  const value = useMemo<StationsValue>(
    () => ({
      stations: [...state.stations].sort((a, b) => a.sortOrder - b.sortOrder),
      outputs: state.outputs,
      findStation,
      outputsOf,
      hasScreenOf,
      addStation: (name) => dispatch({ type: "station/add", name }),
      renameStation: (stationId, name) =>
        dispatch({ type: "station/rename", stationId, name }),
      removeStation: (stationId) =>
        dispatch({ type: "station/remove", stationId }),
      addOutput: (stationId, kind) =>
        dispatch({
          type: "output/add",
          output: {
            id: newId(),
            stationId,
            kind,
            name: kind === "screen" ? "Экран" : "Принтер",
            // Сетевой ESC/POS слушает 9100 почти всегда — это не «магическое
            // число», а отраслевой порт (RAW/JetDirect).
            host: kind === "printer" ? "192.168.1.50" : null,
            port: kind === "printer" ? 9100 : null,
            isEnabled: kind === "screen",
          },
        }),
      updateOutput: (outputId, patch) =>
        dispatch({ type: "output/update", outputId, patch }),
      removeOutput: (outputId) => dispatch({ type: "output/remove", outputId }),
    }),
    [state, findStation, outputsOf, hasScreenOf],
  );

  return (
    <StationsContext.Provider value={value}>{children}</StationsContext.Provider>
  );
}

export function useStations(): StationsValue {
  const value = useContext(StationsContext);
  if (!value) {
    throw new Error("useStations вызван вне StationsProvider");
  }
  return value;
}
