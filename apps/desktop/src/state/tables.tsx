import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TableLayout, TableShape, UUID } from "@restopos/shared-types";
import { newId } from "../lib/storage";
import {
  fetchTables,
  persistTableLayout,
  saveLocal,
  supportsStructureEdit,
} from "../data/tables-source";
import { nextTableLabel } from "./table-numbering";
import { SHAPE_SIZES, clamp01 } from "./tables-migration";

export { findDuplicateLabels } from "./table-numbering";

/*
 * Геометрия расстановки переехала в общие типы: её хранит узел, потому что
 * схема, нарисованная на одном терминале, обязана открыться на остальных.
 * Реэкспорт оставлен, чтобы экраны не переписывали импорты.
 */
export type { TableLayout, TableShape };

/** Состояние загрузки. Зал без столов и зал, который не доехал, — разное. */
export type TablesStatus = "loading" | "ready" | "error";

interface TablesValue {
  tables: TableLayout[];
  status: TablesStatus;
  /** Текст отказа для экрана. `null` — всё в порядке. */
  error: string | null;
  reload: () => void;
  findTable: (id: UUID) => TableLayout | undefined;
  /**
   * Можно ли менять состав зала. С узлом — нет: у него есть только сохранение
   * геометрии, маршрутов на создание и удаление стола пока не существует.
   */
  canEditStructure: boolean;
  addTable: (shape: TableShape) => void;
  /** Новый центр стола в долях холста. Только в памяти — см. `commitTable`. */
  moveTable: (id: UUID, cx: number, cy: number) => void;
  /**
   * Зафиксировать положение стола: палец отпущен, можно сохранять.
   *
   * Отделено от `moveTable` намеренно. Перетаскивание даёт десятки событий
   * в секунду, и слать PUT на каждое — это очередь запросов, которая приедет
   * на узел уже после того, как стол оказался в другом месте. Сохраняем один
   * раз, осевшее положение.
   */
  commitTable: (id: UUID) => void;
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
  const [tables, setTables] = useState<TableLayout[]>([]);
  const [status, setStatus] = useState<TablesStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const canEditStructure = supportsStructureEdit();

  /*
   * Свежий снимок столов для `commitTable`: он вызывается из обработчика
   * отпускания пальца и обязан взять уже сдвинутое положение, а не то, что
   * было при создании колбэка.
   */
  const tablesRef = useRef<TableLayout[]>(tables);
  tablesRef.current = tables;

  /*
   * Номер попытки. Повторов бывает несколько подряд — по кнопке «повторить»
   * и при смене заведения, — и ответ отменённой попытки не должен затирать
   * результат следующей: узел на медленном канале вполне отвечает не по порядку.
   */
  const attemptRef = useRef(0);

  const reload = useCallback(() => {
    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;

    setStatus("loading");
    setError(null);

    fetchTables(venueId)
      .then((loaded) => {
        if (attemptRef.current !== attempt) return;
        setTables(loaded);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (attemptRef.current !== attempt) return;
        // Пустой зал и недоехавший зал выглядят одинаково, а означают разное:
        // во втором случае менеджер не должен думать, что схему стёрли.
        setError(
          reason instanceof Error ? reason.message : "Не удалось загрузить зал",
        );
        setStatus("error");
      });
  }, [venueId]);

  useEffect(() => {
    reload();
  }, [reload]);

  /*
   * Локальный режим пишет всю расстановку целиком на каждое изменение —
   * источник истины здесь сам localStorage. С узлом источник истины его БД,
   * и запись идёт построчно в `commitTable`.
   */
  useEffect(() => {
    if (!canEditStructure || status !== "ready") return;
    saveLocal(tables);
  }, [tables, canEditStructure, status]);

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

  const commitTable = useCallback(
    (id: UUID) => {
      const table = tablesRef.current.find((entry) => entry.id === id);
      if (!table) return;

      persistTableLayout(venueId, table).catch((reason: unknown) => {
        // Стол уже сдвинут на экране, и откатывать его под пальцем нельзя —
        // менеджер решит, что не попал. Говорим, что не сохранилось.
        setError(
          reason instanceof Error
            ? `Стол ${table.label} не сохранён: ${reason.message}`
            : `Стол ${table.label} не сохранён`,
        );
      });
    },
    [venueId],
  );

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
      status,
      error,
      reload,
      findTable: (id) => tables.find((table) => table.id === id),
      canEditStructure,
      addTable,
      moveTable,
      commitTable,
      renameTable,
      removeTable,
    }),
    [
      tables,
      status,
      error,
      reload,
      canEditStructure,
      addTable,
      moveTable,
      commitTable,
      renameTable,
      removeTable,
    ],
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
