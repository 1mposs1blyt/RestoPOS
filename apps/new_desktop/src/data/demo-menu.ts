import type { MenuCategory, MenuItem } from "@restopos/shared-types";

/**
 * Демо-каталог прилавка. Прототип интерфейса, узла под ним пока нет:
 * когда появится `data/menu-source.ts`, этот файл станет запасным вариантом
 * для демо-режима, как в старой кассе.
 */

const VENUE = "venue-demo";

export const DEMO_CATEGORIES: MenuCategory[] = [
  { id: "cat-shawarma", venueId: VENUE, name: "Шаурма", sortOrder: 1 },
  { id: "cat-drinks", venueId: VENUE, name: "Напитки", sortOrder: 2 },
  { id: "cat-snacks", venueId: VENUE, name: "Снэки", sortOrder: 3 },
  { id: "cat-desserts", venueId: VENUE, name: "Десерты", sortOrder: 4 },
];

function item(
  id: string,
  categoryId: string,
  name: string,
  price: string,
  isStopListed = false,
): MenuItem {
  return { id, categoryId, name, price, isStopListed, prepStationId: null };
}

export const DEMO_ITEMS: MenuItem[] = [
  item("itm-shw-classic", "cat-shawarma", "Шаурма классическая", "280.00"),
  item("itm-shw-hot", "cat-shawarma", "Шаурма острая", "320.00"),
  item("itm-shw-chicken", "cat-shawarma", "Шаурма с курицей", "260.00"),
  item("itm-shw-beef", "cat-shawarma", "Шаурма с говядиной", "340.00"),
  item("itm-shw-xl", "cat-shawarma", "Шаурма XL", "380.00"),
  item("itm-shw-cheese", "cat-shawarma", "Шаурма с сыром", "310.00"),
  item("itm-shw-veg", "cat-shawarma", "Шаурма овощная", "220.00"),
  item("itm-shw-lavash", "cat-shawarma", "Лаваш с сыром", "240.00"),
  item("itm-shw-hotdog", "cat-shawarma", "Хот-дог", "190.00"),
  item("itm-shw-burger", "cat-shawarma", "Бургер", "290.00"),
  item("itm-shw-shashlik", "cat-shawarma", "Шашлык в лаваше", "360.00"),
  item("itm-shw-falafel", "cat-shawarma", "Фалафель в пите", "250.00"),

  item("itm-drk-cola", "cat-drinks", "Кола 0,5", "110.00"),
  item("itm-drk-cola-l", "cat-drinks", "Кола 1,0", "160.00"),
  item("itm-drk-fanta", "cat-drinks", "Фанта 0,5", "110.00"),
  item("itm-drk-sprite", "cat-drinks", "Спрайт 0,5", "110.00"),
  item("itm-drk-water", "cat-drinks", "Вода 0,5", "80.00"),
  item("itm-drk-water-gas", "cat-drinks", "Вода газированная 0,5", "80.00"),
  item("itm-drk-tea", "cat-drinks", "Чай", "80.00"),
  item("itm-drk-tea-green", "cat-drinks", "Чай зелёный", "80.00"),
  item("itm-drk-coffee", "cat-drinks", "Кофе", "150.00"),
  item("itm-drk-latte", "cat-drinks", "Латте", "190.00"),
  item("itm-drk-cappuccino", "cat-drinks", "Капучино", "190.00"),
  item("itm-drk-mors", "cat-drinks", "Морс", "120.00"),
  item("itm-drk-juice", "cat-drinks", "Сок 0,2", "90.00"),
  item("itm-drk-ayran", "cat-drinks", "Айран", "100.00"),

  item("itm-snk-fries", "cat-snacks", "Картофель фри", "140.00"),
  item("itm-snk-fries-big", "cat-snacks", "Картофель фри большой", "190.00"),
  item("itm-snk-nuggets", "cat-snacks", "Наггетсы 6 шт", "180.00"),
  item("itm-snk-nuggets-9", "cat-snacks", "Наггетсы 9 шт", "240.00"),
  item("itm-snk-rings", "cat-snacks", "Луковые кольца", "160.00", true),
  item("itm-snk-wings", "cat-snacks", "Крылышки 4 шт", "260.00"),
  item("itm-snk-cheese", "cat-snacks", "Соус сырный", "40.00"),
  item("itm-snk-garlic", "cat-snacks", "Соус чесночный", "40.00"),
  item("itm-snk-bbq", "cat-snacks", "Соус барбекю", "40.00"),
  item("itm-snk-hot", "cat-snacks", "Соус острый", "40.00"),

  item("itm-dst-donut", "cat-desserts", "Пончик", "90.00"),
  item("itm-dst-icecream", "cat-desserts", "Мороженое", "120.00"),
  item("itm-dst-cheesecake", "cat-desserts", "Чизкейк", "210.00"),
  item("itm-dst-brownie", "cat-desserts", "Брауни", "180.00"),
];
