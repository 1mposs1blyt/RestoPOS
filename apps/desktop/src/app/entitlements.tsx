import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FeatureCode, PlanCode } from "@restopos/shared-types";
import { loadState, saveState } from "../lib/storage";

/**
 * Тариф организации и вытекающие из него фичи.
 *
 * ВАЖНО (инвариант №1): всё, что здесь есть, — это UX. Реальная защита живёт
 * на бэкенде в `requireFeature(...)`; прямой запрос к API в обход интерфейса
 * обязан получать 403 независимо от того, что решил `FeatureGate`.
 *
 * Пока подписок нет, набор фич задаётся локально и переключается в дев-панели,
 * чтобы экраны сразу писались с учётом закрытых модулей.
 */

const PLAN_FEATURES: Record<PlanCode, FeatureCode[]> = {
  start: [],
  standard: ["kds", "warehouse", "delivery", "reports"],
  pro: [
    "kds",
    "warehouse",
    "delivery",
    "reports",
    "egais",
    "loyalty",
    "analytics",
    "suppliers",
    "multi_venue",
  ],
};

export const PLAN_LABELS: Record<PlanCode, string> = {
  start: "Start",
  standard: "Standard",
  pro: "Pro",
};

interface EntitlementsValue {
  plan: PlanCode;
  features: ReadonlySet<FeatureCode>;
  hasFeature: (feature: FeatureCode) => boolean;
  /** Только для дев-панели: на проде тариф приезжает с сервера. */
  setPlan: (plan: PlanCode) => void;
}

const EntitlementsContext = createContext<EntitlementsValue | null>(null);

const PLAN_KEY = "billing.plan";

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<PlanCode>(() =>
    loadState<PlanCode>(PLAN_KEY, "standard"),
  );

  const setPlan = useCallback((next: PlanCode) => {
    setPlanState(next);
    saveState(PLAN_KEY, next);
  }, []);

  const value = useMemo<EntitlementsValue>(() => {
    const features = new Set(PLAN_FEATURES[plan]);
    return {
      plan,
      features,
      hasFeature: (feature: FeatureCode) => features.has(feature),
      setPlan,
    };
  }, [plan, setPlan]);

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements(): EntitlementsValue {
  const value = useContext(EntitlementsContext);
  if (!value) {
    throw new Error("useEntitlements вызван вне EntitlementsProvider");
  }
  return value;
}

export interface FeatureGateProps {
  feature: FeatureCode;
  children: ReactNode;
  /** Что показать вместо контента. По умолчанию — блок апсейла. */
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature } = useEntitlements();
  if (hasFeature(feature)) return <>{children}</>;
  return <>{fallback ?? <FeatureUpsell feature={feature} />}</>;
}

const FEATURE_LABELS: Partial<Record<FeatureCode, string>> = {
  kds: "Кухонный экран",
  warehouse: "Складской учёт",
  delivery: "Доставка",
  reports: "Отчёты",
  egais: "ЕГАИС",
  loyalty: "Программа лояльности",
  analytics: "Аналитика",
  suppliers: "Поставщики",
  multi_venue: "Несколько заведений",
};

function FeatureUpsell({ feature }: { feature: FeatureCode }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-sm space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center">
        <span className="text-4xl">🔒</span>
        <h2 className="text-lg font-bold text-slate-200">
          {FEATURE_LABELS[feature] ?? feature}
        </h2>
        <p className="text-sm text-slate-500">
          Модуль не входит в текущий тариф организации. Подключается в разделе
          подписки.
        </p>
      </div>
    </div>
  );
}
