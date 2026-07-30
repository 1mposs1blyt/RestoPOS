import type {
  ISODateString,
  OrderItemStatus,
  TableStatus,
  UUID,
} from "./common";

/**
 * Топики WebSocket-событий. Имя строится как `entity.action`.
 *
 * Важно: событие — это только уведомление «данные изменились, перезапроси».
 * Полное состояние заказа в payload не кладём — источник истины всегда БД,
 * иначе зал и кухня расходятся при потере/переупорядочивании сообщений.
 */
export const EVENT_TOPICS = {
  ORDER_CREATED: "order.created",
  ORDER_ITEM_STATUS_CHANGED: "order_item.status_changed",
  TABLE_STATUS_CHANGED: "table.status_changed",
} as const;

export type EventTopic = (typeof EVENT_TOPICS)[keyof typeof EVENT_TOPICS];

interface BaseEvent {
  venueId: UUID;
  at: ISODateString;
}

export interface OrderCreatedEvent extends BaseEvent {
  orderId: UUID;
  tableId: UUID | null;
}

export interface OrderItemStatusChangedEvent extends BaseEvent {
  orderId: UUID;
  orderItemId: UUID;
  status: OrderItemStatus;
}

export interface TableStatusChangedEvent extends BaseEvent {
  tableId: UUID;
  status: TableStatus;
}

/** Связывает топик с типом его payload — даёт типобезопасный `on()` в ApiClient. */
export interface EventPayloadMap {
  "order.created": OrderCreatedEvent;
  "order_item.status_changed": OrderItemStatusChangedEvent;
  "table.status_changed": TableStatusChangedEvent;
}
