import type { MeasurementUnit, UUID } from "./common";

/** Модуль склада доступен на тарифе Standard и выше (feature `warehouse`). */
export interface WarehouseItem {
  id: UUID;
  venueId: UUID;
  name: string;
  unit: MeasurementUnit;
  /** `NUMERIC(12,3)` — строкой, см. комментарий к `Money`. */
  quantity: string;
}

/** Техкарта: сколько склада списывается при продаже одной позиции меню. */
export interface MenuItemIngredient {
  menuItemId: UUID;
  warehouseItemId: UUID;
  quantityUsed: string;
}
