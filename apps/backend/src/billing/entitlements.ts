import type { FastifyRequest } from "fastify";
import type { FeatureCode, StaffRole, UUID } from "@restopos/shared-types";
import { query } from "../db/pool";
import { featureNotAvailable, forbidden, quotaExceeded } from "../http/errors";

/**
 * Тариф организации: булевы фичи и числовые лимиты. Загружается из активной
 * подписки. Фичи (features) — модули из plan_features. Лимиты (maxTerminals/
 * maxVenues) — quota, проверяются подсчётом текущего использования, а НЕ
 * feature-flag'ом (инвариант №2 в CLAUDE.md).
 */
export interface Entitlements {
  planCode: string;
  features: Set<FeatureCode>;
  maxTerminals: number;
  maxVenues: number;
}

interface Row {
  code: string;
  max_terminals: number;
  max_venues: number;
  feature_code: string | null;
}

export async function loadEntitlements(
  organizationId: UUID,
): Promise<Entitlements> {
  const rows = await query<Row>(
    `SELECT p.code, p.max_terminals, p.max_venues, pf.feature_code
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       LEFT JOIN plan_features pf ON pf.plan_id = p.id
      WHERE s.organization_id = $1 AND s.status = 'active'
      ORDER BY s.current_period_end DESC`,
    [organizationId],
  );

  if (rows.length === 0) {
    // Нет активной подписки — ни одного платного модуля, нулевые лимиты.
    return { planCode: "none", features: new Set(), maxTerminals: 0, maxVenues: 0 };
  }

  const features = new Set<FeatureCode>();
  for (const r of rows) {
    if (r.feature_code) features.add(r.feature_code as FeatureCode);
  }
  return {
    planCode: rows[0].code,
    features,
    maxTerminals: rows[0].max_terminals,
    maxVenues: rows[0].max_venues,
  };
}

/**
 * preHandler тарифной защиты. Ставится на КАЖДЫЙ эндпоинт платного модуля —
 * скрытие кнопки в UI защитой не является (инвариант №1). Прямой запрос в обход
 * фронта обязан получить 403 feature_not_available.
 */
export function requireFeature(feature: FeatureCode) {
  return async (req: FastifyRequest): Promise<void> => {
    const ent = await loadEntitlements(req.ctx.organizationId);
    if (!ent.features.has(feature)) throw featureNotAvailable(feature);
  };
}

/** preHandler проверки роли. Роль и тариф — независимые проверки, обе обязательны. */
export function requireRole(...roles: StaffRole[]) {
  return async (req: FastifyRequest): Promise<void> => {
    if (!req.ctx.role || !roles.includes(req.ctx.role)) {
      throw forbidden("Недостаточно прав для операции");
    }
  };
}

/**
 * Проверка числового лимита: считает текущее использование по организации и
 * сравнивает с планом. Вызывать перед созданием точки/терминала.
 */
export async function assertQuota(
  organizationId: UUID,
  quota: "max_terminals" | "max_venues",
): Promise<void> {
  const ent = await loadEntitlements(organizationId);

  if (quota === "max_venues") {
    const [row] = await query<{ count: number }>(
      "SELECT count(*)::int AS count FROM venues WHERE organization_id = $1",
      [organizationId],
    );
    if (row.count >= ent.maxVenues) throw quotaExceeded("max_venues");
    return;
  }

  const [row] = await query<{ count: number }>(
    `SELECT count(*)::int AS count
       FROM terminals t
       JOIN venues v ON v.id = t.venue_id
      WHERE v.organization_id = $1`,
    [organizationId],
  );
  if (row.count >= ent.maxTerminals) throw quotaExceeded("max_terminals");
}
