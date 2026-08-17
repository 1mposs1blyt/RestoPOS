import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Order, OrderItem, PrintJob, UUID } from "@restopos/shared-types";
import { loadState, newId, saveState } from "../lib/storage";
import { findMenuItem } from "./menu";
import { useOrders } from "./orders";
import { useStations } from "./stations";
import { useTables } from "./tables";
import { printTicket, type TicketLine } from "../lib/printer";

/**
 * Очередь кухонной печати.
 *
 * Очередь, а не прямой вызов принтера при отправке заказа. Три причины,
 * и все три встречаются в первый же день работы:
 *
 * 1. Принтер не должен блокировать отправку. Источник истины — заказ
 *    (инвариант №3), а не бумага: не напечаталось — заказ всё равно ушёл,
 *    тикет висит на экране, а задание видно и повторяемо.
 * 2. Упавшее задание обязано быть видимым. Молча проглоченная ошибка печати
 *    означает блюдо, которое никто не готовит, и никто об этом не знает.
 * 3. Повтор должен быть явным и помеченным. Молчаливый дубль марки — это
 *    второе приготовленное блюдо.
 *
 * На бэкенде очередь переедет в БД (`print_jobs`), а исполнителем станет
 * сервер: сетевой принтер не зависит от того, включена ли касса. Здесь она
 * живёт в состоянии терминала и переживает перезагрузку через localStorage.
 */

const STORAGE_KEY = "kitchen.printJobs";

/** Сколько заданий храним. Очередь — рабочий инструмент, а не архив. */
const JOB_LIMIT = 100;

interface PrintingValue {
  jobs: PrintJob[];
  /** Есть ли задания, требующие внимания человека. */
  failedCount: number;
  /**
   * Отправить заказ на кухню и поставить марки в очередь.
   *
   * Одна операция, а не две подряд в каждом экране: отправка без печати
   * (или наоборот) — это рассинхрон между тем, что видит повар на экране,
   * и тем, что у него на бумаге.
   */
  fireOrder: (orderId: UUID) => void;
  /** Повторить упавшее задание тем же составом. */
  retry: (jobId: UUID) => void;
  /** Напечатать копию — с пометкой на бумаге. */
  reprint: (jobId: UUID) => void;
  /** Проверка связи с принтером с экрана настроек. */
  testPrint: (outputId: UUID) => void;
  clearFinished: () => void;
}

const PrintingContext = createContext<PrintingValue | null>(null);

/**
 * Приведение очереди при запуске терминала.
 *
 * Задание в статусе «печатается» перезапуск пережить не может: исполнителя,
 * который его вёл, больше нет, а новый берёт только `queued`. Такое задание
 * висело бы «печатается» вечно — кнопки повтора у этого статуса нет, и никто
 * бы не узнал, что марка не вышла с принтера. Блокировка терминала размонтирует
 * провайдер ровно так же, как перезагрузка кассы, так что случай не редкий.
 *
 * В `failed`, а не обратно в `queued`: марка могла напечататься до обрыва,
 * и автоповтор означал бы второе приготовленное блюдо. Повтор здесь — решение
 * человека, и он же выбирает между «повторить» и «копия».
 */
export function restoreJobs(jobs: PrintJob[]): PrintJob[] {
  return jobs.map((job) =>
    job.status === "printing"
      ? {
          ...job,
          status: "failed" as const,
          error:
            "Касса перезапущена во время печати — проверьте, вышла ли марка",
        }
      : job,
  );
}

