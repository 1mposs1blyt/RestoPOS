import type { Server as IoServer } from "socket.io";
import {
  EVENT_TOPICS,
  type OrderCreatedEvent,
  type OrderItemStatusChangedEvent,
  type TableStatusChangedEvent,
  type TerminalKind,
  type UUID,
} from "@restopos/shared-types";
import { roomName } from "./rooms";

/**
 * Рассылка события в комнаты заведения. В payload — ТОЛЬКО идентификаторы:
 * событие лишь сигнал «данные изменились, перезапроси», источник истины — БД
 * (инвариант №3). Полный заказ в событие не кладём.
 */
function emit(
  io: IoServer,
  venueId: UUID,
  kinds: TerminalKind[],
  topic: string,
  payload: unknown,
): void {
  let target = io.to(roomName(venueId, kinds[0]));
  for (const kind of kinds.slice(1)) target = target.to(roomName(venueId, kind));
  target.emit(topic, payload);
}

/** Новый заказ: важен кухне (новый тикет) и другим кассам/админке зала. */
export function emitOrderCreated(io: IoServer, e: OrderCreatedEvent): void {
  emit(io, e.venueId, ["kds", "pos", "admin"], EVENT_TOPICS.ORDER_CREATED, e);
}

/** Смена статуса позиции: касса ↔ кухня. */
export function emitOrderItemStatusChanged(
  io: IoServer,
  e: OrderItemStatusChangedEvent,
): void {
  emit(io, e.venueId, ["pos", "kds"], EVENT_TOPICS.ORDER_ITEM_STATUS_CHANGED, e);
}

/** Статус стола — событие зала, кухне не адресуется. */
export function emitTableStatusChanged(
  io: IoServer,
  e: TableStatusChangedEvent,
): void {
  emit(io, e.venueId, ["pos", "admin"], EVENT_TOPICS.TABLE_STATUS_CHANGED, e);
}
