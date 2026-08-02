import { useState } from "react";
import type { PrintJob, StationOutput } from "@restopos/shared-types";
import { cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useStations } from "../state/stations";
import { usePrinting } from "../state/printing";
import { isTauri } from "../lib/printer";

/**
 * Станции приготовления и их выводы.
 *
 * Здесь настраивается ровно то, о чём весь механизм: у станции может быть
 * экран, принтер, оба сразу или ни одного. Дублирование марки на бумагу
 * при живом мониторе — это второй вывод у станции, а не отдельный режим.
 *
 * Станция без включённого экрана работает «по бумаге»: отмечать готовность
 * на ней некому, поэтому позиции считаются готовыми сразу после отправки.
 * Экран показывает это явно — иначе настройка молча меняет поведение кухни.
 */
export function StationsScreen() {
  const { can } = useAccess();
  const {
    stations,
    outputsOf,
    hasScreenOf,
    addStation,
    renameStation,
    removeStation,
    addOutput,
  } = useStations();

  const canManage = can("station.manage");

  return (
    <div className="h-full w-full select-none overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800 p-4">
          <div>
            <h1 className="text-lg font-black tracking-wide">
              Станции приготовления
            </h1>
            <p className="text-sm text-slate-400">
              Куда уезжают позиции и чем станция об этом сообщает
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => addStation("Новая станция")}
              className="min-h-14 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-400 active:scale-95"
            >
              + Станция
            </button>
          )}
        </header>

        {!isTauri() && (
          <p className="rounded-xl border border-amber-900/60 bg-amber-950/40 p-4 text-sm text-amber-300">
            Фронт открыт в браузере — печатать физически нечем. Задания будут
            падать в ошибку «Печать доступна только в приложении кассы».
            Проверять принтер нужно в собранном приложении.
          </p>
        )}

        {stations.map((station) => (
          <section
            key={station.id}
            className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <input
                value={station.name}
                disabled={!canManage}
                onChange={(event) =>
                  renameStation(station.id, event.target.value)
                }
                aria-label={`Название станции ${station.name}`}
                className="min-h-11 flex-1 rounded-lg bg-slate-900 px-3 text-base font-bold text-slate-100 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-transparent"
              />

              <span
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-bold",
                  hasScreenOf(station.id)
                    ? "bg-emerald-950/70 text-emerald-300"
                    : "bg-amber-950/70 text-amber-300",
                )}
              >
                {hasScreenOf(station.id)
                  ? "Экран есть"
                  : "По бумаге: готово сразу"}
              </span>

              {canManage && (
                <button
                  type="button"
                  onClick={() => removeStation(station.id)}
                  className="min-h-11 rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 text-sm font-semibold text-rose-300 transition hover:bg-rose-950/70 active:scale-95"
                >
                  Удалить
                </button>
              )}
            </div>

            <div className="space-y-2">
              {outputsOf(station.id).map((output) => (
                <OutputRow
                  key={output.id}
                  output={output}
                  canManage={canManage}
                />
              ))}
              {outputsOf(station.id).length === 0 && (
                <p className="text-sm text-slate-600">
                  Выводов нет: позиции уедут на станцию, но сообщить о них
                  некому.
                </p>
              )}
            </div>

            {canManage && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addOutput(station.id, "screen")}
                  className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 active:scale-95"
                >
                  + Экран
                </button>
                <button
                  type="button"
                  onClick={() => addOutput(station.id, "printer")}
                  className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 active:scale-95"
                >
                  + Принтер
                </button>
              </div>
            )}
          </section>
        ))}

        <PrintQueue />
      </div>
    </div>
  );
}

