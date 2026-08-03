import type {
  ISODateString,
  OrderItemStatus,
  TableStatus,
  UUID,
} from "./common";
import type { ContractEventTopic } from "./contract.generated";

/**
 * Топики WebSocket-событий. Имя строится как `entity.action`.
 *
 * Важно: событие — это только уведомление «данные изменились, перезапроси».
 * Полное состояние заказа в payload не кладём — источник истины всегда БД узла,
 * иначе зал и кухня расходятся при потере или переупорядочивании сообщений.
 *
 * Список топиков живёт в `contracts/contract.json`: бэкенд читает тот же файл,
 * и опечатка в имени топика перестала быть возможной.
 */
export const EVENT_TOPICS = {
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_ITEM_STATUS_CHANGED: "order_item.status_changed",
  TABLE_STATUS_CHANGED: "table.status_changed",
  PRINT_JOB_FAILED: "print_job.failed",
  STOPLIST_CHANGED: "stoplist.changed",
} as const satisfies Record<string, ContractEventTopic>;

export type EventTopic = (typeof EVENT_TOPICS)[keyof typeof EVENT_TOPICS];

interface BaseEvent {
  venueId: UUID;
  at: ISODateString;
}

export interface OrderCreatedEvent extends BaseEvent {
  orderId: UUID;
  tableId: UUID | null;
}

/** Заказ изменился: добавили позицию, отправили на кухню, оплатили, отменили. */
export interface OrderUpdatedEvent extends BaseEvent {
  orderId: UUID;
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

/**
 * Марка не напечаталась. Уходит в комнату кассы, а не кухни: разбираться
 * с принтером идёт человек у терминала, а повар о задании и не знал.
 */
export interface PrintJobFailedEvent extends BaseEvent {
  printJobId: UUID;
  stationId: UUID;
}

/** Позицию поставили в стоп-лист или сняли с него. */
export interface StopListChangedEvent extends BaseEvent {
  menuItemId: UUID;
  isStopListed: boolean;
}

/** Связывает топик с типом его payload — даёт типобезопасный `on()` в ApiClient. */
export interface EventPayloadMap {
  "order.created": OrderCreatedEvent;
  "order.updated": OrderUpdatedEvent;
  "order_item.status_changed": OrderItemStatusChangedEvent;
  "table.status_changed": TableStatusChangedEvent;
  "print_job.failed": PrintJobFailedEvent;
  "stoplist.changed": StopListChangedEvent;
}
