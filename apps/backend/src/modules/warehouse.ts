import type { FastifyInstance } from "fastify";
import type { UUID, WarehouseItem } from "@restopos/shared-types";
import { query } from "../db/pool";
import { requireFeature } from "../billing/entitlements";
import { forbidden } from "../http/errors";

/**
 * Пример модуля под фичей: склад доступен только при тарифе с feature 'warehouse'
 * (Standard+). requireFeature стоит на КАЖДОМ эндпоинте модуля — иначе прямой
 * запрос обойдёт тариф.
 */
export async function warehouseRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/venues/:venueId/warehouse/items",
    { preHandler: requireFeature("warehouse") },
    async (req) => {
      const { venueId } = req.params as { venueId: UUID };
      if (req.ctx.venueId !== venueId) {
        throw forbidden("venue_id не соответствует контексту терминала");
      }
      return query<WarehouseItem>(
        `SELECT id, venue_id AS "venueId", name, unit, quantity
           FROM warehouse_items WHERE venue_id = $1 ORDER BY name`,
        [venueId],
      );
    },
  );
}
