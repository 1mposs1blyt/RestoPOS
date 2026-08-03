import type { TerminalKind, UUID } from "@restopos/shared-types";

export interface ApiClientOptions {
  /** База REST API, например `http://localhost:3000`. */
  baseUrl: string;
  /**
   * URL WebSocket-сервера. Если не задан — используется `baseUrl`
   * (обычный кейс: socket.io поднят на том же хосте).
   */
  wsUrl?: string;
  /**
   * Тип терминала. Вместе с `venueId` определяет комнату подписки:
   * KDS не должен получать события зала и наоборот.
   */
  terminalKind: TerminalKind;
  /** Токен смены/терминала. Может быть async — читаем из защищённого хранилища. */
  getToken?: () => string | null | Promise<string | null>;
  /** Вызывается при 401 — точка входа для разлогина терминала. */
  onUnauthorized?: () => void;
  /** Таймаут HTTP-запросов, мс. */
  timeoutMs?: number;
}

/** Нормализованная ошибка API — чтобы UI не разбирал устройство axios. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string | null;
  readonly details: unknown;

  constructor(
    message: string,
    status: number | null,
    code: string | null = null,
    details: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** 403 с кодом `feature_not_available` — тариф не покрывает модуль. */
  get isFeatureLocked(): boolean {
    return this.status === 403 && this.code === "feature_not_available";
  }

  /** Превышен числовой лимит тарифа (терминалы, точки, сотрудники). */
  get isQuotaExceeded(): boolean {
    return this.status === 403 && this.code === "quota_exceeded";
  }

  /**
   * Права нет и получить его нельзя — кнопку гасим.
   *
   * Отличать от `isOverrideRequired` обязательно: там действие возможно
   * с подтверждением, и вместо отказа нужно открыть диалог ввода PIN.
   */
  get isPermissionDenied(): boolean {
    return this.status === 403 && this.code === "permission_denied";
  }

  /** Права нет, но действие подтверждается чужим PIN. */
  get isOverrideRequired(): boolean {
    return this.status === 403 && this.code === "override_required";
  }

  /** Подтверждение просрочено, уже использовано или выдано под другое действие. */
  get isOverrideInvalid(): boolean {
    return this.status === 403 && this.code === "override_invalid";
  }

  /**
   * Роли нечего делать на этом терминале. Показывается отдельным текстом:
   * повар у кассы должен понимать, почему его не пустили, иначе решит,
   * что касса сломалась.
   */
  get isNoScreensForRole(): boolean {
    return this.status === 403 && this.code === "no_screens_for_role";
  }

  /** Узел недоступен: обрыв сети, служба не поднята, таймаут. */
  get isOffline(): boolean {
    return this.status === null;
  }
}

/** Имя комнаты socket.io. Должно совпадать с тем, что строит бэкенд. */
export function roomName(venueId: UUID, kind: TerminalKind): string {
  return `venue:${venueId}:${kind}`;
}
