import { config } from "./config";
import { buildApp } from "./app";
import { createIo, setIo } from "./realtime/io";

async function main(): Promise<void> {
  const app = await buildApp();

  // socket.io навешивается на http-сервер Fastify (он существует сразу после
  // создания инстанса), затем сохраняется в singleton для роутов.
  const io = createIo(app.server);
  setIo(io);

  await app.listen({ port: config.port, host: config.host });
  app.log.info(`RestoPOS backend слушает http://${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
