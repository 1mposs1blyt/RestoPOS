import type {
  ISODateString,
  Money,
  ServiceMode,
  StaffRole,
  TerminalKind,
  UUID,
} from "./common";

export interface Venue {
  id: UUID;
  organizationId: UUID;
  name: string;
  address: string | null;
  /** Режим обслуживания. У прилавочных заведений схемы зала нет вовсе. */
  serviceMode: ServiceMode;
}

export interface Terminal {
  id: UUID;
  venueId: UUID;
  kind: TerminalKind;
  label: string | null;
  /** Станция, которую обслуживает кухонный монитор. У кассы — `null`. */
  prepStationId?: UUID | null;
}

export type TableShape = "rectangle" | "circle" | "square";

/**
 * Стол на схеме зала: геометрия расстановки.
 *
 * Отличается от `Table` тем, что несёт координаты и НЕ несёт статуса —
 * занятость вычисляется из активных заказов, иначе один факт хранился бы
 * в двух местах и они бы разъезжались.
 *
 * Живёт в общих типах, потому что расстановку хранит узел: нарисованная
 * на одном терминале схема обязана открыться на всех остальных.
 */
export interface TableLayout {
  id: UUID;
  venueId: UUID;
  label: string;
  shape: TableShape;
  /**
   * Центр стола в долях холста (0..1), а не в пикселях.
   *
   * Пиксели привязывали расстановку к разрешению того терминала, где её
   * рисовали: схема с широкого монитора уезжала за края моноблока 1024x768,
   * и до дальних столов нельзя было дотронуться.
   */
  cx: number;
  cy: number;
  /** Размер в пикселях: он НЕ масштабируется, иначе стол уходит под палец. */
  width: number;
  height: number;
}

/**
 * Сотрудник привязан к организации, а не к заведению, — он может работать
 * на нескольких точках. `pin_code_hash` на клиент не отдаётся никогда.
 */
export interface Staff {
  id: UUID;
  organizationId: UUID;
  fullName: string;
  role: StaffRole;
}

export interface Shift {
  id: UUID;
  venueId: UUID;
  openedBy: UUID;
  openedAt: ISODateString;
  closedAt: ISODateString | null;
  cashStart: Money | null;
  cashEnd: Money | null;
}
