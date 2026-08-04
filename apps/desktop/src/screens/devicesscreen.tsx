import { useState } from "react";
import { cn } from "@restopos/ui-kit";
import { useNavigation } from "../app/navigation";
import { useSession } from "../app/session";
import {
  makeDevice,
  useDevices,
  type Device,
  type DeviceKind,
  type PortType,
} from "../state/devices";

/**
 * Настройка оборудования — «Список устройств».
 *
 * Повторяет экран из «Инструментов» iiko: таблица тип / модель / название /
 * статус / действия, снизу «Добавить устройство», по строке открывается
 * карточка настроек.
 *
 * Оформление карточки тоже оттуда, и это не подражание ради подражания:
 * плитки-тумблеры (жёлтая — включено, белая — выключено) и вертикальные
 * вкладки разделов слева попадают пальцем, а флажки и горизонтальные табы
 * на сенсорном экране — нет. Управляющему, работавшему на iiko, ещё
 * и не придётся переучиваться.
 */
const KIND_LABELS: Record<DeviceKind, string> = {
  printer: "Принтер",
  kkm: "ККМ, принтер чеков",
  scales: "Весы",
};

/** Модели по типам — как в диалоге «Выберите модель». */
const MODELS: Record<DeviceKind, string[]> = {
  kkm: [
    "АТОЛ",
    "Штрих-М",
    "Виртуальная касса (нефискальный режим)",
    "Внешняя (виртуальная) касса",
    "МЕРКУРИЙ",
    "OPOS Fiscal Register",
  ],
  printer: ["ESC/POS сетевой", "ESC/POS через COM", "Windows-принтер"],
  scales: ["CAS", "Штрих-принт", "Масса-К"],
};

