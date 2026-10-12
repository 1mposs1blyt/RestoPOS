import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { UUID } from "@restopos/shared-types";
import { loadState, newId, saveState } from "../lib/storage";
import { fiscalConfigure, type TaxSystem, type VatRate } from "../lib/fiscal";

/**
 * Оборудование терминала.
 *
 * Один список на все устройства, как в «Настройке оборудования» iiko: там
 * типов ровно три — принтер, ККМ (он же принтер чеков) и весы, — и все они
 * лежат в общей таблице «Список устройств» с колонками тип / модель / название
 * / статус / действия.
 *
 * Ключевая механика — **запуск и остановка устройства**. COM-порт держит ровно
 * один процесс: пока касса запущена на порту, утилита производителя (ДТО Атол,
 * тест Штрих-М) открыть его не сможет, а она нужна для прошивки, фискализации
 * и диагностики. Поэтому устройство останавливают — и порт освобождается.
 *
 * Денежный ящик — **настройка ККМ, а не отдельное устройство**: физически он
 * подключён шлейфом к чековому принтеру и открывается его же командой. В iiko
 * это плитка «Денежный ящик» в карточке ККМ, и здесь так же.
 */

const STORAGE_KEY = "devices";

export type DeviceKind = "printer" | "kkm" | "scales";

/** Как устройство подключено. У сетевых принтеров это `tcp`, у ККМ обычно `com`. */
export type PortType = "com" | "usb" | "tcp";

export interface Device {
  id: UUID;
  kind: DeviceKind;
  /** «АТОЛ», «Штрих-М», «Виртуальная касса (нефискальный режим)». */
  model: string;
  name: string;
  /**
   * Запускать при старте кассы. Выключив это, тех. специалист оставляет порт
   * свободным до явного запуска — ровно то же, что «Запускать автоматически»
   * в карточке устройства iiko.
   */
  autoStart: boolean;
  /** Держит ли касса порт прямо сейчас. */
  isRunning: boolean;

  portType: PortType;
  /** Номер COM-порта («1» = COM1) либо хост для `tcp`. */
  port: string;
  baudRate: number;

  // ── Настройки ККМ ──────────────────────────────────────────────────────
  cashRegisterNumber: number;
  /**
   * Система налогообложения и ставка НДС по умолчанию.
   *
   * Живут здесь, а не в меню, по двум причинам. Во-первых, в `MenuItem`
   * ставки нет вовсе, а фискальному чеку она обязательна. Во-вторых, у общепита
   * ставка обычно одна на всё заведение — заводить её в каждое блюдо значит
   * тысячу раз повторить одно и то же и однажды ошибиться в одном месте.
   * Когда появятся блюда с разной ставкой (алкоголь на ОСН), поле в меню
   * добавится и будет перекрывать это значение.
   */
  taxSystem: TaxSystem;
  defaultVat: VatRate;
  /**
   * Пробивать ли на этой ККМ фискальные чеки.
   *
   * Выключается там, где касса физически есть и печатает, но фискализировать
   * нечем: ФН исчерпан, просрочен или ККТ не зарегистрирована. Без этого
   * выбор был бы между «завести ККМ и не продавать» (каждый расчёт упирается
   * в отказ ФН) и «не заводить ККМ и не печатать вовсе» — а печать марок,
   * логотипа и тестовой ленты от накопителя не зависит.
   *
   * Отдельным флагом, а не удалением карточки: адрес, порт и настройки
   * остаются на месте и заработают в тот день, когда поставят живой ФН.
   */
  fiscalEnabled: boolean;
  /** Открывать денежный ящик этим устройством. */
  cashDrawer: boolean;
  /** Не давать работать, пока ящик открыт: деньги на виду — риск и соблазн. */
  blockWhenDrawerOpen: boolean;
  printDishes: boolean;
  printOrderNumber: boolean;
  printVat: boolean;

  /** Кто и когда остановил — чтобы «почему смена не фискализирована» имело ответ. */
  stoppedAt: string | null;
  stoppedBy: string | null;
}

/** Порт ККТ у АТОЛ по TCP/IP, если в карточке указан только хост. */
const DEFAULT_KKT_PORT = 5555;

/**
 * Разбор поля «порт» карточки: `192.168.1.223` или `192.168.1.223:5555`.
 *
 * Порт разрешён в той же строке, потому что отдельного поля под него
 * в карточке нет, а ККТ на нестандартном порту — обычное дело, когда
 * их в заведении несколько за одним маршрутизатором.
 */
function splitAddress(value: string): [string, number] {
  const at = value.lastIndexOf(":");
  if (at < 0) return [value.trim(), DEFAULT_KKT_PORT];

  const port = Number.parseInt(value.slice(at + 1), 10);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    return [value.trim(), DEFAULT_KKT_PORT];
  }
  return [value.slice(0, at).trim(), port];
}

