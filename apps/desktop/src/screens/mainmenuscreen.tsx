import type { Permission } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import {
  routesFor,
  useNavigation,
  type AccessScope,
  type Route,
} from "../app/navigation";
import { roleLabel, useSession } from "../app/session";
import { useShifts } from "../state/shifts";
import { formatMoney } from "../lib/money";

/**
 * Главное меню — точка входа во всё, кроме самого заказа.
 *
 * Плиточный хаб, а не список настроек: на моноблоке это единственный экран,
 * с которого видно состояние смены целиком — кто работает, открыт ли кассовый
 * день, сколько в ящике.
 *
 * Плитки заданы **таблицей с правами**, а не разложены по разметке. Причина
 * та же, что у `ROUTE_SPECS`: каждая плитка это одно право, а блок целиком
 * исчезает при пустом пересечении. Разложив их вручную, мы получили бы
 * `{can(...) && <button>}` в двух десятках мест и пустую рамку раздела там,
 * где сотруднику не доступно ничего.
 */

interface Tile {
  label: string;
  permission: Permission;
  /** Куда ведёт. `null` — пункт есть в эталоне, но экрана ещё нет. */
  route: Route | null;
}

interface Section {
  title: string;
  /** Цвет шапки: разделы различаются на ощупь, а не по чтению заголовка. */
  tone: string;
  tiles: Tile[];
}

const SECTIONS: Section[] = [
  {
    title: "Заказы",
    tone: "bg-orange-600",
    tiles: [
      { label: "Зал", permission: "order.view", route: { name: "hall" } },
      { label: "Прилавок", permission: "order.view", route: { name: "counter" } },
      { label: "Кухня", permission: "kitchen.view", route: { name: "kitchen" } },
    ],
  },
  {
    title: "Касса",
    tone: "bg-emerald-700",
    tiles: [
      { label: "Кассовая смена", permission: "cash.drawer", route: { name: "cash" } },
      { label: "Отчёты", permission: "report.view", route: { name: "reports" } },
      {
        label: "Закрытые заказы",
        permission: "order.view",
        route: { name: "documents" },
      },
      { label: "Возврат товаров", permission: "payment.refund", route: null },
    ],
  },
  {
    title: "Гости",
    tone: "bg-sky-700",
    tiles: [
      {
        label: "Доставка",
        permission: "delivery.view",
        route: { name: "delivery" },
      },
      {
        label: "Список гостей",
        permission: "guest.manage",
        route: { name: "guests" },
      },
    ],
  },
  {
    title: "Персонал",
    tone: "bg-violet-700",
    tiles: [
      { label: "Личная страница", permission: "staff.self", route: { name: "personal" } },
      {
        label: "Табель явок",
        permission: "staff.attendance",
        route: { name: "attendance" },
      },
      {
        label: "Опасные операции",
        permission: "audit.view",
        route: { name: "audit" },
      },
    ],
  },
  {
    title: "Сервис",
    tone: "bg-slate-600",
    tiles: [
      {
        label: "Стоп-лист",
        permission: "menu.stoplist",
        route: { name: "stoplist" },
      },
      { label: "Станции", permission: "station.manage", route: { name: "stations" } },
      {
        label: "Документы",
        permission: "document.view",
        route: { name: "documents" },
      },
      { label: "Настройки терминала", permission: "terminal.service", route: { name: "service" } },
    ],
  },
];

export function MainMenuScreen({ scope }: { scope: AccessScope }) {
  const { can } = useAccess();
  const { navigate } = useNavigation();
  const { staff, venue } = useSession();
  const { cashShift, myShift } = useShifts();

  const available = new Set(routesFor(scope));

  /*
   * Плитка с готовым экраном проверяется по **маршруту**, а не по праву.
   * Права мало: у менеджера есть `kitchen.view`, но на кассовом терминале
   * кухонного экрана нет, и плитка «Кухня» вела бы в никуда. Условий там
   * четыре, и дублировать их здесь нельзя — спросим `routesFor`, тот же
   * источник, что и у навигации.
   *
   * У ещё не сделанных плиток маршрута нет, поэтому их гейт — право: они
   * показываются погашенными, чтобы сотрудник видел, что пункт существует,
   * и не искал его.
   */
  const visible = SECTIONS.map((section) => ({
    ...section,
    tiles: section.tiles.filter((tile) =>
      tile.route ? available.has(tile.route.name) : can(tile.permission),
    ),
  }))
    // Раздел, где не осталось ни одной плитки, не рисуем вовсе: пустая рамка
    // с заголовком «Касса» читается как «касса сломалась», а не «вам сюда нельзя».
    .filter((section) => section.tiles.length > 0);

  return (
    <div className="h-full w-full select-none overflow-y-auto p-4">
      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-3">
        <StatusCard
          title={staff?.fullName ?? "—"}
          tone="bg-violet-700"
          rows={[
            ["Роль", staff ? roleLabel(staff.role) : "—"],
            [
              "Личная смена",
              myShift ? `открыта ${formatTime(myShift.openedAt)}` : "закрыта",
            ],
          ]}
        />
        <StatusCard
          title="Касса"
          tone="bg-emerald-700"
          rows={[
            [
              "Кассовая смена",
              cashShift
                ? `№${cashShift.number}, открыта ${formatTime(cashShift.openedAt)}`
                : "закрыта",
            ],
            [
              "Разменный фонд",
              cashShift ? formatMoney(cashShift.openingFloat) : "—",
            ],
          ]}
        />
        <StatusCard
          title={venue.name}
          tone="bg-sky-700"
          rows={[
            ["Режим", venue.serviceMode === "tables" ? "зал" : "прилавок"],
            ["Адрес", venue.address ?? "не указан"],
          ]}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] items-start gap-3">
        {visible.map((section) => (
          <section
            key={section.title}
            className="overflow-hidden rounded-xl border border-slate-700/50"
          >
            <h2
              className={cn(
                "px-4 py-3 text-center text-sm font-black uppercase tracking-wider text-white",
                section.tone,
              )}
            >
              {section.title}
            </h2>
            <div className="divide-y divide-slate-800 bg-slate-900">
              {section.tiles.map((tile) => (
                <button
                  key={tile.label}
                  type="button"
                  // Экрана ещё нет — плитку показываем, но гасим: сотрудник
                  // должен видеть, что пункт существует, и не искать его.
                  disabled={tile.route === null}
                  onClick={() => tile.route && navigate(tile.route)}
                  className="min-h-16 w-full px-4 text-sm font-bold text-slate-200 transition active:bg-slate-800 disabled:text-slate-600"
                >
                  {tile.label}
                  {tile.route === null && (
                    <span className="ml-2 text-xs text-slate-700">скоро</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function StatusCard({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: string;
  rows: [string, string][];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50">
      <h2
        className={cn(
          "px-4 py-3 text-center text-sm font-black tracking-wide text-white",
          tone,
        )}
      >
        {title}
      </h2>
      <dl className="divide-y divide-slate-800 bg-slate-900">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-h-12 items-center justify-between px-4">
            <dt className="text-xs uppercase tracking-wider text-slate-600">
              {label}
            </dt>
            <dd className="text-sm text-slate-300">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
