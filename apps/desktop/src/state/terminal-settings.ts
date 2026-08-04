import { loadState, saveState } from "../lib/storage";

/**
 * Настройки самого терминала, а не заведения.
 *
 * Чековый принтер — это **не** принтер станции. Кухонные марки уезжают на
 * принтеры цехов, а чек и денежный ящик живут у кассы: ящик подключён шлейфом
 * к чековому принтеру и открывается его же командой. Свести их в одно означало
 * бы, что импульс на открытие уходит на кухню и ящик у кассира не открывается.
 *
 * На проде приезжает с регистрации терминала (в iiko это «Настройка
 * оборудования»: список устройств с типом, моделью и адресом).
 */

const KEY = "terminal.receiptPrinter";
const FISCAL_KEY = "terminal.fiscalDevice";

export interface ReceiptPrinter {
  host: string;
  port: number;
}

export function loadReceiptPrinter(): ReceiptPrinter | null {
  return loadState<ReceiptPrinter | null>(KEY, null);
}

export function saveReceiptPrinter(printer: ReceiptPrinter | null): void {
  saveState(KEY, printer);
}

/**
 * Фискальный регистратор.
 *
 * Подключён к кассе по COM-порту (обычно USB, эмулирующий COM). Ключевое
 * свойство порта: **его держит ровно один процесс**. Пока касса подключена
 * к ФР, утилита производителя (ДТО Атол, тест Штрих-М) порт открыть не сможет,
 * а она нужна для прошивки, фискализации и диагностики.
 *
 * Отсюда возможность отпустить порт — как в сервисном меню iiko. Это не
 * «выключить ФР», а именно «перестать держать порт»: касса остаётся настроенной,
 * запись о ФР никуда не девается, и вернуть его — одно касание.
 */
export type FiscalModel = "atol" | "shtrih" | "virtual";

export interface FiscalDevice {
  model: FiscalModel;
  /** «COM3». `null` у виртуального ФР — порта у него нет. */
  port: string | null;
  baudRate: number;
  /**
   * Держит ли касса порт прямо сейчас.
   *
   * `false` — порт отпущен ради утилиты производителя. Состояние **опасное
   * и легко забываемое**: с отпущенным портом чек не фискализируется, и узнать
   * об этом на кассе, когда гость уже стоит с деньгами, — худший момент.
   * Поэтому оно показывается на экране оплаты, а не только здесь.
   */
  isConnected: boolean;
  /** Когда и кто отпустил — для разбора «почему смена не фискализирована». */
  releasedAt: string | null;
  releasedBy: string | null;
}

const DEFAULT_FISCAL: FiscalDevice = {
  model: "virtual",
  port: null,
  baudRate: 115200,
  isConnected: true,
  releasedAt: null,
  releasedBy: null,
};

export function loadFiscalDevice(): FiscalDevice {
  return loadState<FiscalDevice>(FISCAL_KEY, DEFAULT_FISCAL);
}

export function saveFiscalDevice(device: FiscalDevice): void {
  saveState(FISCAL_KEY, device);
}
