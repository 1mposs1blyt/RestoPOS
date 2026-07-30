import type { Server as HttpServer } from "node:http";
import { Server as IoServer } from "socket.io";
import type { TerminalKind, UUID } from "@restopos/shared-types";
import { config } from "../config";
import { roomName } from "./rooms";

interface SubscribeMsg {
  venueId: UUID;
  terminalKind: TerminalKind;
}

// Singleton: роуты берут io через getIo(), чтобы не тащить его параметром сквозь
// всю регистрацию плагинов.
let ioRef: IoServer | null = null;

export function setIo(io: IoServer): void {
  ioRef = io;
}

export function getIo(): IoServer {
  if (!ioRef) throw new Error("socket.io не инициализирован");
  return ioRef;
}

/**
 * Поднимает socket.io поверх http-сервера Fastify. Клиент после авторизации смены
 * сам присылает 'subscribe' с venueId и kind — сервер заводит его в комнату.
 * TODO: проверка токена из handshake.auth перед join.
 */
export function createIo(server: HttpServer): IoServer {
  const io = new IoServer(server, { cors: { origin: config.corsOrigins } });

  io.on("connection", (socket) => {
    socket.on("subscribe", ({ venueId, terminalKind }: SubscribeMsg) => {
      if (!venueId || !terminalKind) return;
      socket.join(roomName(venueId, terminalKind));
    });
    socket.on("unsubscribe", ({ venueId, terminalKind }: SubscribeMsg) => {
      if (!venueId || !terminalKind) return;
      socket.leave(roomName(venueId, terminalKind));
    });
  });

  return io;
}
