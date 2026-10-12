import type { MenuCategory, MenuItem, UUID } from "@restopos/shared-types";
import type { MenuSnapshot } from "@restopos/api-client";
import { isNodeConfigured, nodeApi } from "../api";

/**
 * Откуда терминал берёт меню.
 *
 * Четвёртое место (после `session-source`, `tables-source` и
 * `occupancy-source`), знающее про узел. Стор и экраны об этом не знают: им
 * отдаётся готовая пара «категории + позиции», а откуда она взялась — из БД
 * узла или из демо-каталога ниже — их не касается.
 *
 * Демо-каталог живёт здесь, а не в сторе, по той же причине, по которой
 * localStorage живёт в `tables-source`: это **источник данных**, один
 * из двух, и держать его рядом со вторым — единственный способ не отрастить
 * в сторе ветку «а если узла нет».
 */

/*
 * Демо-каталог. Форма данных совпадает с ответом узла до поля, поэтому
 * переключение `VITE_NODE_URL` не требует правок ни в сторе, ни в экранах.
 *
 * Идентификаторы здесь говорящие (`item-borsch`), а не UUID: на них ссылаются
 * заказы в localStorage и тесты сторов, и человекочитаемый `menuItemId`
 * в дампе состояния экономит час на разборе «почему в чеке не та позиция».
 */
const VENUE_ID: UUID = "venue-demo";

const DEMO_CATEGORIES: MenuCategory[] = [
  { id: "cat-soup", venueId: VENUE_ID, name: "Супы", sortOrder: 1 },
  { id: "cat-hot", venueId: VENUE_ID, name: "Горячее", sortOrder: 2 },
  { id: "cat-salad", venueId: VENUE_ID, name: "Салаты", sortOrder: 3 },
  { id: "cat-drink", venueId: VENUE_ID, name: "Напитки", sortOrder: 4 },
  { id: "cat-dessert", venueId: VENUE_ID, name: "Десерты", sortOrder: 5 },
];

const DEMO_ITEMS: MenuItem[] = [
  {
    id: "item-borsch",
    categoryId: "cat-soup",
    name: "Борщ с говядиной",
    price: "420.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
  {
    id: "item-pho",
    categoryId: "cat-soup",
    name: "Фо Бо",
    price: "480.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
  {
    id: "item-ribeye",
    categoryId: "cat-hot",
    name: "Стейк Рибай",
    price: "1500.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
  {
    id: "item-carbonara",
    categoryId: "cat-hot",
    name: "Паста карбонара",
    price: "620.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
  {
    id: "item-margherita",
    categoryId: "cat-hot",
    name: "Пицца Маргарита",
    price: "690.00",
    isStopListed: true,
    prepStationId: "station-kitchen",
  },
  {
    id: "item-caesar",
    categoryId: "cat-salad",
    name: "Цезарь с курицей",
    price: "540.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
  {
    id: "item-greek",
    categoryId: "cat-salad",
    name: "Греческий",
    price: "390.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
  {
    id: "item-mors",
    categoryId: "cat-drink",
    name: "Морс клюквенный",
    price: "150.00",
    isStopListed: false,
    prepStationId: "station-bar",
  },
  {
    id: "item-espresso",
    categoryId: "cat-drink",
    name: "Эспрессо",
    price: "180.00",
    isStopListed: false,
    prepStationId: "station-bar",
  },
  {
    id: "item-lemonade",
    categoryId: "cat-drink",
    name: "Лимонад домашний",
    price: "260.00",
    isStopListed: false,
    prepStationId: "station-bar",
  },
  {
    id: "item-medovik",
    categoryId: "cat-dessert",
    name: "Медовик",
    price: "320.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
  {
    id: "item-cheesecake",
    categoryId: "cat-dessert",
    name: "Чизкейк Нью-Йорк",
    price: "380.00",
    isStopListed: false,
    prepStationId: "station-kitchen",
  },
];

/**
 * Меню заведения. С узлом — из его БД, без узла — демо-каталог.
 *
 * Кэша здесь нет намеренно: меню перечитывает стор при монтировании и
 * по кнопке, и знать про свежесть данных — его забота, а не источника.
 */
export async function fetchMenu(venueId: UUID): Promise<MenuSnapshot> {
  if (!isNodeConfigured()) {
    return { categories: DEMO_CATEGORIES, items: DEMO_ITEMS };
  }

  return nodeApi("pos").menu(venueId);
}
