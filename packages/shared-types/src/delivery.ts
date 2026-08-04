import type { ISODateString, UUID } from "./common";

/**
 * Доставка и самовывоз.
 *
 * Это **надстройка над заказом**, а не его замена: еда та же, кухня та же,
 * оплата та же. Отличается тем, что заказ покидает заведение — появляются
 * адрес, курьер, срок и своя цепочка состояний.
 *
 * Статус доставки намеренно отделён от статуса заказа. Заказ бывает `paid`,
 * пока доставка ещё `on_way`: гость оплатил картой на сайте, а еду везут.
 * Свести их в одно поле — значит потерять одно из двух.
 */

export type DeliveryKind = "delivery" | "pickup";

/**
 * Цепочка состояний доставки — ровно та, что в кассе iiko.
 *
 * `unconfirmed` — заказ пришёл из внешнего источника (сайт, агрегатор)
 * и его ещё не принял человек. Отдельное состояние, а не «новый»: неподтверждённый
 * заказ нельзя отдавать на кухню, пока не проверили адрес и наличие.
 */
export type DeliveryStatus =
  | "unconfirmed"
  | "new"
  | "cooking"
  | "ready"
  | "on_way"
  | "closed"
  | "canceled";

export interface Delivery {
  id: UUID;
  venueId: UUID;
  /** Заказ, в котором лежат позиции и по которому считаются деньги. */
  orderId: UUID;
  kind: DeliveryKind;
  status: DeliveryStatus;
  /** Адрес. У самовывоза его нет — гость приходит сам. */
  address: string | null;
  /** Курьер. У самовывоза не бывает. */
  courierId: UUID | null;
  customerName: string;
  phone: string;
  comment: string;
  /** К какому времени ждут. По нему считается опоздание. */
  dueAt: ISODateString;
  /**
   * Номер во внешней системе — агрегатор, сайт, приложение. Гость называет
   * именно его, а не наш внутренний номер заказа.
   */
  externalNumber: string | null;
  createdAt: ISODateString;
  clientId?: string;
}

/**
 * Допустимые переходы.
 *
 * Таблицей, а не проверками по месту: состояний семь, и «можно ли отсюда
 * туда» — это свойство домена, которое обязано быть одинаковым в кассе,
 * на кухне и на узле. Разъехавшись, они дадут заказ, застрявший в состоянии,
 * из которого его никто не может вытащить.
 */
export const DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  unconfirmed: ["new", "canceled"],
  new: ["cooking", "canceled"],
  cooking: ["ready", "canceled"],
  // У самовывоза «в пути» не бывает — из `ready` он закрывается сразу
  // выдачей гостю. Проверку рода делает `canAdvance`.
  ready: ["on_way", "closed", "canceled"],
  on_way: ["closed", "canceled"],
  // Закрытая доставка — финал: деньги получены, еда отдана.
  closed: [],
  canceled: [],
};

export function canAdvance(
  delivery: Pick<Delivery, "kind" | "status">,
  next: DeliveryStatus,
): boolean {
  if (!DELIVERY_TRANSITIONS[delivery.status].includes(next)) return false;
  // Самовывоз никто не везёт: курьера нет, и «в пути» для него бессмыслица.
  if (next === "on_way" && delivery.kind === "pickup") return false;
  return true;
}
