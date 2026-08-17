import { describe, expect, it } from "vitest";
import type { PrintJob } from "@restopos/shared-types";
import { restoreJobs } from "./printing";

/**
 * Очередь печати переживает перезапуск терминала в localStorage, и статусы
 * приезжают оттуда как есть. «Печатается» — единственный статус, которого
 * после запуска существовать не может: исполнителя, который его выставил,
 * больше нет.
 */
function job(patch: Partial<PrintJob> & { id: string }): PrintJob {
  return {
    outputId: "out-1",
    stationId: "station-kitchen",
    orderId: "o1",
    itemIds: ["i1"],
    status: "queued",
    isReprint: false,
    attempts: 0,
    error: null,
    createdAt: "2026-08-05T10:00:00.000Z",
    ...patch,
  };
}

describe("очередь печати после перезапуска", () => {
  it("зависшее «печатается» становится ошибкой, а не остаётся висеть", () => {
    // Иначе задание не подхватит исполнитель (он берёт только `queued`)
    // и не покажет кнопку повтора экран (она есть только у `failed`):
    // марка не вышла, а узнать об этом неоткуда.
    const [restored] = restoreJobs([job({ id: "j1", status: "printing" })]);

    expect(restored.status).toBe("failed");
    expect(restored.error).toContain("перезапущена");
  });

  it("не превращает зависшее задание в новое: повтор — решение человека", () => {
    // Марка могла напечататься до обрыва. Автоповтор здесь — второе
    // приготовленное блюдо.
    const [restored] = restoreJobs([job({ id: "j1", status: "printing" })]);

    expect(restored.status).not.toBe("queued");
    expect(restored.isReprint).toBe(false);
    expect(restored.attempts).toBe(0);
  });

  it("остальные статусы не трогает", () => {
    const jobs = restoreJobs([
      job({ id: "j1", status: "queued" }),
      job({ id: "j2", status: "printed" }),
      job({ id: "j3", status: "failed", error: "принтер не отвечает" }),
    ]);

    expect(jobs.map((entry) => entry.status)).toEqual([
      "queued",
      "printed",
      "failed",
    ]);
    // Чужую причину отказа не затираем: по ней и чинят принтер.
    expect(jobs[2].error).toBe("принтер не отвечает");
  });
});
