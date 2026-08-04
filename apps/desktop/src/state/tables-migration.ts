import type { TableLayout, TableShape, UUID } from "@restopos/shared-types";

/**
 * Приведение расстановки зала к текущему формату.
 *
 * Вынесено из `tables.tsx` без React: это чистые функции, и именно они
 * решают судьбу чужих данных. В localStorage терминала могут лежать три
 * поколения формата, а терять расстановку при обновлении версии нельзя —
 * менеджер раскладывал её руками.
 */

export const SHAPE_SIZES: Record<TableShape, { width: number; height: number }> =
  {
    rectangle: { width: 140, height: 90 },
    square: { width: 90, height: 90 },
    circle: { width: 100, height: 100 },
  };

/**
 * Размеры прежней логической поверхности. Нужны только для пересчёта старых
 * расстановок в доли — новые координаты в ней уже не выражаются.
 */
const LEGACY_SURFACE = { width: 1600, height: 900 };

export interface LegacyTable {
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

/** Доля холста не бывает вне 0..1 — стол за краем недостижим пальцем. */
export const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** Пересчёт стола из абсолютных координат в доли холста. */
export function toNormalized(table: LegacyTable, venueId: UUID): TableLayout {
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
 * Приведение прочитанного массива к текущему формату.
 *
 * Столы, у которых уже есть `cx`, оставляем как есть — это текущее поколение.
 * Остальные пересчитываем из абсолютных координат.
 */
export function normalizeTables(
  raw: readonly unknown[],
  venueId: UUID,
): TableLayout[] {
  return raw.map((entry) => {
    const table = entry as LegacyTable & Partial<TableLayout>;
    return typeof table.cx === "number"
      ? (table as TableLayout)
      : toNormalized(table, venueId);
  });
}
