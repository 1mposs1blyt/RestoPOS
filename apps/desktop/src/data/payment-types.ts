import type { PaymentType } from "@restopos/shared-types";
import { DEMO_VENUE } from "./session-source";

/**
 * Типы оплаты заведения.
 *
 * Справочник, а не перечисление: у сети бывают «Сбербанк», «Долями»,
 * «Сертификат», у столовой — «Питание персонала». Каждый новый тип не должен
 * означать пересборку кассы.
 *
 * На проде приезжает с узла вместе с меню и односторонне из облака
 * (инвариант №6: справочники едут в одну сторону). Здесь — эталонный набор,
 * совпадающий с тем, что видно на экране оплаты iiko.
 */
export const PAYMENT_TYPES: PaymentType[] = [
  {
    id: "pt-cash",
    venueId: DEMO_VENUE.id,
    label: "Наличные",
    kind: "cash",
    countsAsRevenue: true,
    // Единственный тип, ради которого ящик обязан открыться: сдачу берут оттуда.
    opensDrawer: true,
    sortOrder: 0,
  },
  {
    id: "pt-card",
    venueId: DEMO_VENUE.id,
    label: "Банковские карты",
    kind: "card",
    countsAsRevenue: true,
    opensDrawer: false,
    sortOrder: 1,
  },
  {
    id: "pt-external",
    venueId: DEMO_VENUE.id,
    label: "Безнал. расчёт",
    kind: "external",
    countsAsRevenue: true,
    opensDrawer: false,
    sortOrder: 2,
  },
  {
    // Не скидка 100%: чек есть, блюда со склада списываются, выручки нет.
    // Сведя это к скидке, мы потеряли бы разницу в отчётах.
    id: "pt-no-revenue",
    venueId: DEMO_VENUE.id,
    label: "Без выручки",
    kind: "no_revenue",
    countsAsRevenue: false,
    opensDrawer: false,
    sortOrder: 3,
  },
];

export function findPaymentType(id: string): PaymentType | undefined {
  return PAYMENT_TYPES.find((type) => type.id === id);
}
