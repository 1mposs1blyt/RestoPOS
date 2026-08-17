import type { UUID } from "@restopos/shared-types";
import { isNodeConfigured, nodeApi } from "../api";

/**
 * Занятость столов: какие заказы сейчас живут в зале.
 *
 * Третье место (после `session-source` и `tables-source`), знающее про узел.
 * Стору и экрану отдаётся готовый список — откуда он взялся, их не касается.
 *
 * Отдельно от `state/orders.tsx` намеренно. Локальный стор — это полный заказ
 * с позициями, скидками и оплатой; здесь же нужен минимум, которым зал красит
 * стол: чей стол, сколько гостей, с какого момента. Тянуть ради этого весь
 * заказ с узла значило бы грузить состав счёта на каждый перерисованный зал.
 */

/**
 * Статусы, при которых стол считается занятым.
 *
 * Совпадают с `ACTIVE_STATUSES` локального стора и с частичным индексом
 * `idx_orders_active` в схеме. `paid` и `canceled` стол освобождают.
 */
const ACTIVE_STATUSES = ["open", "sent_to_kitchen"] as const;

/** Заказ, занимающий стол. Денег здесь нет — см. `NodeOrderSummary.totalAmount`. */
export interface Occupancy {
  orderId: UUID;
  tableId: UUID;
  guestCount: number;
  createdAt: string;
}

/** Берётся ли занятость с узла. `false` — зал живёт на локальном сторе. */
export function occupancyFromNode(): boolean {
  return isNodeConfigured();
}

/**
 * Активные заказы заведения.
 *
 * Запросов два, по одному на статус, и это не лишнее. `GET /orders` без
 * параметра `status` возвращает **все** заказы заведения, включая оплаченные
 * и отменённые: фильтра активных у узла нет (`HallRepository`, условие
 * `@Status IS NULL OR status = @Status`). Забрать всё и отсеять на клиенте
 * значило бы тянуть историю заведения за всю его жизнь на каждое обновление
 * зала — к концу первого месяца это мегабайты на стол.
 */
export async function fetchOccupancy(venueId: UUID): Promise<Occupancy[]> {
  if (!isNodeConfigured()) return [];

  const api = nodeApi("pos");
  const batches = await Promise.all(
    ACTIVE_STATUSES.map((status) => api.venueOrders(venueId, status)),
  );

  return batches.flat().map((order) => ({
    orderId: order.id,
    tableId: order.tableId,
    guestCount: order.guestCount,
    createdAt: order.createdAt,
  }));
}
