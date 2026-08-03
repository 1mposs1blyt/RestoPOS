import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TableLayout, TableShape, UUID } from "@restopos/shared-types";
import { loadState, newId, saveState } from "../lib/storage";
import { nextTableLabel } from "./table-numbering";
import { SHAPE_SIZES, clamp01, normalizeTables } from "./tables-migration";

export { findDuplicateLabels } from "./table-numbering";

/*
 * Геометрия расстановки переехала в общие типы: её хранит узел, потому что
 * схема, нарисованная на одном терминале, обязана открыться на остальных.
 * Реэкспорт оставлен, чтобы экраны не переписывали импорты.
 */
export type { TableLayout, TableShape };

const STORAGE_KEY = "hall.layout";
/** Ключ до появления сторов — читаем один раз, чтобы не потерять расстановку. */
const LEGACY_KEY = "iiko_table_scheme";

/**
 * Чтение расстановки с приведением к текущему формату.
 *
 * В localStorage могут лежать данные трёх поколений: самое старое под ключом
 * `iiko_table_scheme`, затем абсолютные `x`/`y`, и текущее — доли `cx`/`cy`.
 * Терять чужую расстановку при обновлении версии нельзя, поэтому конвертируем
 * (сам пересчёт — в `tables-migration.ts`, он покрыт тестами).
 */
function loadTables(venueId: UUID): TableLayout[] {
  try {
    const stored = loadState<unknown[] | null>(STORAGE_KEY, null);
    const raw =
      stored ??
      (JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "null") as
        | unknown[]
        | null);
    if (!raw) return [];
    if (stored === null) localStorage.removeItem(LEGACY_KEY);

    return normalizeTables(raw, venueId);
  } catch (error) {
    console.error("Не удалось прочитать схему зала:", error);
    return [];
  }
}

interface TablesValue {
  tables: TableLayout[];
  findTable: (id: UUID) => TableLayout | undefined;
  addTable: (shape: TableShape) => void;
  /** Новый центр стола в долях холста. */
  moveTable: (id: UUID, cx: number, cy: number) => void;
  renameTable: (id: UUID, label: string) => void;
  removeTable: (id: UUID) => void;
}

const TablesContext = createContext<TablesValue | null>(null);

export function TablesProvider({
  venueId,
  children,
}: {
  venueId: UUID;
  children: ReactNode;
}) {
  const [tables, setTables] = useState<TableLayout[]>(() => loadTables(venueId));

  useEffect(() => {
    saveState(STORAGE_KEY, tables);
  }, [tables]);

  const addTable = useCallback(
    (shape: TableShape) => {
      setTables((prev) => [
        ...prev,
        {
          id: newId(),
          venueId,
          label: nextTableLabel(prev),
          shape,
          // Новый стол появляется в левом верхнем углу холста.
          cx: 0.1,
          cy: 0.14,
          ...SHAPE_SIZES[shape],
        },
      ]);
    },
    [venueId],
  );

  const moveTable = useCallback((id: UUID, cx: number, cy: number) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === id
          ? { ...table, cx: clamp01(cx), cy: clamp01(cy) }
          : table,
      ),
    );
  }, []);

  const renameTable = useCallback((id: UUID, label: string) => {
    setTables((prev) =>
      prev.map((table) => (table.id === id ? { ...table, label } : table)),
    );
  }, []);

  const removeTable = useCallback((id: UUID) => {
    setTables((prev) => prev.filter((table) => table.id !== id));
  }, []);

  const value = useMemo<TablesValue>(
    () => ({
      tables,
      findTable: (id) => tables.find((table) => table.id === id),
      addTable,
      moveTable,
      renameTable,
      removeTable,
    }),
    [tables, addTable, moveTable, renameTable, removeTable],
  );

  return (
    <TablesContext.Provider value={value}>{children}</TablesContext.Provider>
  );
}

export function useTables(): TablesValue {
  const value = useContext(TablesContext);
  if (!value) {
    throw new Error("useTables вызван вне TablesProvider");
  }
  return value;
}
