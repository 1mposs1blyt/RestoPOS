import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { config } from "./config";
import { registerErrorHandler } from "./http/errors";
import { registerAuth } from "./http/auth";
import { healthRoutes } from "./modules/health";
import { ordersRoutes } from "./modules/orders";
import { warehouseRoutes } from "./modules/warehouse";

// Импортируется ради side-effect: `declare module "fastify"` для request.ctx.
import "./http/context";

/**
 * Собирает Fastify-приложение (без прослушивания порта и без socket.io — их
 * поднимает src/index.ts, потому что io навешивается на уже созданный http-сервер).
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: config.corsOrigins });
  registerErrorHandler(app);
  registerAuth(app);

  await app.register(healthRoutes);
  await app.register(ordersRoutes);
  await app.register(warehouseRoutes);

  return app;
}
