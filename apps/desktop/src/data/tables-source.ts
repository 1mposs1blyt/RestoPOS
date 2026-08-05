import type { TableLayout, TableShape, UUID } from "@restopos/shared-types";
import type { NodeTable } from "@restopos/api-client";
import { isNodeConfigured, nodeApi } from "../api";
import { loadState, saveState } from "../lib/storage";
import { normalizeTables } from "../state/tables-migration";

/**
 * Откуда терминал берёт расстановку зала.
 *
 * Второе место (после `session-source`), которое знает, работаем мы против узла
 * или на локальном состоянии. Стор и экран об этом не знают: им отдаётся готовый
 * `TableLayout[]` и обещание, что перемещение сохранится, — где именно, их
 * не касается.
 *
 * Схема, нарисованная на одном терминале, обязана открыться на остальных,
 * поэтому с узлом она приезжает из БД, а localStorage остаётся только
 * для демо-режима.
 */

const STORAGE_KEY = "hall.layout";
/** Ключ до появления сторов — читаем один раз, чтобы не потерять расстановку. */
const LEGACY_KEY = "iiko_table_scheme";

/**
 * Может ли источник менять состав зала: добавлять, удалять, переименовывать.
 *
 * У узла таких маршрутов пока нет — есть только `PUT .../tables/{id}`
 * с геометрией. Признак нужен экрану: кнопки, которые заведомо не сохранятся,
 * лучше не показывать вовсе, чем дать менеджеру разложить зал и потерять
 * его при первом же обновлении.
 */
export function supportsStructureEdit(): boolean {
  return !isNodeConfigured();
}

/**
 * Форма стола: у узла их две, у схемы зала три.
 *
 * В БД `shape` ограничен `rect`/`circle`, и квадрат отдельным значением
 * не выражается — он и есть прямоугольник с равными сторонами. Разбираем это
 * здесь, в одном месте, а не в вёрстке.
 */
function shapeOf(table: NodeTable): TableShape {
  if (table.shape === "circle") return "circle";
  return table.width === table.height ? "square" : "rectangle";
}

function fromNode(table: NodeTable): TableLayout {
  return {
    id: table.id,
    venueId: table.venueId,
    label: table.label,
    shape: shapeOf(table),
    cx: table.cx,
    cy: table.cy,
    width: table.width,
    height: table.height,
  };
}

/**
 * Чтение локальной расстановки с приведением к текущему формату.
 *
 * В localStorage могут лежать данные трёх поколений: самое старое под ключом
 * `iiko_table_scheme`, затем абсолютные `x`/`y`, и текущее — доли `cx`/`cy`.
 * Терять чужую расстановку при обновлении версии нельзя, поэтому конвертируем
 * (сам пересчёт — в `tables-migration.ts`, он покрыт тестами).
 */
function loadLocal(venueId: UUID): TableLayout[] {
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

export function saveLocal(tables: TableLayout[]): void {
  saveState(STORAGE_KEY, tables);
}

/** Расстановка заведения. С узлом — из БД, без узла — из localStorage. */
export async function fetchTables(venueId: UUID): Promise<TableLayout[]> {
  if (!isNodeConfigured()) return loadLocal(venueId);

  const tables = await nodeApi("pos").tables(venueId);
  return tables.map(fromNode);
}

/**
 * Сохранение положения стола.
 *
 * Вызывается на каждое движение пальца при перетаскивании, поэтому запрос
 * шлётся не отсюда: стор двигает стол у себя сразу, а сюда отдаёт уже
 * осевшее положение (см. `tables.tsx`). Иначе один перенос стола через зал
 * означал бы полсотни PUT подряд.
 */
export async function persistTableLayout(
  venueId: UUID,
  table: TableLayout,
): Promise<void> {
  if (!isNodeConfigured()) return;

  await nodeApi("pos").updateTableLayout(venueId, table.id, {
    cx: table.cx,
    cy: table.cy,
    width: table.width,
    height: table.height,
  });
}
