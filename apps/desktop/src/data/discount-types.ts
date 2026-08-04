import type { DiscountType } from "@restopos/shared-types";
import { DEMO_VENUE } from "./session-source";

/**
 * Скидки и надбавки заведения.
 *
 * На проде приезжает с узла односторонне из облака, как и типы оплаты.
 * Здесь эталонный набор: гостевая, персонал, обслуживание, доставка.
 *
 * `requiresApproval` расставлен по величине: гостевые 5–10% кассир даёт сам,
 * а 30% на персонал — с подтверждением. Иначе право `order.discount` либо
 * блокирует обычную работу, либо не защищает ни от чего.
 */
export const DISCOUNT_TYPES: DiscountType[] = [
  {
    id: "dt-guest-5",
    venueId: DEMO_VENUE.id,
    label: "Гостевая 5%",
    kind: "discount",
    mode: "percent",
    value: "5",
    requiresApproval: false,
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "dt-guest-10",
    venueId: DEMO_VENUE.id,
    label: "Гостевая 10%",
    kind: "discount",
    mode: "percent",
    value: "10",
    requiresApproval: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "dt-staff-30",
    venueId: DEMO_VENUE.id,
    label: "Персонал 30%",
    kind: "discount",
    mode: "percent",
    value: "30",
    // Скидка такого размера — повод для разговора при разборе смены.
    requiresApproval: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "dt-service-10",
    venueId: DEMO_VENUE.id,
    label: "Обслуживание 10%",
    kind: "surcharge",
    mode: "percent",
    value: "10",
    requiresApproval: false,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "dt-delivery-200",
    venueId: DEMO_VENUE.id,
    label: "Доставка 200 ₽",
    kind: "surcharge",
    mode: "amount",
    value: "200.00",
    requiresApproval: false,
    isActive: true,
    sortOrder: 4,
  },
];

export function findDiscountType(id: string): DiscountType | undefined {
  return DISCOUNT_TYPES.find((type) => type.id === id);
}
