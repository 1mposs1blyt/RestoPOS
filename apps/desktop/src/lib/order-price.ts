import type { Money, OrderItem } from "@restopos/shared-types";
import type { MenuItemLookup } from "../state/menu";
import { multiplyMoney, ZERO_MONEY } from "./money";

/**
 * Цена позиции заказа.
 *
 * Единственное место, где решается, откуда её брать. Раньше каждый денежный
 * путь — итог заказа, строки фискального чека, отчёты — сам лазил в меню
 * за ценой, и все трое одинаково ошибались: цену в меню правят в течение
 * смены, а блюда удаляют. Уже собранный чек от этого менялся задним числом,
 * а у удалённого блюда строка обнулялась, и гость недоплачивал.
 *
 * Теперь цена лежит в самой позиции снимком (`OrderItem.price`), а меню
 * остаётся запасным вариантом ровно для одного случая — заказов, набранных
 * до появления поля. Их нельзя ни обнулить, ни пересчитать: это открытые
 * чеки, за которыми сидят гости.
 */
export function unitPrice(item: OrderItem, findMenuItem: MenuItemLookup): Money {
  if (item.price !== undefined) return item.price;

  /*
   * Заказ из прошлой версии. Меню — единственное, что о цене известно;
   * если блюда там уже нет, честнее показать ноль, чем выдумать сумму:
   * кассир увидит «—» в строке и разберётся, а подставленная цена
   * разошлась бы с тем, что гостю называли.
   */
  return findMenuItem(item.menuItemId)?.price ?? ZERO_MONEY;
}

/** Стоимость строки: цена за единицу на количество. */
export function lineTotal(
  item: OrderItem,
  findMenuItem: MenuItemLookup,
): Money {
  return multiplyMoney(unitPrice(item, findMenuItem), item.quantity);
}
