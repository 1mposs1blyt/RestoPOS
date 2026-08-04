import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  Delivery,
  DeliveryKind,
  DeliveryStatus,
  UUID,
} from "@restopos/shared-types";
import { canAdvance } from "@restopos/shared-types";
import { loadState, newId, saveState } from "../lib/storage";

/**
 * Доставки и самовывозы заведения.
 *
 * Доставка — надстройка над заказом: позиции и деньги живут в `orders`,
 * здесь только то, что появляется, когда еда покидает заведение — адрес,
 * курьер, срок и своя цепочка состояний.
 */

const STORAGE_KEY = "deliveries";

interface DeliveryState {
  deliveries: Record<UUID, Delivery>;
}

const EMPTY: DeliveryState = { deliveries: {} };

type Action =
  | { type: "create"; delivery: Delivery }
  | { type: "status"; id: UUID; status: DeliveryStatus }
  | { type: "courier"; id: UUID; courierId: UUID | null };

function reducer(state: DeliveryState, action: Action): DeliveryState {
  switch (action.type) {
    case "create":
      if (state.deliveries[action.delivery.id]) return state;
      return {
        deliveries: { ...state.deliveries, [action.delivery.id]: action.delivery },
      };

    case "status": {
      const delivery = state.deliveries[action.id];
      if (!delivery) return state;
      /*
       * Переход проверяем здесь, а не в экране: таблица переходов — свойство
       * домена, и одинаковой она обязана быть в кассе, на кухне и на узле.
       * Экран может только не показать кнопку; запретить должен редьюсер.
       */
      if (!canAdvance(delivery, action.status)) return state;
      return {
        deliveries: {
          ...state.deliveries,
          [delivery.id]: { ...delivery, status: action.status },
        },
      };
    }

    case "courier": {
      const delivery = state.deliveries[action.id];
      if (!delivery) return state;
      // Курьера самовывозу не назначают: его никто не везёт.
      if (delivery.kind === "pickup") return state;
      return {
        deliveries: {
          ...state.deliveries,
          [delivery.id]: { ...delivery, courierId: action.courierId },
        },
      };
    }

    default:
      return state;
  }
}

interface DeliveryValue {
  deliveries: Delivery[];
  countByStatus: (status: DeliveryStatus) => number;
  create: (input: {
    orderId: UUID;
    kind: DeliveryKind;
    address: string | null;
    customerName: string;
    phone: string;
    comment: string;
    dueAt: string;
    externalNumber?: string | null;
  }) => void;
  setStatus: (id: UUID, status: DeliveryStatus) => void;
  setCourier: (id: UUID, courierId: UUID | null) => void;
}

const DeliveryContext = createContext<DeliveryValue | null>(null);

export function DeliveryProvider({
  venueId,
  children,
}: {
  venueId: UUID;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    loadState<DeliveryState>(STORAGE_KEY, EMPTY),
  );

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  const deliveries = useMemo(
    () =>
      Object.values(state.deliveries).sort((a, b) =>
        a.dueAt.localeCompare(b.dueAt),
      ),
    [state.deliveries],
  );

  const create = useCallback<DeliveryValue["create"]>(
    (input) => {
      dispatch({
        type: "create",
        delivery: {
          id: newId(),
          venueId,
          orderId: input.orderId,
          kind: input.kind,
          /*
           * Созданная на кассе доставка сразу `new`: её принял человек,
           * который её и завёл. `unconfirmed` — про заказы из внешних
           * источников, где подтверждать ещё некому.
           */
          status: "new",
          address: input.kind === "pickup" ? null : input.address,
          courierId: null,
          customerName: input.customerName,
          phone: input.phone,
          comment: input.comment,
          dueAt: input.dueAt,
          externalNumber: input.externalNumber ?? null,
          createdAt: new Date().toISOString(),
          clientId: newId(),
        },
      });
    },
    [venueId],
  );

  const value = useMemo<DeliveryValue>(
    () => ({
      deliveries,
      countByStatus: (status) =>
        deliveries.filter((delivery) => delivery.status === status).length,
      create,
      setStatus: (id, status) => dispatch({ type: "status", id, status }),
      setCourier: (id, courierId) => dispatch({ type: "courier", id, courierId }),
    }),
    [deliveries, create],
  );

  return (
    <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>
  );
}

export function useDelivery(): DeliveryValue {
  const value = useContext(DeliveryContext);
  if (!value) {
    throw new Error("useDelivery вызван вне DeliveryProvider");
  }
  return value;
}
