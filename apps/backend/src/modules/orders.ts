import type { FastifyInstance } from "fastify";
import type { Order, UUID } from "@restopos/shared-types";
import { query, tx } from "../db/pool";
import { requireRole } from "../billing/entitlements";
import { badRequest, forbidden } from "../http/errors";
import { getIo } from "../realtime/io";
import { emitOrderCreated } from "../realtime/events";

interface CreateOrderBody {
  tableId?: UUID | null;
  shiftId: UUID;
  /** Временный id офлайн-заказа для идемпотентной синхронизации. */
  clientId?: string;
}

// Столбцы orders → поля Order (camelCase) одним фрагментом, чтобы не дублировать.
const ORDER_COLS = `id, venue_id AS "venueId", table_id AS "tableId",
  shift_id AS "shiftId", waiter_id AS "waiterId", status,
  client_id AS "clientId", created_at AS "createdAt"`;

/**
 * Пример модуля заказов. Показывает три инварианта разом: фильтрацию по venueId
 * из контекста, проверку роли и рассылку события без состояния в payload.
 */
export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  app.get("/venues/:venueId/orders", async (req) => {
    const { venueId } = req.params as { venueId: UUID };
    assertSameVenue(req.ctx.venueId, venueId);
    return query<Order>(
      `SELECT ${ORDER_COLS} FROM orders
        WHERE venue_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [venueId],
    );
  });

  app.post(
    "/venues/:venueId/orders",
    { preHandler: requireRole("waiter", "cashier", "manager") },
    async (req, reply) => {
      const { venueId } = req.params as { venueId: UUID };
      assertSameVenue(req.ctx.venueId, venueId);

      const body = req.body as CreateOrderBody | undefined;
      if (!body?.shiftId) throw badRequest("shiftId обязателен");

      const [order] = await tx(async (client) => {
        const res = await client.query<Order>(
          `INSERT INTO orders (venue_id, table_id, shift_id, waiter_id, status, client_id)
           VALUES ($1, $2, $3, $4, 'open', $5)
           RETURNING ${ORDER_COLS}`,
          [
            venueId,
            body.tableId ?? null,
            body.shiftId,
            req.ctx.staffId,
            body.clientId ?? null,
          ],
        );
        return res.rows;
      });

      // Событие — только сигнал «перезапроси», без данных заказа.
      emitOrderCreated(getIo(), {
        venueId,
        orderId: order.id,
        tableId: order.tableId,
        at: order.createdAt,
      });

      reply.status(201);
      return order;
    },
  );
}

/** venueId в пути обязан совпадать с venueId контекста — нельзя лезть в чужую точку. */
function assertSameVenue(ctxVenue: UUID, paramVenue: UUID): void {
  if (ctxVenue !== paramVenue) {
    throw forbidden("venue_id не соответствует контексту терминала");
  }
}
