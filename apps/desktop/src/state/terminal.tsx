import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadFiscalDevice,
  loadReceiptPrinter,
  saveFiscalDevice,
  saveReceiptPrinter,
  type FiscalDevice,
  type ReceiptPrinter,
} from "./terminal-settings";

/**
 * Оборудование терминала: чековый принтер и фискальный регистратор.
 *
 * Контекст, а не разовое чтение из localStorage, ровно из-за ФР. Отпущенный
 * COM-порт — состояние, которое обязано быть видно **на всех экранах сразу**:
 * тех. специалист освободил порт для утилиты производителя, ушёл, а кассир
 * узнаёт об этом в момент, когда гость уже стоит с деньгами. Читая настройку
 * при монтировании каждого экрана, мы бы такое предупреждение просто не смогли
 * показать вовремя.
 */
interface TerminalValue {
  receiptPrinter: ReceiptPrinter | null;
  setReceiptPrinter: (printer: ReceiptPrinter | null) => void;
  fiscal: FiscalDevice;
  /** Отпустить COM-порт: касса перестаёт его держать. */
  releaseFiscalPort: (staffName: string) => void;
  /** Снова занять порт кассой. */
  connectFiscalPort: () => void;
  setFiscalDevice: (device: FiscalDevice) => void;
}

const TerminalContext = createContext<TerminalValue | null>(null);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [receiptPrinter, setPrinterState] = useState<ReceiptPrinter | null>(
    loadReceiptPrinter,
  );
  const [fiscal, setFiscalState] = useState<FiscalDevice>(loadFiscalDevice);

  const setReceiptPrinter = useCallback((printer: ReceiptPrinter | null) => {
    setPrinterState(printer);
    saveReceiptPrinter(printer);
  }, []);

  const setFiscalDevice = useCallback((device: FiscalDevice) => {
    setFiscalState(device);
    saveFiscalDevice(device);
  }, []);

  const value = useMemo<TerminalValue>(
    () => ({
      receiptPrinter,
      setReceiptPrinter,
      fiscal,
      releaseFiscalPort: (staffName) =>
        setFiscalDevice({
          ...fiscal,
          isConnected: false,
          // Кто и когда отпустил — чтобы при разборе «почему смена
          // не фискализирована» не гадать.
          releasedAt: new Date().toISOString(),
          releasedBy: staffName,
        }),
      connectFiscalPort: () =>
        setFiscalDevice({
          ...fiscal,
          isConnected: true,
          releasedAt: null,
          releasedBy: null,
        }),
      setFiscalDevice,
    }),
    [receiptPrinter, setReceiptPrinter, fiscal, setFiscalDevice],
  );

  return (
    <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
  );
}

export function useTerminal(): TerminalValue {
  const value = useContext(TerminalContext);
  if (!value) {
    throw new Error("useTerminal вызван вне TerminalProvider");
  }
  return value;
}
