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
