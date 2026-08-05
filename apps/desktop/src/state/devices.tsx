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
import type { TaxSystem, VatRate } from "../lib/fiscal";

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
  /** Открывать денежный ящик этим устройством. */
  cashDrawer: boolean;
  /** Не давать работать, пока ящик открыт: деньги на виду — риск и соблазн. */
  blockWhenDrawerOpen: boolean;
  printDishes: boolean;
  printOrderNumber: boolean;
  printVat: boolean;
  charsPerLine: number;

  /** Кто и когда остановил — чтобы «почему смена не фискализирована» имело ответ. */
  stoppedAt: string | null;
  stoppedBy: string | null;
}

export function makeDevice(kind: DeviceKind, model: string): Device {
  return {
    id: newId(),
    kind,
    model,
    name: model,
    autoStart: true,
    isRunning: true,
    portType: kind === "printer" ? "tcp" : "com",
    port: kind === "printer" ? "192.168.1.100" : "1",
    baudRate: 115200,
    cashRegisterNumber: 1,
    taxSystem: "usn_income",
    defaultVat: "vat20",
    cashDrawer: kind === "kkm",
    blockWhenDrawerOpen: false,
    printDishes: true,
    printOrderNumber: true,
    printVat: true,
    charsPerLine: 30,
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

  const save = useCallback((device: Device) => {
    dispatch({ type: "save", device });
  }, []);

  const value = useMemo<DevicesValue>(() => {
    const kkm = devices.find((device) => device.kind === "kkm");
    return {
      devices,
      kkm,
      // Ящик открывает то устройство, у которого он включён: обычно ККМ,
      // но у прилавка это может быть и обычный чековый принтер.
      drawerDevice: devices.find((device) => device.cashDrawer && device.isRunning),
      save,
      remove: (id) => dispatch({ type: "remove", id }),
      start: (id) => dispatch({ type: "start", id }),
      stop: (id, by) => dispatch({ type: "stop", id, by }),
    };
  }, [devices, save]);

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
