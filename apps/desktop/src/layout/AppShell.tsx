import { useEffect, useState, type ReactNode } from "react";
import type { PlanCode, ServiceMode, TerminalKind } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { PLAN_LABELS, useEntitlements } from "../app/entitlements";
import { useDevices } from "../state/devices";
import {
  useNavigation,
  workRoutesFor,
  type AccessScope,
  type RouteName,
} from "../app/navigation";
import { roleLabel, useSession } from "../app/session";

const TERMINAL_LABELS: Record<TerminalKind, string> = {
  pos: "Касса",
  kds: "Кухня",
  admin: "Админка",
};

/**
 * Полоса «фискальный регистратор отключён».
 *
 * Висит на всех экранах, а не только на сервисном, потому что состояние
 * забывается: тех. специалист отпустил порт под утилиту производителя и ушёл,
 * а обнаруживает это кассир — в момент, когда гость уже стоит с деньгами.
 * Полоса стоит между шапкой и экраном, чтобы не перекрывать содержимое
 * и при этом попадаться на глаза при любом действии.
 */
function FiscalPortBanner() {
  const { kkm } = useDevices();
  // Предупреждаем только про ККМ: остановленные весы работе кассы не мешают.
  if (!kkm || kkm.isRunning) return null;

  return (
    <div className="shrink-0 border-x border-b border-amber-900/60 bg-amber-950/50 px-5 py-2 text-sm text-amber-300">
      <b>ККМ остановлена</b> — порт свободен
      {kkm.stoppedBy ? ` (${kkm.stoppedBy})` : ""}. Чеки пробиваются,
      но не фискализируются. Запустить — в настройке оборудования.
    </div>
  );
}

function useWallClock(): string {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Общая обвязка терминала: шапка со сменой и область экрана.
 *
 * Дев-панель внизу переключает тип терминала и тариф. На проде этих
 * переключателей нет: тип терминала прописан в его регистрации,
 * а тариф приезжает с сервера вместе с подпиской организации.
 */
export function AppShell({
  scope,
  children,
}: {
  /**
   * Набор доступных экранов для переключателя. Не передаётся, когда оболочка
   * рисуется вне навигации — например, вокруг заглушки «нет доступных экранов».
   */
  scope?: AccessScope;
  children: ReactNode;
}) {
  const { venue, staff, terminalKind, lock } = useSession();
  const { plan } = useEntitlements();
  const clock = useWallClock();

  return (
    // Отступ по краям задан здесь и только здесь: на моноблоке рамка корпуса
    // подходит вплотную к стеклу, и элементы, прижатые к краю, режутся пальцем
    // и бликами. Экраны внутри добавляют свои внутренние отступы поверх.
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-950 p-2 text-slate-100">
      <header className="flex shrink-0 items-center justify-between gap-4 border border-slate-800 bg-slate-900 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black tracking-wide text-orange-400">
            RestoPOS
          </span>
          <span className="text-sm font-semibold text-slate-300">
            {venue.name}
          </span>
          <Chip>{TERMINAL_LABELS[terminalKind]}</Chip>
          <Chip>Тариф {PLAN_LABELS[plan]}</Chip>
          {scope && <RouteSwitcher scope={scope} />}
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-sm tabular-nums text-slate-400">
            {clock}
          </span>
          {staff && (
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold text-slate-200">
                {staff.fullName}
              </div>
              <div className="text-[11px] text-slate-500">
                {roleLabel(staff.role)}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={lock}
            className="min-h-11 rounded-lg border border-slate-700/50 bg-slate-800 px-4 text-sm font-semibold transition hover:bg-slate-700 active:scale-95"
          >
            🔒 Блокировать
          </button>
        </div>
      </header>

      <FiscalPortBanner />

      <main className="relative min-h-0 flex-1 overflow-hidden bg-slate-900 border-slate-700/50 border-l border-r">
        {children}
      </main>

      {import.meta.env.DEV && <DevBar />}
    </div>
  );
}

const ROUTE_LABELS: Partial<Record<RouteName, string>> = {
  menu: "Меню",
  hall: "Зал",
  counter: "Прилавок",
  cash: "Касса",
  delivery: "Доставка",
  kitchen: "Кухня",
  stations: "Станции",
  service: "Сервис",
};

/**
 * Переключатель между доступными экранами.
 *
 * Показывает главное меню и **рабочие** экраны. Сопутствующие сюда не идут:
 * экран оплаты без заказа бессмыслен, а личная страница открывается из хаба —
 * в верхней панели они были бы двумя лишними мишенями на сенсорном экране,
 * куда попадают случайно.
 */
function RouteSwitcher({ scope }: { scope: AccessScope }) {
  const { route, reset } = useNavigation();
  const available: RouteName[] = ["menu", ...workRoutesFor(scope)];

  if (available.length < 2) return null;

  return (
    <div className="flex gap-1">
      {available.map((name) => (
        <button
          key={name}
          type="button"
          // Сброс, а не переход: экраны верхнего уровня друг другу не родители,
          // и стек «назад» между ними накапливался бы мусором.
          onClick={() => reset({ name } as Parameters<typeof reset>[0])}
          className={cn(
            "min-h-11 rounded-lg px-3 text-xs font-bold transition active:scale-95",
            route.name === name || (route.name === "order" && name === "hall")
              ? "bg-orange-500 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700",
          )}
        >
          {ROUTE_LABELS[name] ?? name}
        </button>
      ))}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-400">
      {children}
    </span>
  );
}

const PLANS: PlanCode[] = ["start", "standard", "pro"];
const TERMINALS: TerminalKind[] = ["pos", "kds"];

const SERVICE_MODES: ServiceMode[] = ["tables", "counter"];

const SERVICE_MODE_LABELS: Record<ServiceMode, string> = {
  tables: "Зал",
  counter: "Прилавок",
};

function DevBar() {
  const { terminalKind, setTerminalKind, venue, setServiceMode } = useSession();
  const { plan, setPlan } = useEntitlements();

  // Стек экранов здесь не трогаем: маршрут, ставший недоступным после смены
  // конфигурации, сбрасывает `CurrentScreen` — он видит оба значения
  // актуальными, а этот обработчик знал бы только одно из них.

  return (
    <div className="flex shrink-0 items-center justify-center gap-6 border border-slate-800 bg-slate-900 px-4 py-2">
      <DevGroup label="Терминал">
        {TERMINALS.map((kind) => (
          <DevButton
            key={kind}
            active={terminalKind === kind}
            onClick={() => setTerminalKind(kind)}
          >
            {TERMINAL_LABELS[kind]}
          </DevButton>
        ))}
      </DevGroup>

      <DevGroup label="Заведение">
        {SERVICE_MODES.map((mode) => (
          <DevButton
            key={mode}
            active={venue.serviceMode === mode}
            onClick={() => setServiceMode(mode)}
          >
            {SERVICE_MODE_LABELS[mode]}
          </DevButton>
        ))}
      </DevGroup>

      <DevGroup label="Тариф">
        {PLANS.map((code) => (
          <DevButton
            key={code}
            active={plan === code}
            onClick={() => setPlan(code)}
          >
            {PLAN_LABELS[code]}
          </DevButton>
        ))}
      </DevGroup>
    </div>
  );
}

function DevGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function DevButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-lg px-4 text-sm font-bold transition-colors",
        active
          ? "bg-orange-500 text-white"
          : "text-slate-400 hover:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}
