import type { ISODateString, UUID } from "./common";

/**
 * Станции приготовления и их точки вывода.
 *
 * Ключевое решение: **экран и принтер — не два механизма, а два вывода одной
 * станции**. Отправка позиций на станцию — одно событие; сколько у станции
 * выводов, столько получателей у одного и того же тикета. «На кухне монитор
 * и принтер дублируют друг друга» — это станция с двумя выводами, а не ветка
 * в коде.
 *
 * Развести их на «KDS» и «печать» нельзя: логика раздвоится, и рано или поздно
 * напечатается то, чего нет на экране.
 */

export interface PrepStation {
  id: UUID;
  venueId: UUID;
  /** «Горячий цех», «Бар», «Пицца». */
  name: string;
  sortOrder: number;
}

export type StationOutputKind = "screen" | "printer";

export interface StationOutput {
  id: UUID;
  stationId: UUID;
  kind: StationOutputKind;
  name: string;
  /** Адрес ESC/POS-принтера. У вывода типа `screen` — `null`. */
  host: string | null;
  port: number | null;
  /** Выключенный вывод не получает тикеты, но остаётся в настройках. */
  isEnabled: boolean;
}

export type PrintJobStatus = "queued" | "printing" | "printed" | "failed";

/**
 * Задание печати одной марки.
 *
 * Очередь, а не прямой вызов принтера: печать не должна блокировать отправку
 * заказа (инвариант №3 — источник истины БД, а не бумага), а упавшее задание
 * обязано быть видимым и повторяемым. На бэкенде очередь живёт в БД, здесь —
 * в состоянии терминала.
 */
export interface PrintJob {
  id: UUID;
  outputId: UUID;
  stationId: UUID;
  orderId: UUID;
  /** Что именно печатаем: позиции, ушедшие на станцию этой отправкой. */
  itemIds: UUID[];
  status: PrintJobStatus;
  /** Повтор помечается на бумаге «КОПИЯ»: молчаливый дубль — второе блюдо. */
  isReprint: boolean;
  attempts: number;
  error: string | null;
  createdAt: ISODateString;
}

/**
 * Есть ли у станции живой экран.
 *
 * Флагом не храним — он выводится из выводов, иначе один факт лежал бы
 * в двух местах и разъезжался при перенастройке. Станция без экрана работает
 * «по бумаге»: отслеживать на ней нечего, и позиции считаются готовыми сразу
 * после отправки, иначе тикеты копились бы вечно — двигать их статусы некому.
 */
export function hasScreen(
  stationId: UUID,
  outputs: readonly StationOutput[],
): boolean {
  return outputs.some(
    (output) =>
      output.stationId === stationId &&
      output.kind === "screen" &&
      output.isEnabled,
  );
}

/**
 * Идентификаторы станций, у которых есть живой экран.
 *
 * Считается **от выводов, а не от справочника станций**, и это существенно.
 * Идентификатор станции приезжает вместе с позицией меню — то есть с узла,
 * из чужой БД, — и в справочнике терминала его может не оказаться вовсе.
 * Список «станций без экрана» такой идентификатор не покрыл бы: позиция ушла
 * бы в `cooking` и осталась там навсегда — экрана у неё нет, отметить
 * готовность некому. Список «станций с экраном» отвечает на тот же вопрос
 * с правильной стороны: незнакомая станция в него не попадает и работает
 * по бумаге, как и всякая станция без экрана.
 */
export function stationIdsWithScreen(
  outputs: readonly StationOutput[],
): UUID[] {
  return [
    ...new Set(
      outputs
        .filter((output) => output.kind === "screen" && output.isEnabled)
        .map((output) => output.stationId),
    ),
  ];
}

export function outputsOfStation(
  stationId: UUID,
  outputs: readonly StationOutput[],
): StationOutput[] {
  return outputs.filter((output) => output.stationId === stationId);
}
