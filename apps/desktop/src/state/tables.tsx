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

const SHAPE_SIZES: Record<TableShape, { width: number; height: number }> = {
  rectangle: { width: 140, height: 90 },
  square: { width: 90, height: 90 },
  circle: { width: 100, height: 100 },
};

/**
 * Размеры прежней логической поверхности. Нужны только для пересчёта старых
 * расстановок в доли — новые координаты в ней уже не выражаются.
 */
const LEGACY_SURFACE = { width: 1600, height: 900 };

interface LegacyTable {
  id: string;
  venueId?: UUID;
  /** Ключ `number` — самая первая версия, `label` — вторая. */
  number?: string;
  label?: string;
  type?: TableShape;
  shape?: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** Пересчёт стола из абсолютных координат в доли холста. */
function toNormalized(table: LegacyTable, venueId: UUID): TableLayout {
  return {
    id: table.id,
    venueId: table.venueId ?? venueId,
    label: table.label ?? table.number ?? "?",
    shape: table.shape ?? table.type ?? "square",
    cx: clamp01((table.x + table.width / 2) / LEGACY_SURFACE.width),
    cy: clamp01((table.y + table.height / 2) / LEGACY_SURFACE.height),
    width: table.width,
    height: table.height,
  };
}

/**
 * Чтение расстановки с приведением к текущему формату.
 *
 * В localStorage могут лежать данные трёх поколений: самое старое под ключом
 * `iiko_table_scheme`, затем абсолютные `x`/`y`, и текущее — доли `cx`/`cy`.
 * Терять чужую расстановку при обновлении версии нельзя, поэтому конвертируем.
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

    return raw.map((entry) => {
      const table = entry as LegacyTable & Partial<TableLayout>;
      return typeof table.cx === "number"
        ? (table as TableLayout)
        : toNormalized(table, venueId);
    });
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