function OutputRow({
  output,
  canManage,
}: {
  output: StationOutput;
  canManage: boolean;
}) {
  const { updateOutput, removeOutput } = useStations();
  const { testPrint } = usePrinting();
  const isPrinter = output.kind === "printer";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-3">
      <span className="text-xl" aria-hidden>
        {isPrinter ? "🖨️" : "🖥️"}
      </span>

      <input
        value={output.name}
        disabled={!canManage}
        onChange={(event) => updateOutput(output.id, { name: event.target.value })}
        aria-label="Название вывода"
        className="min-h-11 w-40 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-transparent"
      />

      {isPrinter && (
        <>
          <input
            value={output.host ?? ""}
            disabled={!canManage}
            onChange={(event) =>
              updateOutput(output.id, { host: event.target.value })
            }
            aria-label="Адрес принтера"
            placeholder="192.168.1.50"
            className="min-h-11 w-40 rounded-lg bg-slate-950 px-3 font-mono text-sm text-slate-200 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-transparent"
          />
          <input
            value={output.port ?? 9100}
            disabled={!canManage}
            inputMode="numeric"
            onChange={(event) =>
              updateOutput(output.id, {
                port: Number(event.target.value) || 9100,
              })
            }
            aria-label="Порт принтера"
            className="min-h-11 w-20 rounded-lg bg-slate-950 px-3 font-mono text-sm text-slate-200 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-transparent"
          />
        </>
      )}

      <button
        type="button"
        disabled={!canManage}
        onClick={() => updateOutput(output.id, { isEnabled: !output.isEnabled })}
        className={cn(
          "min-h-11 rounded-lg px-4 text-sm font-bold transition active:scale-95",
          output.isEnabled
            ? "bg-emerald-600 text-slate-950"
            : "border border-slate-700 bg-slate-800 text-slate-400",
          !canManage && "pointer-events-none opacity-60",
        )}
      >
        {output.isEnabled ? "Включён" : "Выключен"}
      </button>

      {isPrinter && (
        <button
          type="button"
          onClick={() => testPrint(output.id)}
          className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 active:scale-95"
        >
          Тест печати
        </button>
      )}

      {canManage && (
        <button
          type="button"
          onClick={() => removeOutput(output.id)}
          aria-label={`Удалить вывод ${output.name}`}
          className="ml-auto min-h-11 rounded-lg px-3 text-sm text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const JOB_STATUS_LABELS: Record<PrintJob["status"], string> = {
  queued: "В очереди",
  printing: "Печатается",
  printed: "Напечатано",
  failed: "Ошибка",
};

const JOB_STATUS_STYLES: Record<PrintJob["status"], string> = {
  queued: "bg-slate-800 text-slate-300",
  printing: "bg-sky-950/70 text-sky-300",
  printed: "bg-emerald-950/70 text-emerald-300",
  failed: "bg-rose-950/70 text-rose-300",
};

/**
 * Очередь заданий печати.
 *
 * Показываем её человеку намеренно: упавшая марка означает блюдо, которое
 * никто не готовит, и узнать об этом надо здесь, а не от гостя через полчаса.
 */
function PrintQueue() {
  const { jobs, retry, reprint, clearFinished, failedCount } = usePrinting();
  const { can } = useAccess();
  const { findStation } = useStations();
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? jobs : jobs.slice(0, 10);

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Очередь печати
        </h2>
        <div className="flex items-center gap-2">
          {failedCount > 0 && (
            <span className="rounded-md bg-rose-950/70 px-2 py-1 text-xs font-bold text-rose-300">
              Ошибок: {failedCount}
            </span>
          )}
          <button
            type="button"
            onClick={clearFinished}
            className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-400 transition hover:bg-slate-700 active:scale-95"
          >
            Убрать напечатанные
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-slate-600">Заданий не было.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((job) => (
            <li
              key={job.id}
              className="rounded-lg border border-slate-800 bg-slate-900 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-bold",
                    JOB_STATUS_STYLES[job.status],
                  )}
                >
                  {JOB_STATUS_LABELS[job.status]}
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {findStation(job.stationId)?.name ?? "Станция удалена"}
                </span>
                {job.isReprint && (
                  <span className="rounded-md bg-amber-950/70 px-2 py-1 text-xs font-bold text-amber-300">
                    Копия
                  </span>
                )}
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {new Date(job.createdAt).toLocaleTimeString("ru-RU")}
                </span>

                <div className="ml-auto flex gap-2">
                  {job.status === "failed" && (
                    <button
                      type="button"
                      onClick={() => retry(job.id)}
                      className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 active:scale-95"
                    >
                      Повторить
                    </button>
                  )}
                  {job.status === "printed" && can("print.reprint") && (
                    <button
                      type="button"
                      onClick={() => reprint(job.id)}
                      className="min-h-11 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 active:scale-95"
                    >
                      Копия
                    </button>
                  )}
                </div>
              </div>

              {job.error && (
                <p className="mt-2 text-xs text-rose-400">{job.error}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {jobs.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="min-h-11 text-sm font-semibold text-slate-400 transition hover:text-slate-200"
        >
          {showAll ? "Свернуть" : `Показать все (${jobs.length})`}
        </button>
      )}
    </section>
  );
}
