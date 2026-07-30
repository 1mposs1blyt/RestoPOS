import type { FastifyError, FastifyInstance, FastifyReply } from "fastify";

/**
 * Ошибка API с машиночитаемым кодом. Формат ответа согласован с клиентом:
 * `{ message, code, details }` — см. ApiError в packages/api-client/src/types.ts.
 * Коды 403 намеренно совпадают с теми, что различает клиент:
 *   - feature_not_available → тариф не покрывает модуль (ApiError.isFeatureLocked)
 *   - quota_exceeded        → превышен числовой лимит тарифа (ApiError.isQuotaExceeded)
 */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code: string | null = null,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const unauthorized = (m = "Unauthorized"): ApiError =>
  new ApiError(401, m, "unauthorized");

export const forbidden = (m = "Forbidden", code = "forbidden"): ApiError =>
  new ApiError(403, m, code);

export const featureNotAvailable = (feature: string): ApiError =>
  new ApiError(
    403,
    `Модуль '${feature}' недоступен на текущем тарифе`,
    "feature_not_available",
    { feature },
  );

export const quotaExceeded = (quota: string): ApiError =>
  new ApiError(403, `Превышен лимит тарифа '${quota}'`, "quota_exceeded", {
    quota,
  });

export const notFound = (m = "Не найдено"): ApiError =>
  new ApiError(404, m, "not_found");

export const badRequest = (m: string, details: unknown = null): ApiError =>
  new ApiError(400, m, "bad_request", details);

/** Единый обработчик: приводит любую ошибку к формату `{ message, code, details }`. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError, _req, reply: FastifyReply) => {
    if (err instanceof ApiError) {
      reply
        .status(err.statusCode)
        .send({ message: err.message, code: err.code, details: err.details });
      return;
    }

    const status = err.statusCode ?? 500;
    if (status >= 500) app.log.error(err);
    reply.status(status).send({
      message: status >= 500 ? "Internal Server Error" : err.message,
      code: err.code ?? null,
      details: null,
    });
  });
}
