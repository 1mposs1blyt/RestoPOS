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
  tableId: UUID | null;
  shiftId: UUID;
  waiterId: UUID;
  status: OrderStatus;
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
