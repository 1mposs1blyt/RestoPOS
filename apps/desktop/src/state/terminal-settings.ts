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