export function DevicesScreen() {
  const { back } = useNavigation();
  const { devices, save, remove, start, stop } = useDevices();
  const { staff } = useSession();
  const [editing, setEditing] = useState<Device | null>(null);
  const [adding, setAdding] = useState<DeviceKind | null>(null);

  if (editing) {
    return (
      <DeviceCard
        device={editing}
        onSave={(device) => {
          save(device);
          setEditing(null);
        }}
        onRemove={() => {
          remove(editing.id);
          setEditing(null);
        }}
        onBack={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <h1 className="text-lg font-black tracking-wide">Список устройств</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-slate-700/60 text-sm text-slate-200">
            <tr>
              <th className="px-5 py-3 font-medium">Тип устройства</th>
              <th className="px-5 py-3 font-medium">Модель</th>
              <th className="px-5 py-3 font-medium">Название</th>
              <th className="px-5 py-3 font-medium">Статус</th>
              <th className="px-5 py-3 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-600">
                  Оборудование не настроено.
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id}>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setEditing(device)}
                      className="min-h-11 text-left text-sm text-slate-200 underline-offset-4 hover:underline"
                    >
                      {KIND_LABELS[device.kind]}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">{device.model}</td>
                  <td className="px-5 py-4 text-sm text-slate-300">{device.name}</td>
                  <td className="px-5 py-4 text-sm">
                    {device.isRunning ? (
                      <span className="text-emerald-400">
                        запущено
                        {device.portType === "com" && ` · COM${device.port}`}
                      </span>
                    ) : (
                      // Остановленное устройство — не «выключено», а «порт
                      // свободен»: именно ради этого его и останавливают.
                      <span className="text-amber-400">
                        порт свободен
                        {device.stoppedBy ? ` · ${device.stoppedBy}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label={device.isRunning ? "Остановить" : "Запустить"}
                        onClick={() =>
                          device.isRunning
                            ? stop(device.id, staff?.fullName ?? "тех. поддержка")
                            : start(device.id)
                        }
                        className={cn(
                          "min-h-14 w-16 rounded-lg border text-lg transition active:scale-95",
                          device.isRunning
                            ? "border-amber-800 bg-amber-950/50 text-amber-300"
                            : "border-emerald-800 bg-emerald-950/50 text-emerald-300",
                        )}
                      >
                        {device.isRunning ? "■" : "▶"}
                      </button>
                      <button
                        type="button"
                        disabled={!device.isRunning}
                        className="min-h-14 w-16 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-slate-400 transition active:bg-slate-700 disabled:opacity-40"
                      >
                        TEST
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 items-stretch border-t border-slate-800 bg-slate-900">
        <button
          type="button"
          onClick={back}
          className="min-h-16 min-w-32 px-6 text-sm font-bold text-slate-300 transition active:bg-slate-800"
        >
          Назад
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setAdding("kkm")}
          className="min-h-16 px-6 text-sm font-black tracking-wide text-slate-200 transition active:bg-slate-800"
        >
          + Добавить устройство
        </button>
      </footer>

      {adding && (
        <AddDeviceDialog
          kind={adding}
          onKind={setAdding}
          onPick={(model) => {
            const device = makeDevice(adding, model);
            save(device);
            setAdding(null);
            setEditing(device);
          }}
          onCancel={() => setAdding(null)}
        />
      )}
    </div>
  );
}

/** Выбор типа, затем модели — двумя шагами, как в iiko. */
function AddDeviceDialog({
  kind,
  onKind,
  onPick,
  onCancel,
}: {
  kind: DeviceKind;
  onKind: (kind: DeviceKind) => void;
  onPick: (model: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-[40rem] space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="text-center text-lg font-black text-slate-200">
          Выберите тип устройства
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(KIND_LABELS) as DeviceKind[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onKind(value)}
              className={cn(
                "min-h-16 rounded-xl border px-3 text-sm font-bold transition active:scale-95",
                kind === value
                  ? "border-transparent bg-orange-500 text-white"
                  : "border-slate-700 bg-slate-800 text-slate-300",
              )}
            >
              {KIND_LABELS[value]}
            </button>
          ))}
        </div>

        <h3 className="pt-2 text-center text-sm font-black uppercase tracking-wider text-slate-500">
          Выберите модель
        </h3>
        <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
          {MODELS[kind].map((model) => (
            <button
              key={model}
              type="button"
              onClick={() => onPick(model)}
              className="min-h-16 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 transition active:bg-slate-700"
            >
              {model}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="min-h-14 w-full rounded-xl border border-slate-700 text-sm font-bold text-slate-300 transition active:bg-slate-800"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

type Tab = "main" | "extra" | "payments" | "taxes" | "info";

const TAB_LABELS: Record<Tab, string> = {
  main: "Основные настройки",
  extra: "Дополнительные настройки",
  payments: "Типы оплат и регистры",
  taxes: "Налоговые категории",
  info: "Дополнительная информация",
};

/**
 * Карточка устройства.
 *
 * Раскладка эталонная: сверху название и «Запускать автоматически», слева
 * вертикальные вкладки разделов, справа плитки настроек текущего раздела.
 * Пустой раздел так и остаётся пустым — у ККМ линейки АТОЛ, например,
 * «Дополнительные настройки» пусты, и в iiko тоже.
 */
function DeviceCard({
  device,
  onSave,
  onRemove,
  onBack,
}: {
  device: Device;
  onSave: (device: Device) => void;
  onRemove: () => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(device);
  const [tab, setTab] = useState<Tab>("main");
  const patch = (part: Partial<Device>) => setDraft({ ...draft, ...part });

  return (
    <div className="flex h-full w-full select-none flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-800 bg-slate-900 px-5 py-3 text-center">
        <h1 className="text-lg font-black uppercase tracking-wide">
          {draft.kind === "kkm" ? `Касса №${draft.cashRegisterNumber}, ` : ""}
          Название: {draft.name}
        </h1>
      </header>

      <div className="flex shrink-0 gap-2 p-3">
        <FieldTile
          label="Название"
          value={draft.name}
          onChange={(name) => patch({ name })}
          className="flex-1"
        />
        <ToggleTile
          label="Запускать автоматически"
          checked={draft.autoStart}
          onToggle={() => patch({ autoStart: !draft.autoStart })}
          className="w-72"
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3">
        <nav className="w-64 shrink-0 space-y-1">
          {(Object.keys(TAB_LABELS) as Tab[]).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={cn(
                "min-h-16 w-full rounded-lg px-4 text-left text-sm font-bold uppercase tracking-wide transition",
                tab === name
                  ? "bg-lime-200 text-slate-900"
                  : "text-slate-400 active:bg-slate-800",
              )}
            >
              {TAB_LABELS[name]}
            </button>
          ))}
        </nav>

        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {tab === "main" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2">
              <ChoiceTile
                label="Тип порта"
                value={draft.portType}
                options={PORT_TYPES}
                labels={PORT_LABELS}
                onChange={(portType) => patch({ portType })}
              />
              <FieldTile
                label={draft.portType === "tcp" ? "Хост" : "Номер порта"}
                value={draft.port}
                onChange={(port) => patch({ port })}
              />
              {draft.portType === "com" && (
                <FieldTile
                  label="Скорость обмена"
                  value={String(draft.baudRate)}
                  onChange={(v) => patch({ baudRate: Number(v) || 0 })}
                />
              )}

              {draft.kind === "kkm" && (
                <>
                  <FieldTile
                    label="Номер кассы"
                    value={String(draft.cashRegisterNumber)}
                    onChange={(v) => patch({ cashRegisterNumber: Number(v) || 1 })}
                  />
                  <ToggleTile
                    label="Печатать блюда на чеке"
                    checked={draft.printDishes}
                    onToggle={() => patch({ printDishes: !draft.printDishes })}
                  />
                  <ToggleTile
                    label="Печатать номер заказа"
                    checked={draft.printOrderNumber}
                    onToggle={() =>
                      patch({ printOrderNumber: !draft.printOrderNumber })
                    }
                  />
                  <ToggleTile
                    label="Печатать НДС"
                    checked={draft.printVat}
                    onToggle={() => patch({ printVat: !draft.printVat })}
                  />
                  <ToggleTile
                    label="Денежный ящик"
                    checked={draft.cashDrawer}
                    onToggle={() => patch({ cashDrawer: !draft.cashDrawer })}
                  />
                  <ToggleTile
                    label="Запретить работать с кассой при открытом денежном ящике"
                    checked={draft.blockWhenDrawerOpen}
                    onToggle={() =>
                      patch({ blockWhenDrawerOpen: !draft.blockWhenDrawerOpen })
                    }
                  />
                  <FieldTile
                    label="Символов в строке"
                    value={String(draft.charsPerLine)}
                    onChange={(v) => patch({ charsPerLine: Number(v) || 30 })}
                  />
                </>
              )}
            </div>
          ) : (
            // Пустой раздел — не заглушка на будущее, а факт: у АТОЛ
            // «Дополнительные настройки» пусты и в самой iiko.
            <p className="p-8 text-center text-sm text-slate-600">
              Для этой модели раздел пуст.
            </p>
          )}
        </section>
      </div>

      <footer className="flex shrink-0 items-stretch border-t border-slate-800 bg-slate-900">
        <button
          type="button"
          onClick={onBack}
          className="min-h-16 min-w-32 px-6 text-sm font-bold text-slate-300 transition active:bg-slate-800"
        >
          Назад
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="min-h-16 px-6 text-sm font-bold text-rose-300 transition active:bg-slate-800"
        >
          Удалить
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="min-h-16 min-w-48 bg-emerald-600 px-8 text-base font-black text-white transition active:bg-emerald-500"
        >
          Сохранить
        </button>
      </footer>
    </div>
  );
}

const PORT_TYPES: PortType[] = ["com", "usb", "tcp"];
const PORT_LABELS: Record<PortType, string> = {
  com: "Com",
  usb: "USB",
  tcp: "TCP/IP",
};

/**
 * Плитка-тумблер. Жёлтая — включено, тёмная — выключено.
 *
 * Не флажок: цель касания у флажка — квадрат в полтора сантиметра, и пальцем
 * в него на моноблоке не попасть. Плитка целиком и есть кнопка.
 */
function ToggleTile({
  label,
  checked,
  onToggle,
  className,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onToggle}
      className={cn(
        "min-h-20 rounded-lg border px-4 text-sm font-bold transition active:scale-95",
        checked
          ? "border-transparent bg-lime-200 text-slate-900"
          : "border-slate-700 bg-slate-800 text-slate-300",
        className,
      )}
    >
      {label}
    </button>
  );
}

/** Плитка-поле: подпись слева, значение справа — одной строкой, как в iiko. */
function FieldTile({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-20 overflow-hidden rounded-lg", className)}>
      <span className="flex w-40 shrink-0 items-center bg-stone-300 px-3 text-sm font-medium text-slate-800">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-slate-950 px-4 text-base text-slate-100"
      />
    </div>
  );
}

/** Плитка-выбор: та же форма, но перебирает варианты по касанию. */
function ChoiceTile<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (next: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(options[(options.indexOf(value) + 1) % options.length])}
      className="flex min-h-20 overflow-hidden rounded-lg text-left transition active:scale-95"
    >
      <span className="flex w-40 shrink-0 items-center bg-stone-300 px-3 text-sm font-medium text-slate-800">
        {label}
      </span>
      <span className="flex flex-1 items-center bg-slate-950 px-4 text-base text-slate-100">
        {labels[value]}
      </span>
    </button>
  );
}
