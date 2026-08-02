import type { MenuCategory, MenuItem, UUID } from "@restopos/shared-types";

/**
 * Демо-каталог меню.
 *
 * Форма данных намеренно совпадает с ответом `GET /venues/:id/menu`:
 * позиции ссылаются на категорию через `categoryId` и не дублируют её имя,
 * цена — строка (`Money`). Когда появится эндпоинт, эти константы заменит
 * запрос, а экраны останутся прежними.
 */

const VENUE_ID: UUID = "venue-demo";

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: "cat-soup", venueId: VENUE_ID, name: "Супы", sortOrder: 1 },
  { id: "cat-hot", venueId: VENUE_ID, name: "Горячее", sortOrder: 2 },
  { id: "cat-salad", venueId: VENUE_ID, name: "Салаты", sortOrder: 3 },
  { id: "cat-drink", venueId: VENUE_ID, name: "Напитки", sortOrder: 4 },
  { id: "cat-dessert", venueId: VENUE_ID, name: "Десерты", sortOrder: 5 },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "item-borsch",
    categoryId: "cat-soup",
    name: "Борщ с говядиной",
    price: "420.00",
    isStopListed: false,
    prepStation: "kitchen",
  },
  {
    id: "item-pho",
    categoryId: "cat-soup",
    name: "Фо Бо",
    price: "480.00",
    isStopListed: false,
    prepStation: "kitchen",
  },
  {
    id: "item-ribeye",
    categoryId: "cat-hot",
    name: "Стейк Рибай",
    price: "1500.00",
    isStopListed: false,
    prepStation: "kitchen",
  },
  {
    id: "item-carbonara",
    categoryId: "cat-hot",
    name: "Паста карбонара",
    price: "620.00",
    isStopListed: false,
    prepStation: "kitchen",
  },
  {
    id: "item-margherita",
    categoryId: "cat-hot",
    name: "Пицца Маргарита",
    price: "690.00",
    isStopListed: true,
    prepStation: "kitchen",
  },
  {
    id: "item-caesar",
    categoryId: "cat-salad",
    name: "Цезарь с курицей",
    price: "540.00",
    isStopListed: false,
    prepStation: "kitchen",
  },
  {
    id: "item-greek",
    categoryId: "cat-salad",
    name: "Греческий",
    price: "390.00",
    isStopListed: false,
    prepStation: "kitchen",
  },
  {
    id: "item-mors",
    categoryId: "cat-drink",
    name: "Морс клюквенный",
    price: "150.00",
    isStopListed: false,
    prepStation: "bar",
  },
  {
    id: "item-espresso",
    categoryId: "cat-drink",
    name: "Эспрессо",
    price: "180.00",
    isStopListed: false,
    prepStation: "bar",
  },
  {
    id: "item-lemonade",
    categoryId: "cat-drink",
    name: "Лимонад домашний",
    price: "260.00",
    isStopListed: false,
    prepStation: "bar",
  },
  {
    id: "item-medovik",
    categoryId: "cat-dessert",
    name: "Медовик",
    price: "320.00",
    isStopListed: false,
    prepStation: "kitchen",
  },
  {
    id: "item-cheesecake",
    categoryId: "cat-dessert",
    name: "Чизкейк Нью-Йорк",
    price: "380.00",
    isStopListed: false,
    prepStation: "kitchen",
  },
];

const BY_ID = new Map(MENU_ITEMS.map((item) => [item.id, item]));

export function findMenuItem(id: UUID): MenuItem | undefined {
  return BY_ID.get(id);
}

export function menuItemsOfCategory(categoryId: UUID): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.categoryId === categoryId);
}
