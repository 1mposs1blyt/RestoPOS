import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MenuCategory, MenuItem, UUID } from "@restopos/shared-types";
import { fetchMenu } from "../data/menu-source";

/**
 * Меню заведения.
 *
 * Раньше это был модуль констант, и все, кому нужна была цена или станция,
 * импортировали `findMenuItem` напрямую. С переездом на узел так больше
 * нельзя: меню приезжает запросом, то есть появляется не сразу и может
 * не появиться вовсе. Поэтому здесь стор — по образцу `state/tables.tsx`,
 * с теми же тремя состояниями: грузится, готово, не доехало.
 *
 * Пустое меню и недоехавшее меню — **разное**. Первое означает, что
 * в заведении не завели ни одного блюда; второе — что узел молчит. Кассир,
 * которому показали пустой список вместо отказа, решит, что распродано всё,
 * и пойдёт объяснять это гостю.
 */

/** Состояние загрузки. Совпадает с `TablesStatus` намеренно: та же задача. */
export type MenuStatus = "loading" | "ready" | "error";

/**
 * Поиск позиции по идентификатору.
 *
 * Вынесен в тип, потому что уезжает параметром в чистые функции
 * (`lib/reports.ts`, редьюсер заказов): им нужно знать цену и станцию, но
 * не откуда взялось меню.
 */
export type MenuItemLookup = (id: UUID) => MenuItem | undefined;

interface MenuValue {
  categories: MenuCategory[];
  items: MenuItem[];
  status: MenuStatus;
  /** Текст отказа для экрана. `null` — всё в порядке. */
  error: string | null;
  reload: () => void;
  findMenuItem: MenuItemLookup;
  itemsOfCategory: (categoryId: UUID) => MenuItem[];
}

const MenuContext = createContext<MenuValue | null>(null);

export function MenuProvider({
  venueId,
  children,
}: {
  venueId: UUID;
  children: ReactNode;
}) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [status, setStatus] = useState<MenuStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  /*
   * Номер попытки: по кнопке «повторить» их бывает несколько подряд, и ответ
   * отменённой не должен затирать результат следующей. То же, что в `tables`.
   */
  const attemptRef = useRef(0);

  const reload = useCallback(() => {
    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;

    setStatus("loading");
    setError(null);

    fetchMenu(venueId)
      .then((menu) => {
        if (attemptRef.current !== attempt) return;
        setCategories(menu.categories);
        setItems(menu.items);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (attemptRef.current !== attempt) return;
        setError(
          reason instanceof Error ? reason.message : "Не удалось загрузить меню",
        );
        setStatus("error");
      });
  }, [venueId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo<MenuValue>(() => {
    // Поиск по позиции идёт на каждую строку каждого чека и каждого тикета
    // кухни; перебором массива это квадрат на составе заказа.
    const byId = new Map(items.map((item) => [item.id, item]));

    return {
      categories,
      items,
      status,
      error,
      reload,
      findMenuItem: (id) => byId.get(id),
      itemsOfCategory: (categoryId) =>
        items.filter((item) => item.categoryId === categoryId),
    };
  }, [categories, items, status, error, reload]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu(): MenuValue {
  const value = useContext(MenuContext);
  if (!value) {
    throw new Error("useMenu вызван вне MenuProvider");
  }
  return value;
}
