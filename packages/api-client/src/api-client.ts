import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  isAxiosError,
} from "axios";
import { io, type Socket } from "socket.io-client";
import {
  EVENT_TOPICS,
  type EventPayloadMap,
  type EventTopic,
  type UUID,
} from "@restopos/shared-types";
import { ApiError, type ApiClientOptions, roomName } from "./types";

type Handler<T extends EventTopic> = (payload: EventPayloadMap[T]) => void;
type AnyHandler = (payload: unknown) => void;

const ALL_TOPICS = Object.values(EVENT_TOPICS) as EventTopic[];

/**
 * Тонкий клиент к бэкенду RestoPOS: REST поверх axios + realtime поверх socket.io.
 *
 * Сознательно не содержит кэша и стора — события приходят без полезной нагрузки
 * состояния, и слой выше сам решает, что перезапросить. Источник истины — БД.
 */
export class ApiClient {
  private readonly http: AxiosInstance;
  private readonly options: ApiClientOptions;
  private readonly handlers = new Map<EventTopic, Set<AnyHandler>>();

  private socket: Socket | null = null;
  private venueId: UUID | null = null;

  constructor(options: ApiClientOptions) {
    this.options = options;

    this.http = axios.create({
      baseURL: options.baseUrl,
      timeout: options.timeoutMs ?? 15_000,
      headers: { "Content-Type": "application/json" },
    });

    this.http.interceptors.request.use(async (config) => {
      const token = await options.getToken?.();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
      return config;
    });

    this.http.interceptors.response.use(
      (response) => response,
      (error: unknown) => Promise.reject(this.normalizeError(error)),
    );
  }

  // ── HTTP ────────────────────────────────────────────────────────────────

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.http.get<T>(path, config);
    return data;
  }

  async post<T, B = unknown>(
    path: string,
    body?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await this.http.post<T>(path, body, config);
    return data;
  }

  async put<T, B = unknown>(
    path: string,
    body?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await this.http.put<T>(path, body, config);
    return data;
  }

  async patch<T, B = unknown>(
    path: string,
    body?: B,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await this.http.patch<T>(path, body, config);
    return data;
  }

  private normalizeError(error: unknown): ApiError {
    if (!isAxiosError(error)) {
      return new ApiError(
        error instanceof Error ? error.message : "Unknown error",
        null,
      );
    }

    const status = error.response?.status ?? null;
    if (status === 401) {
      this.options.onUnauthorized?.();
    }

    const payload = error.response?.data as
      | { message?: string; code?: string; details?: unknown }
      | undefined;

    return new ApiError(
      payload?.message ?? error.message,
      status,
      payload?.code ?? null,
      payload?.details ?? null,
    );
  }

  // ── Realtime ────────────────────────────────────────────────────────────

  /**
   * Подключается к WebSocket и подписывается на события заведения.
   * Повторный вызов с другим `venueId` перепривязывает подписку —
   * это штатный сценарий при переключении точки в мультиточечном режиме.
   */
  connect(venueId: UUID): void {
    if (this.socket && this.venueId === venueId) return;

    if (this.socket) {
      this.leaveRoom();
      this.venueId = venueId;
      this.joinRoom();
      return;
    }

    this.venueId = venueId;

    this.socket = io(this.options.wsUrl ?? this.options.baseUrl, {
      transports: ["websocket"],
      auth: async (cb: (data: Record<string, unknown>) => void) => {
        cb({ token: (await this.options.getToken?.()) ?? null });
      },
    });

    // Комната переустанавливается на каждый connect: после реконнекта
    // сервер про подписку уже не помнит.
    this.socket.on("connect", () => this.joinRoom());

    for (const topic of ALL_TOPICS) {
      this.socket.on(topic, (payload: unknown) => this.dispatch(topic, payload));
    }
  }

  disconnect(): void {
    if (!this.socket) return;
    this.leaveRoom();
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.venueId = null;
  }

  /**
   * Подписка на топик. Возвращает функцию отписки — её удобно вернуть
   * прямо из `useEffect`.
   */
  on<T extends EventTopic>(topic: T, handler: Handler<T>): () => void {
    let set = this.handlers.get(topic);
    if (!set) {
      set = new Set();
      this.handlers.set(topic, set);
    }
    set.add(handler as AnyHandler);

    return () => {
      set.delete(handler as AnyHandler);
    };
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get currentVenueId(): UUID | null {
    return this.venueId;
  }

  private joinRoom(): void {
    if (!this.socket || !this.venueId) return;
    this.socket.emit("subscribe", {
      venueId: this.venueId,
      terminalKind: this.options.terminalKind,
      room: roomName(this.venueId, this.options.terminalKind),
    });
  }

  private leaveRoom(): void {
    if (!this.socket || !this.venueId) return;
    this.socket.emit("unsubscribe", {
      venueId: this.venueId,
      terminalKind: this.options.terminalKind,
      room: roomName(this.venueId, this.options.terminalKind),
    });
  }

  private dispatch(topic: EventTopic, payload: unknown): void {
    const set = this.handlers.get(topic);
    if (!set) return;
    for (const handler of set) {
      handler(payload);
    }
  }
}
