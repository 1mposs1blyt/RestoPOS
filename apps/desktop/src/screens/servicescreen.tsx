import { useEffect, useState } from "react";
import type { PlanCode, ServiceMode, TerminalKind } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { PLAN_LABELS, useEntitlements } from "../app/entitlements";
import { useSession } from "../app/session";
import { clearAll } from "../lib/storage";
import { useTerminal } from "../state/terminal";
import type { FiscalModel } from "../state/terminal-settings";

/**
 * Сервисный экран терминала — единственное, что доступно роли `support`.
 *
 * До него переключить тип терминала в собранном `.exe` было нечем: дев-панель
 * вырезается из прод-сборки, а `terminalKind`/`serviceMode` читаются из
 * localStorage при старте — то есть правились только руками через инспектор
 * WebView2. Теперь это делается PIN-ом тех. специалиста, и настройка терминала
 * перестала требовать devtools в релизе.
 *
 * Денег и заказов здесь нет намеренно: инженер вендора не должен иметь доступа
 * к выручке чужого бизнеса (см. `docs/access.md`).
 */
export function ServiceScreen() {
  const { venue, terminalKind, setTerminalKind, setServiceMode, staff } =
    useSession();
  const { plan, setPlan } = useEntitlements();

  return (
    <div className="h-full w-full select-none overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="rounded-xl border border-slate-700/50 bg-slate-800 p-4">
          <h1 className="text-lg font-black tracking-wide text-amber-400">
            Сервисный режим
          </h1>
          <p className="text-sm text-slate-400">
            {staff?.fullName ?? "—"} · настройка терминала и диагностика
          </p>
        </header>

        <Section
          title="Тип терминала"
          hint="На проде приезжает с регистрацией устройства"
        >
          <Choice
            options={TERMINALS}
            value={terminalKind}
            labels={TERMINAL_LABELS}
            onChange={setTerminalKind}
          />
        </Section>

        <Section
          title="Режим обслуживания заведения"
          hint="Свойство заведения, а не тарифа: зал есть там, где гостя сажают за стол"
        >
          <Choice
            options={SERVICE_MODES}
            value={venue.serviceMode}
            labels={SERVICE_MODE_LABELS}
            onChange={setServiceMode}
          />
        </Section>

        <Section
          title="Тариф организации"
          hint="Локальная симуляция: на проде тариф приезжает с подпиской и здесь не меняется"
        >
          <Choice
            options={PLANS}
            value={plan}
            labels={PLAN_LABELS}
            onChange={setPlan}
          />
        </Section>

        <FiscalDeviceSection />
        <Diagnostics />
        <DangerZone />
      </div>
    </div>
  );
}

/**
 * Фискальный регистратор и его COM-порт.
 *
 * Главное здесь — кнопка «Отпустить порт». COM-порт держит ровно один процесс,
 * и пока его держит касса, утилита производителя (ДТО Атол, тест Штрих-М)
 * открыть его не сможет — а она нужна для прошивки, фискализации и диагностики.
 * В iiko это то же самое: сервисное меню умеет отключить ФР, чтобы освободить
 * порт под драйвер ККТ.
 *
 * Отпустить — не значит «выключить»: настройка ФР сохраняется, вернуть его
 * одно касание. Но состояние опасное, поэтому отпущенный порт виден на всех
 * экранах кассы, а не только здесь.
 */