export function PrintingProvider({ children }: { children: ReactNode }) {
  const { state: ordersState, itemsOfOrder, sendToKitchen } = useOrders();
  const { outputs, findStation } = useStations();
  const { findTable } = useTables();
  const [jobs, setJobs] = useState<PrintJob[]>(() =>
    restoreJobs(loadState<PrintJob[]>(STORAGE_KEY, [])),
  );

  useEffect(() => {
    saveState(STORAGE_KEY, jobs);
  }, [jobs]);

  const patchJob = useCallback((jobId: UUID, patch: Partial<PrintJob>) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, ...patch } : job)),
    );
  }, []);

  const enqueue = useCallback((created: PrintJob[]) => {
    if (created.length === 0) return;
    setJobs((prev) => [...created, ...prev].slice(0, JOB_LIMIT));
  }, []);

  const fireOrder = useCallback(
    (orderId: UUID) => {
      // Состав марки считаем ДО отправки: `sendToKitchen` переведёт позиции
      // из `new`, и после него уже не отличить, что ушло именно сейчас,
      // а что готовилось с прошлого раза.
      const firing = itemsOfOrder(orderId).filter(
        (item) => item.status === "new",
      );
      sendToKitchen(orderId);
      if (firing.length === 0) return;

      const byStation = new Map<UUID, UUID[]>();
      for (const item of firing) {
        const stationId = findMenuItem(item.menuItemId)?.prepStationId;
        // Позиция без станции никуда не уезжает — печатать нечего.
        if (!stationId) continue;
        const list = byStation.get(stationId);
        if (list) list.push(item.id);
        else byStation.set(stationId, [item.id]);
      }

      const created: PrintJob[] = [];
      for (const [stationId, itemIds] of byStation) {
        for (const output of outputs) {
          if (output.stationId !== stationId) continue;
          if (output.kind !== "printer" || !output.isEnabled) continue;
          created.push({
            id: newId(),
            outputId: output.id,
            stationId,
            orderId,
            itemIds,
            status: "queued",
            isReprint: false,
            attempts: 0,
            error: null,
            createdAt: new Date().toISOString(),
          });
        }
      }

      enqueue(created);
    },
    [itemsOfOrder, sendToKitchen, outputs, enqueue],
  );

  const retry = useCallback(
    (jobId: UUID) => patchJob(jobId, { status: "queued", error: null }),
    [patchJob],
  );

  const reprint = useCallback(
    (jobId: UUID) => {
      const source = jobs.find((job) => job.id === jobId);
      if (!source) return;
      enqueue([
        {
          ...source,
          id: newId(),
          status: "queued",
          isReprint: true,
          attempts: 0,
          error: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    [jobs, enqueue],
  );

  const testPrint = useCallback(
    (outputId: UUID) => {
      const output = outputs.find((o) => o.id === outputId);
      if (!output) return;
      enqueue([
        {
          id: newId(),
          outputId,
          stationId: output.stationId,
          orderId: TEST_ORDER_ID,
          itemIds: [],
          status: "queued",
          isReprint: false,
          attempts: 0,
          error: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    [outputs, enqueue],
  );

  const clearFinished = useCallback(() => {
    setJobs((prev) => prev.filter((job) => job.status !== "printed"));
  }, []);

  /** Состав марки. Денег на кухонной марке нет — повару они не нужны. */
  const ticketLines = useCallback(
    (job: PrintJob, order: Order | undefined): TicketLine[] => {
      const station = findStation(job.stationId);
      const table = order?.tableId ? findTable(order.tableId) : undefined;
      const items = job.itemIds
        .map((id) => ordersState.items[id])
        .filter((item): item is OrderItem => item !== undefined);

      const lines: TicketLine[] = [];
      if (job.isReprint) {
        lines.push({ text: "*** КОПИЯ ***", bold: true, center: true });
      }
      lines.push({ text: station?.name ?? "Станция", bold: true, center: true });
      lines.push({
        text: order
          ? table
            ? `Стол ${table.label}`
            : `Навынос № ${order.number}`
          : "—",
        big: true,
        center: true,
      });
      lines.push({
        text: new Date(job.createdAt).toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        center: true,
      });
      lines.push({ text: "-".repeat(32) });

      for (const item of items) {
        lines.push({
          text: `${item.quantity} x ${findMenuItem(item.menuItemId)?.name ?? "—"}`,
          bold: true,
        });
      }

      return lines;
    },
    [findStation, findTable, ordersState.items],
  );

  /*
   * Исполнитель очереди.
   *
   * Строго по одному заданию за раз: у принтера один буфер, и две марки,
   * пущенные параллельно, приезжают вперемешку. `runningRef` защищает
   * от повторного запуска — эффект перезапускается на каждое изменение
   * списка заданий, в том числе на то, которое сделал он сам.
   */
  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;
    const next = [...jobs].reverse().find((job) => job.status === "queued");
    if (!next) return;

    runningRef.current = true;
    void (async () => {
      patchJob(next.id, { status: "printing" });
      try {
        const output = outputs.find((o) => o.id === next.outputId);
        if (!output || output.host === null || output.port === null) {
          throw new Error("Вывод удалён или это не принтер");
        }

        const lines =
          next.orderId === TEST_ORDER_ID
            ? testTicket(output.name)
            : ticketLines(next, ordersState.orders[next.orderId]);

        await printTicket({ host: output.host, port: output.port, lines });
        patchJob(next.id, {
          status: "printed",
          attempts: next.attempts + 1,
          error: null,
        });
      } catch (reason) {
        patchJob(next.id, {
          status: "failed",
          attempts: next.attempts + 1,
          error: reason instanceof Error ? reason.message : String(reason),
        });
      } finally {
        runningRef.current = false;
      }
    })();
  }, [jobs, outputs, ordersState.orders, patchJob, ticketLines]);

  const value = useMemo<PrintingValue>(
    () => ({
      jobs,
      failedCount: jobs.filter((job) => job.status === "failed").length,
      fireOrder,
      retry,
      reprint,
      testPrint,
      clearFinished,
    }),
    [jobs, fireOrder, retry, reprint, testPrint, clearFinished],
  );

  return (
    <PrintingContext.Provider value={value}>{children}</PrintingContext.Provider>
  );
}

/** Псевдо-заказ тестовой печати: настоящего заказа за ней не стоит. */
const TEST_ORDER_ID: UUID = "print-test";

function testTicket(outputName: string): TicketLine[] {
  return [
    { text: "ПРОВЕРКА ПЕЧАТИ", bold: true, center: true },
    { text: outputName, center: true },
    { text: "-".repeat(32) },
    { text: "Кириллица: ЁжикЩукаЪЫЬ" },
    { text: "Цифры: 0123456789" },
    { text: new Date().toLocaleString("ru-RU"), center: true },
  ];
}

export function usePrinting(): PrintingValue {
  const value = useContext(PrintingContext);
  if (!value) {
    throw new Error("usePrinting вызван вне PrintingProvider");
  }
  return value;
}
