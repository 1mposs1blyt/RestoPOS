import type {
  FeatureCode,
  ISODateString,
  Money,
  PlanCode,
  SubscriptionStatus,
  UUID,
} from "./common";

export interface Organization {
  id: UUID;
  name: string;
  createdAt: ISODateString;
}

export interface Plan {
  id: UUID;
  code: PlanCode;
  name: string;
  priceMonthly: Money;
  /** Quota, а не feature-flag: проверяется подсчётом текущего использования. */
  maxTerminals: number;
  maxVenues: number;
  /** Булевы модули из `plan_features`. */
  features: FeatureCode[];
}

export interface Subscription {
  id: UUID;
  organizationId: UUID;
  planId: UUID;
  status: SubscriptionStatus;
  currentPeriodEnd: ISODateString;
  createdAt: ISODateString;
}

/**
 * Тарифная лестница из контракта: что каждый тариф даёт и чем ограничивает.
 *
 * Источник истины — `contracts/contract.json`, здесь только реэкспорт, как
 * и у матрицы прав в `access.ts`. Дублировать лестницу руками нельзя по той же
 * причине: разъедется на первой правке, только про деньги вместо доступа.
 * Фичи и квоты — разные механизмы (инвариант №2).
 */
export {
  CONTRACT_FEATURE_CODES,
  CONTRACT_PLAN_CODES,
  CONTRACT_PLAN_FEATURES,
  CONTRACT_PLAN_QUOTAS,
  type ContractPlanQuota,
} from "./contract.generated";
