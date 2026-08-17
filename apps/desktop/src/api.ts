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
const VENUE_KEY = "session.venueId";

const NODE_URL = import.meta.env.VITE_NODE_URL ?? "";

/**
 * Идентификатор терминала. На проде приезжает с его регистрацией и лежит
 * в настройках устройства; здесь берётся из окружения, чтобы одну и ту же
 * сборку можно было запустить как разные кассы.
 */
const TERMINAL_ID = import.meta.env.VITE_TERMINAL_ID ?? "";

/** Настроен ли узел. Если нет — работаем на демо-данных терминала. */
export function isNodeConfigured(): boolean {
  return NODE_URL.length > 0;
}

/**
 * Заведение текущей сессии. Узел режет по нему выборки, поэтому оно уходит
 * заголовком на каждом запросе — а известно только после входа.
 */
export function sessionVenueId(): string | null {
  return loadState<string | null>(VENUE_KEY, null);
}

export function setSessionVenueId(venueId: string | null): void {
  saveState(VENUE_KEY, venueId);
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
    terminalId: TERMINAL_ID || undefined,
    getVenueId: sessionVenueId,
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