export function makeDevice(kind: DeviceKind, model: string): Device {
  return {
    id: newId(),
    kind,
    model,
    name: model,
    autoStart: true,
    isRunning: true,
    /*
     * ККМ по умолчанию — TCP/IP, а не COM.
     *
     * Драйвер АТОЛ (`src-tauri/src/fiscal/atol.rs`) подключается по сети,
     * и карточка с «COM 1» показывала бы то, чего нет: искать потом причину
     * молчащей кассы будут в кабеле. Адрес отсюда уезжает в драйвер
     * (`fiscalConfigure` в `DevicesProvider`), а не лежит для красоты.
     */
    portType: kind === "scales" ? "com" : "tcp",
    port: kind === "printer" ? "192.168.1.100" : "192.168.1.223",
    baudRate: 115200,
    cashRegisterNumber: 1,
    taxSystem: "usn_income",
    defaultVat: "vat20",
    // По умолчанию фискализируем: касса, заведённая как ККМ, обязана
    // пробивать чек. Выключать это — осознанное действие техподдержки.
    fiscalEnabled: true,
    cashDrawer: kind === "kkm",
    blockWhenDrawerOpen: false,
    printDishes: true,
    printOrderNumber: true,
    printVat: true,
    stoppedAt: null,
    stoppedBy: null,
  };
}

interface DevicesState {
  devices: Record<UUID, Device>;
}

const EMPTY: DevicesState = { devices: {} };

type Action =
  | { type: "save"; device: Device }
  | { type: "remove"; id: UUID }
  | { type: "start"; id: UUID }
  | { type: "stop"; id: UUID; by: string };

function reducer(state: DevicesState, action: Action): DevicesState {
  switch (action.type) {
    case "save":
      return { devices: { ...state.devices, [action.device.id]: action.device } };

    case "remove": {
      const { [action.id]: _removed, ...rest } = state.devices;
      return { devices: rest };
    }

    case "start": {
      const device = state.devices[action.id];
      if (!device) return state;
      return {
        devices: {
          ...state.devices,
          [device.id]: {
            ...device,
            isRunning: true,
            stoppedAt: null,
            stoppedBy: null,
          },
        },
      };
    }

    case "stop": {
      const device = state.devices[action.id];
      if (!device) return state;
      return {
        devices: {
          ...state.devices,
          [device.id]: {
            ...device,
            isRunning: false,
            stoppedAt: new Date().toISOString(),
            stoppedBy: action.by,
          },
        },
      };
    }

    default:
      return state;
  }
}

interface DevicesValue {
  devices: Device[];
  /** Фискальный регистратор терминала. Он один: чек пробивают на одной ККМ. */
  kkm: Device | undefined;
  /**
   * Та же ККМ, но только если она **фискализирует**.
   *
   * Расчёт гостя обязан смотреть сюда, а печать — на `kkm`. Касса
   * с выключенной фискализацией остаётся принтером: марки, логотип
   * и тестовая лента идут, а чек не пробивается и оплату не блокирует.
   */
  fiscalKkm: Device | undefined;
  /** Чем открывать денежный ящик. */
  drawerDevice: Device | undefined;
  save: (device: Device) => void;
  remove: (id: UUID) => void;
  start: (id: UUID) => void;
  stop: (id: UUID, by: string) => void;
}

const DevicesContext = createContext<DevicesValue | null>(null);

export function DevicesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    loadState<DevicesState>(STORAGE_KEY, EMPTY),
  );

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  const devices = useMemo(
    () =>
      Object.values(state.devices).sort((a, b) =>
        a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name, "ru"),
      ),
    [state.devices],
  );

  const kkm = useMemo(
    () => devices.find((device) => device.kind === "kkm"),
    [devices],
  );

  /*
   * Адрес из карточки ККМ уезжает в драйвер.
   *
   * Иначе поле «порт» на экране оборудования ни на что не влияет: Rust берёт
   * адрес из своей константы, и кассир, поправивший IP, ищет причину молчащей
   * кассы в кабеле. Команда идемпотентна — совпавшие настройки Rust отбрасывает,
   * не пересобирая устройство: пересборка обнулила бы его состояние.
   */
  useEffect(() => {
    if (kkm?.portType !== "tcp") return;

    const [host, port] = splitAddress(kkm.port);
    void fiscalConfigure(host, port).catch((error: unknown) => {
      console.error("Драйвер ККТ не перенастроен:", error);
    });
  }, [kkm]);

  const save = useCallback((device: Device) => {
    dispatch({ type: "save", device });
  }, []);

  const value = useMemo<DevicesValue>(() => {
    return {
      devices,
      kkm,
      fiscalKkm: kkm?.fiscalEnabled ? kkm : undefined,
      // Ящик открывает то устройство, у которого он включён: обычно ККМ,
      // но у прилавка это может быть и обычный чековый принтер.
      drawerDevice: devices.find((device) => device.cashDrawer && device.isRunning),
      save,
      remove: (id) => dispatch({ type: "remove", id }),
      start: (id) => dispatch({ type: "start", id }),
      stop: (id, by) => dispatch({ type: "stop", id, by }),
    };
  }, [devices, kkm, save]);

  return (
    <DevicesContext.Provider value={value}>{children}</DevicesContext.Provider>
  );
}

export function useDevices(): DevicesValue {
  const value = useContext(DevicesContext);
  if (!value) {
    throw new Error("useDevices вызван вне DevicesProvider");
  }
  return value;
}
