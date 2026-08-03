import { ApiClient, NodeApi } from "@restopos/api-client";
import type { TerminalKind } from "@restopos/shared-types";
import { loadState, saveState } from "./lib/storage";

/**
 * Доступ к узлу заведения.
 *
 * Терминал ходит **только в узел** и никогда в облако (инвариант №5): узел
 * стоит в том же помещении, поэтому обрыв внешнего канала кассу не касается.
 *
 * Адрес задаётся `VITE_NODE_URL`. Пока переменная пуста, приложение работает
 * на локальном состоянии — это текущий режим до появления узла, а не аварийный.
 */

const TOKEN_KEY = "session.token";

const NODE_URL = import.meta.env.VITE_NODE_URL ?? "";

/** Настроен ли узел. Если нет — работаем на демо-данных терминала. */
export function isNodeConfigured(): boolean {
  return NODE_URL.length > 0;
}

export function sessionToken(): string | null {
  return loadState<string | null>(TOKEN_KEY, null);
}

export function setSessionToken(token: string | null): void {
  saveState(TOKEN_KEY, token);
}

/*
 * Клиент кэшируется по типу терминала: `terminalKind` участвует в имени комнаты
 * realtime, и после переключения типа на сервисном экране подписка обязана
 * переехать — иначе касса, ставшая кухней, продолжит слушать события зала.
 */
let cached: { kind: TerminalKind; client: ApiClient; api: NodeApi } | null = null;

function ensure(kind: TerminalKind): { client: ApiClient; api: NodeApi } {
  if (cached && cached.kind === kind) return cached;

  cached?.client.disconnect();

  const client = new ApiClient({
    baseUrl: NODE_URL,
    terminalKind: kind,
    getToken: sessionToken,
    onUnauthorized: () => setSessionToken(null),
    // Узел в локальной сети отвечает мгновенно; всё, что дольше, — это
    // оборванный кабель, и ждать его пятнадцать секунд у стойки нельзя.
    timeoutMs: 5000,
  });

  cached = { kind, client, api: new NodeApi(client) };
  return cached;
}

export function nodeApi(kind: TerminalKind): NodeApi {
  return ensure(kind).api;
}

/** Транспорт нужен напрямую для realtime-подписок. */
export function nodeClient(kind: TerminalKind): ApiClient {
  return ensure(kind).client;
}
