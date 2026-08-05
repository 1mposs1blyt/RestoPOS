import { useCallback, useEffect, useRef, useState } from "react";
import type { Money, UUID } from "@restopos/shared-types";
import {
  fetchOccupancy,
  occupancyFromNode,
  type Occupancy,
} from "../data/occupancy-source";
import { useOrders } from "./orders";

/**
 * Занятость столов для схемы зала.
 *
 * Один вход для двух источников: узел, если он настроен, иначе локальный стор
 * заказов. Экран о разнице не знает — он спрашивает «занят ли стол и чем»,
 * а не «есть ли заказ в сторе».
 */

export interface TableOccupancy {
  orderId: UUID;
  guestCount: number;
  /** ISO-время открытия: зал показывает, сколько стол уже занят. */
  createdAt: string;
  /**
   * Итог по столу. `null` — источник его не знает.
   *
   * Узел отдаёт `totalAmount` константой `0.00` (сумма по позициям на нём
   * не считается), и показать это как «0 ₽» значило бы соврать: официант
   * прочтёт, что за столом ничего не заказано. Пока источник не научится
   * считать, зал не показывает сумму вовсе.
   */
  total: Money | null;
}

/**
 * Как часто перечитывать занятость с узла.
 *
 * Опрос, а не подписка, потому что realtime на узле пока нет вовсе. Когда
 * появятся события (`order.created`, `order.updated`), опрос сменится на
 * перезапрос по событию — инвариант №3: событие сигнализирует перечитать,
 * а состояние в нём не едет.
 *
 * Десять секунд — компромисс: зал не обязан быть мгновенным (стол занимают
 * минутами), а опрос в секунду на десяти терминалах это уже нагрузка на узел
 * ради данных, которые меняются раз в полчаса.
 */
const POLL_INTERVAL_MS = 10_000;

export interface HallOccupancy {
  /** Занят ли стол и чем. `null` — свободен. */
  occupancyOf: (tableId: UUID) => TableOccupancy | null;
  /**
   * Ведётся ли заказ этого стола на узле, а не в локальном сторе.
   *
   * Экран заказа к узлу ещё не подключён, и открывать его для такого стола
   * нельзя: локальный стор про этот заказ не знает и завёл бы рядом второй,
   * параллельный. Два заказа на одном столе — это неоплаченная еда.
   */
  isRemote: (tableId: UUID) => boolean;
  /** Ошибка последнего опроса. Зал продолжает показывать прошлые данные. */
  error: string | null;
}

export function useHallOccupancy(venueId: UUID): HallOccupancy {
  /*
   * Локальный стор читаем всегда, даже когда занятость приходит с узла:
   * хук нельзя вызвать условно, а лишней работы тут нет — это уже готовый
   * контекст, а не запрос.
   */
  const { orderOfTable, orderTotal } = useOrders();

  const fromNode = occupancyFromNode();
  const [remote, setRemote] = useState<Occupancy[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Свежесть ответа: медленный опрос не должен затирать более поздний.
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!fromNode) return;

    let stopped = false;

    const poll = () => {
      const attempt = attemptRef.current + 1;
      attemptRef.current = attempt;

      fetchOccupancy(venueId)
        .then((occupancy) => {
          if (stopped || attemptRef.current !== attempt) return;
          setRemote(occupancy);
          setError(null);
        })
        .catch((reason: unknown) => {
          if (stopped || attemptRef.current !== attempt) return;
          /*
           * Прошлые данные не стираем. Оборванный на секунду опрос не означает,
           * что зал опустел, а мигающая от этого схема — худшее, что можно
           * показать официанту в час пик.
           */
          setError(
            reason instanceof Error
              ? reason.message
              : "Занятость столов не обновляется",
          );
        });
    };

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [fromNode, venueId]);

  const occupancyOf = useCallback(
    (tableId: UUID): TableOccupancy | null => {
      /*
       * Занятость — объединение двух источников, а не выбор одного.
       *
       * Пока экран заказа локальный, а зал уже читает узел, оба они говорят
       * правду про разные заказы: узел про те, что завели до нас, локальный
       * стор — про те, что официант забивает прямо сейчас. Показывать только
       * узел значит рисовать свободным стол, за которым сидят и на который
       * уже пробит счёт; только стор — терять всё, что открыто на других
       * терминалах. Узел старше: заказ, который знают обе стороны, считаем
       * его, потому что там он переживёт перезагрузку терминала.
       */
      const found = fromNode
        ? remote.find((entry) => entry.tableId === tableId)
        : undefined;
      if (found) {
        return {
          orderId: found.orderId,
          guestCount: found.guestCount,
          createdAt: found.createdAt,
          total: null,
        };
      }

      const order = orderOfTable(tableId);
      return order
        ? {
            orderId: order.id,
            // У старых заказов и на прилавке числа гостей нет вовсе.
            guestCount: order.guestCount ?? 1,
            createdAt: order.createdAt,
            total: orderTotal(order.id),
          }
        : null;
    },
    [fromNode, remote, orderOfTable, orderTotal],
  );

  const isRemote = useCallback(
    (tableId: UUID) =>
      fromNode && remote.some((entry) => entry.tableId === tableId),
    [fromNode, remote],
  );

  return { occupancyOf, isRemote, error };
}