function FiscalDeviceSection() {
  const { staff } = useSession();
  const { fiscal, releaseFiscalPort, connectFiscalPort, setFiscalDevice } =
    useTerminal();

  return (
    <Section
      title="Фискальный регистратор"
      hint="COM-порт держит один процесс: отпустите его, чтобы запустить утилиту производителя"
    >
      <div className="w-full space-y-3">
        <div className="flex flex-wrap gap-2">
          {FISCAL_MODELS.map((model) => (
            <button
              key={model}
              type="button"
              onClick={() => setFiscalDevice({ ...fiscal, model })}
              className={cn(
                "min-h-11 rounded-lg border px-4 text-sm font-bold transition active:scale-95",
                fiscal.model === model
                  ? "border-transparent bg-orange-500 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-300",
              )}
            >
              {FISCAL_LABELS[model]}
            </button>
          ))}
        </div>

        {/* У виртуального ФР порта нет — и поле ввода там только сбивает. */}
        {fiscal.model !== "virtual" && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-slate-600">
                Порт
              </span>
              <input
                value={fiscal.port ?? ""}
                placeholder="COM3"
                disabled={!fiscal.isConnected}
                onChange={(event) =>
                  setFiscalDevice({ ...fiscal, port: event.target.value })
                }
                className="mt-1 min-h-11 w-32 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 disabled:opacity-40"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-slate-600">
                Скорость
              </span>
              <select
                value={fiscal.baudRate}
                disabled={!fiscal.isConnected}
                onChange={(event) =>
                  setFiscalDevice({
                    ...fiscal,
                    baudRate: Number(event.target.value),
                  })
                }
                className="mt-1 min-h-11 w-32 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 disabled:opacity-40"
              >
                {[9600, 19200, 38400, 57600, 115200].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div
          className={cn(
            "rounded-xl border p-4",
            fiscal.isConnected
              ? "border-emerald-900/60 bg-emerald-950/30"
              : "border-amber-900/60 bg-amber-950/30",
          )}
        >
          <p className="text-sm font-bold text-slate-200">
            {fiscal.isConnected
              ? `Порт занят кассой${fiscal.port ? ` (${fiscal.port})` : ""}`
              : "Порт отпущен — касса им не пользуется"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {fiscal.isConnected
              ? "Утилита производителя порт не откроет, пока касса его держит."
              : `Отпустил ${fiscal.releasedBy ?? "—"}${
                  fiscal.releasedAt
                    ? ` в ${new Date(fiscal.releasedAt).toLocaleString("ru-RU")}`
                    : ""
                }. Чеки не фискализируются.`}
          </p>
          <button
            type="button"
            onClick={() =>
              fiscal.isConnected
                ? releaseFiscalPort(staff?.fullName ?? "тех. поддержка")
                : connectFiscalPort()
            }
            className={cn(
              "mt-3 min-h-14 w-full rounded-xl text-sm font-black transition active:scale-95",
              fiscal.isConnected
                ? "border border-amber-800 bg-amber-950/60 text-amber-300"
                : "bg-emerald-600 text-white",
            )}
          >
            {fiscal.isConnected ? "Отпустить порт" : "Занять порт кассой"}
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Само удержание порта делает Rust-часть кассы; сейчас она к ФР
          не подключается, и переключатель меняет только состояние терминала.
        </p>
      </div>
    </Section>
  );
}

const FISCAL_MODELS: FiscalModel[] = ["atol", "shtrih", "virtual"];
const FISCAL_LABELS: Record<FiscalModel, string> = {
  atol: "АТОЛ",
  shtrih: "Штрих-М",
  virtual: "Виртуальный ФР",
};

const TERMINALS: TerminalKind[] = ["pos", "kds", "admin"];
const TERMINAL_LABELS: Record<TerminalKind, string> = {
  pos: "Касса",
  kds: "Кухня",
  admin: "Админка",
};

const SERVICE_MODES: ServiceMode[] = ["tables", "counter"];
const SERVICE_MODE_LABELS: Record<ServiceMode, string> = {
  tables: "Зал со столами",
  counter: "Прилавок",
};

const PLANS: PlanCode[] = ["start", "standard", "pro"];

/**
 * Разрешение экрана и точки касания.
 *
 * Целевое железо — моноблок 1024x768 или 1366x768, и цель касания меньше 44px
 * на глаз от нормальной не отличается. Показываем фактическое разрешение
 * прямо на терминале: при выезде на точку это первое, что нужно знать.
 */
function Diagnostics() {
  const { venue, terminalKind } = useSession();
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const measure = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const rows: [string, string][] = [
    ["Заведение", `${venue.name} (${venue.id})`],
    ["Организация", venue.organizationId],
    ["Терминал", TERMINAL_LABELS[terminalKind]],
    ["Разрешение", `${viewport.width} × ${viewport.height}`],
    ["Плотность пикселей", String(window.devicePixelRatio)],
    ["Сборка", import.meta.env.DEV ? "dev" : "release"],
  ];

  return (
    <Section title="Диагностика">
      <dl className="w-full divide-y divide-slate-800">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="text-right font-mono text-sm text-slate-300">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/*
 * Журнал опасных операций жил здесь и переехал в `screens/auditscreen.tsx`
 * под право `audit.view`.
 *
 * Причина не косметическая: у вендорского `support` ровно одно право
 * `terminal.service` и он не должен видеть ни заказов, ни денег
 * (`docs/access.md`), а в журнале есть и объекты действий, и имена
 * сотрудников. Разбирает недостачу менеджер — ему экран и достался.
 */

/**
 * Сброс терминала. Подтверждение в два касания, а не `confirm()`: системный
 * диалог на киоске выглядит инородно, а промах пальцем стирает смену.
 */
function DangerZone() {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <Section
      title="Сброс терминала"
      hint="Стирает заказы, расстановку столов и настройки этого терминала"
    >
      <button
        type="button"
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          clearAll();
          location.reload();
        }}
        className={cn(
          "min-h-14 rounded-xl px-6 text-sm font-bold transition active:scale-95",
          armed
            ? "bg-rose-600 text-white hover:bg-rose-500"
            : "border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-950/70",
        )}
      >
        {armed ? "Точно стереть? Нажмите ещё раз" : "Стереть локальные данные"}
      </button>
    </Section>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
        {title}
      </h2>
      {hint && <p className="mb-3 mt-1 text-xs text-slate-600">{hint}</p>}
      <div className="flex flex-wrap items-start gap-2">{children}</div>
    </section>
  );
}

function Choice<T extends string>({
  options,
  value,
  labels,
  onChange,
}: {
  options: T[];
  value: T;
  labels: Record<T, string>;
  onChange: (next: T) => void;
}) {
  return (
    <>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "min-h-14 rounded-xl px-5 text-sm font-bold transition active:scale-95",
            value === option
              ? "bg-orange-500 text-white"
              : "border border-slate-700/50 bg-slate-800 text-slate-400 hover:bg-slate-700/60",
          )}
        >
          {labels[option]}
        </button>
      ))}
    </>
  );
}
