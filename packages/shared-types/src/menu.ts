import type { Money, PrepStation, UUID } from "./common";

export interface MenuCategory {
  id: UUID;
  venueId: UUID;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: UUID;
  categoryId: UUID;
  name: string;
  price: Money;
  /** Стоп-лист: позиция видна, но недоступна к заказу. */
  isStopListed: boolean;
  prepStation: PrepStation | null;
}

export interface Modifier {
  id: UUID;
  menuItemId: UUID;
  name: string;
  /** Может быть отрицательной («без сыра» со скидкой). */
  priceDelta: Money;
}
