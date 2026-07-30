/** Конфигурация процесса из окружения. Читается один раз при старте. */
export interface AppConfig {
  host: string;
  port: number;
  databaseUrl: string;
  /** Список разрешённых origin или `true` (любой) — для CORS и socket.io. */
  corsOrigins: string[] | boolean;
  /**
   * Dev-обход аутентификации: контекст арендатора берётся из заголовков
   * (x-org-id, x-venue-id, x-terminal-kind, ...) вместо разбора токена.
   * ТОЛЬКО для локальной разработки, пока нет входа по PIN и токенов смены.
   */
  authDevBypass: boolean;
}

function num(value: string | undefined, fallback: number): number {
  const n = value ? Number(value) : Number.NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const config: AppConfig = {
  host: process.env.HOST ?? "0.0.0.0",
  port: num(process.env.PORT, 3000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/restopos",
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : true,
  authDevBypass: process.env.AUTH_DEV_BYPASS === "1",
};
