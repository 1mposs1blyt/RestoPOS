import type {
  ISODateString,
  Money,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  TableStatus,
  UUID,
} from "./common";

export interface Table {
  id: UUID;
  venueId: UUID;
  label: string;
  status: TableStatus;
}

export interface Order {
  id: UUID;
  venueId: UUID;
  /** `null` — заказ без стола: навынос или с прилавка. */
  tableId: UUID | null;
  shiftId: UUID;
  waiterId: UUID;
  status: OrderStatus;
  /**
   * Порядковый номер заказа в смене. На прилавке его называют гостю и печатают
   * в чеке — без него выданную еду не с чем сопоставить, ведь стола нет.
   */
  number: number;
  createdAt: ISODateString;
  /**
   * Временный идентификатор, присвоенный терминалом в офлайне.
   * Сервер использует его для идемпотентной привязки при синхронизации,
   * чтобы повторная отправка очереди не создала дубль заказа.
   */
  clientId?: string;
}

export interface OrderItem {
  id: UUID;
  orderId: UUID;
  menuItemId: UUID;
  quantity: number;
  status: OrderItemStatus;
  /** Идентификаторы применённых модификаторов (`order_item_modifiers`). */
  modifierIds: UUID[];
}

export interface Payment {
  id: UUID;
  orderId: UUID;
  method: PaymentMethod;
  amount: Money;
  tipAmount: Money;
  paidAt: ISODateString;
}
