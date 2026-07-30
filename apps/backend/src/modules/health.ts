import type { FastifyInstance } from "fastify";
import { pool } from "../db/pool";

/** Health-роуты — публичные (см. PUBLIC_PREFIXES в http/auth.ts). */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/health/db", async (_req, reply) => {
    try {
      await pool.query("SELECT 1");
      return { status: "ok", db: "up" };
    } catch {
      reply.status(503);
      return { status: "degraded", db: "down" };
    }
  });
}
