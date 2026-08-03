import type { TableLayout } from "@restopos/shared-types";
import { describe, expect, it } from "vitest";
import { clamp01, normalizeTables, toNormalized } from "./tables-migration";

/**
 * Миграция расстановки трёх поколений формата.
 *
 * Это чужие данные: менеджер раскладывал столы руками, и потерять их
 * при обновлении версии нельзя. Поколения: самое старое — ключ `number`
 * и `type`, затем `label`/`shape` с абсолютными `x`/`y`, текущее — доли `cx`/`cy`.
 */

const VENUE = "venue-1";

describe("текущее поколение", () => {
  it("проходит насквозь без изменений", () => {
    const current: TableLayout = {
      id: "t1",
      venueId: VENUE,
      label: "5",
      shape: "circle",
      cx: 0.25,
      cy: 0.75,
      width: 100,
      height: 100,
    };
    expect(normalizeTables([current], VENUE)).toEqual([current]);
  });
});

describe("абсолютные координаты", () => {
  it("пересчитываются в доли по центру стола", () => {
    // Прежняя поверхность — 1600x900. Стол 140x90 в точке (730, 405)
    // центром попадает ровно в середину.
    const [table] = normalizeTables(
      [{ id: "t1", label: "1", shape: "rectangle", x: 730, y: 405, width: 140, height: 90 }],
      VENUE,
    );
    expect(table.cx).toBeCloseTo(0.5, 5);
    expect(table.cy).toBeCloseTo(0.5, 5);
  });

  it("сохраняют пиксельный размер", () => {
    // Размер не масштабируется намеренно: иначе стол уходит под палец.
    const [table] = normalizeTables(
      [{ id: "t1", label: "1", x: 0, y: 0, width: 140, height: 90 }],
      VENUE,
    );
    expect(table.width).toBe(140);
    expect(table.height).toBe(90);
  });

  it("не выпускают стол за границы холста", () => {
    // Стол за краем недостижим пальцем, поэтому доля зажимается в 0..1.
    const [table] = normalizeTables(
      [{ id: "t1", label: "1", x: 5000, y: -900, width: 90, height: 90 }],
      VENUE,
    );
    expect(table.cx).toBe(1);
    expect(table.cy).toBe(0);
  });
});

describe("самое старое поколение", () => {
  it("берёт номер из ключа number, а форму из type", () => {
    const [table] = normalizeTables(
      [{ id: "t1", number: "12", type: "circle", x: 0, y: 0, width: 100, height: 100 }],
      VENUE,
    );
    expect(table.label).toBe("12");
    expect(table.shape).toBe("circle");
  });

  it("предпочитает новые ключи старым, когда есть оба", () => {
    const [table] = normalizeTables(
      [
        {
          id: "t1",
          number: "12",
          label: "7",
          type: "circle",
          shape: "square",
          x: 0,
          y: 0,
          width: 90,
          height: 90,
        },
      ],
      VENUE,
    );
    expect(table.label).toBe("7");
    expect(table.shape).toBe("square");
  });

  it("подставляет заведение, когда его в записи не было", () => {
    const [table] = normalizeTables(
      [{ id: "t1", label: "1", x: 0, y: 0, width: 90, height: 90 }],
      VENUE,
    );
    expect(table.venueId).toBe(VENUE);
  });

  it("не теряет стол без номера — помечает его вопросом", () => {
    // Молча выбросить чужой стол хуже, чем показать «?»: место в зале занято.
    const [table] = normalizeTables(
      [{ id: "t1", x: 0, y: 0, width: 90, height: 90 }],
      VENUE,
    );
    expect(table.label).toBe("?");
    expect(table.shape).toBe("square");
  });
});

describe("clamp01", () => {
  it("зажимает долю в границы холста", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(0.42)).toBe(0.42);
  });
});

describe("toNormalized", () => {
  it("считает центр, а не левый верхний угол", () => {
    const table = toNormalized(
      { id: "t1", label: "1", x: 0, y: 0, width: 160, height: 90 },
      VENUE,
    );
    // Центр стола в точке (80, 45) от начала поверхности 1600x900.
    expect(table.cx).toBeCloseTo(0.05, 5);
    expect(table.cy).toBeCloseTo(0.05, 5);
  });
});
