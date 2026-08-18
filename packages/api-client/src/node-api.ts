import type {
  FeatureCode,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  OrderItemStatus,
  Payment,
  Permission,
  PlanCode,
  PrepStation,
  PrintJob,
  Shift,
  Staff,
  StationOutput,
  Terminal,
  UUID,
  Venue,
} from "@restopos/shared-types";
import type { ApiClient } from "./api-client";

/**
 * Поверхность API узла заведения — ровно контракт из `docs/plan.md` §4.
 *
 * Терминал ходит **только в узел**; в облако он не ходит никогда. Поэтому
 * здесь нет ни синхронизации, ни биллинга: это забота узла, а не кассы.
 *
 * Формы ответов подобраны под то, что уже отрисовывают экраны кассы, — так что
 * это не «какой-нибудь REST», а описание того, что фронту действительно нужно.
 */

// ── Сессия ──────────────────────────────────────────────────────────────────

export interface Entitlements {
  planCode: PlanCode;
  features: FeatureCode[];
}

/**
 * Всё, что терминалу нужно знать после входа. Одним ответом, а не пятью
 * запросами: на старте смены касса должна ожить сразу, а не собирать себя
 * по частям.
 */
export interface SessionInfo {
  /** Токен смены. Дальше уходит в заголовок каждого запроса. */
  token: string;
  staff: Staff;
  /**
   * Права **отдаёт сервер**, клиент их не вычисляет. Матрица общая
   * (`contracts/contract.json`), но решение всегда за узлом: когда права станут
   * настраиваемыми на организацию, клиент менять не придётся.
   */
  permissions: Permission[];
  venue: Venue;
  terminal: Terminal;
  entitlements: Entitlements;
  /** `null` — смена ещё не открыта. */
  shift: Shift | null;
}

export interface OverrideGrant {
  /** Одноразовый, живёт ~60 секунд, привязан к паре «право + сущность». */
  overrideToken: string;
  approvedBy: Staff;
  expiresInSeconds: number;
}

// ── Справочники ─────────────────────────────────────────────────────────────

/**
 * Меню так, как его отдаёт узел (`MenuSnapshotDto`).
 *
 * Модификаторов здесь нет, хотя контракт из `docs/plan.md` §4.2 их обещает:
 * `MenuRepository` читает только категории и позиции, таблицы модификаторов
 * запрос не трогает вовсе. Поле, которое всегда приезжает `undefined`, хуже
 * отсутствующего — по нему пишут экран, а он молча ничего не показывает.
 * Появятся модификаторы на узле — вернётся и поле.
 *
 * `isStopListed` узел считает сам, из `stop_list` с остатком ≤ 0. Локальный
 * стоп-лист (`state/stoplist.tsx`) при этом остаётся: он умеет положительный
 * остаток («осталось три порции»), которого этим флагом не выразить.
 */
export interface MenuSnapshot {
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface StationsSnapshot {
  stations: PrepStation[];
  outputs: StationOutput[];
}

/**
 * Стол так, как его отдаёт узел (`TableDto`).
 *
 * Отдельный тип, а не `TableLayout`: у узла форма стола ограничена схемой БД
 * (`rect`/`circle`), и приводить одно к другому должен вызывающий, явно.
 * Молчаливое приведение здесь означало бы, что круглый стол однажды
 * приедет прямоугольным и никто не поймёт, где это случилось.
 */
export interface NodeTable {
  id: UUID;
  venueId: UUID;
  label: string;
  /** `tables.seats` — число мест, к геометрии отношения не имеет. */
  capacity: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
  shape: "rect" | "circle";
}

/** Сводка активного заказа (`ActiveOrderSummaryDto`) — для занятости столов. */
export interface NodeOrderSummary {
  id: UUID;
  tableId: UUID;
  guestCount: number;
  /** Узел пока отдаёт `0.00` константой: сумма по позициям не считается. */
  totalAmount: number;
  status: string;
  createdAt: string;
}

// ── Смена и заказы ──────────────────────────────────────────────────────────

export interface OpenShiftResult {
  shift: Shift;
  /**
   * Блок номеров заказов, выданный этому терминалу.
   *
   * Номер называют гостю на прилавке — он нужен немедленно и не может ждать
   * синхронизации, а два терминала не должны выдать один и тот же. Блок выдан
   * заранее, поэтому нумерация продолжается и в офлайне, а пересечься
   * не может по построению.
   */
  numberBlock: { from: number; to: number };
}

/** Заказ со всем, что к нему относится: экрану нужно всё сразу. */
export interface OrderSnapshot {
  order: Order;
  items: OrderItem[];
  /** Строк оплаты бывает несколько: часть картой, часть наличными, плюс возвраты. */
  payments: Payment[];
}

export interface CreateOrderRequest {
  /** Идемпотентность: повтор с тем же значением вернёт уже созданный заказ. */
  clientId: UUID;
  /** `null` — заказ без стола: прилавок или навынос. */
  tableId: UUID | null;
}

export interface AddItemRequest {
  clientId: UUID;
  menuItemId: UUID;
  quantity: number;
  modifierIds?: UUID[];
}

/**
 * Одна строка оплаты в запросе на закрытие чека.
 *
 * Эквайринговые поля живут на строке, а не на запросе: карт в одном чеке может
 * быть две (гости платят раздельно), и у каждой свой код авторизации.
 */
export interface PaymentLineRequest {
  paymentTypeId: UUID;
  amount: string;
  /** Сколько дал гость. Нужно для сдачи и сверки кассы. Только для наличных. */
  tendered?: string;
  /** Результат эквайринга — заполняется терминалом после ответа банка. */
  authCode?: string;
  rrn?: string;
}

export interface PayRequest {
  clientId: UUID;
  /** Чек закрывается набором строк целиком: «оплачен наполовину» не бывает. */
  payments: PaymentLineRequest[];
}

/**
 * Клиент API узла.
 *
 * Тонкая обёртка над транспортом: ни кэша, ни состояния. События приходят
 * без полезной нагрузки, и слой выше сам решает, что перезапросить —
 * источник истины всегда БД узла (инвариант №3).
 */
export class NodeApi {
  constructor(private readonly http: ApiClient) {}

  // ── Сессия и доступ ───────────────────────────────────────────────────────

  /**
   * Вход по PIN. Отказы различаются кодом: `invalid_pin`,
   * `staff_not_in_venue`, `no_screens_for_role` — последний означает, что роли
   * на этом терминале делать нечего, и его показывают отдельным текстом.
   */
  signIn(pin: string): Promise<SessionInfo> {
    return this.http.post<SessionInfo>("/auth/pin", { pin });
  }

  /** Восстановление сессии после перезагрузки терминала. */
  bootstrap(): Promise<SessionInfo> {
    return this.http.get<SessionInfo>("/session/bootstrap");
  }

  /**
   * Подтверждение действия чужим PIN. Подтвердить может любой сотрудник,
   * у которого право есть по роли, — не обязательно менеджер.
   */
  requestOverride(
    pin: string,
    permission: Permission,
    entityId?: UUID,
  ): Promise<OverrideGrant> {
    return this.http.post<OverrideGrant>("/auth/override", {
      pin,
      permission,
      entityId: entityId ?? null,
    });
  }

  // ── Справочники ───────────────────────────────────────────────────────────

  /**
   * Меню заведения.
   *
   * Третье расхождение с `docs/plan.md`, и оно того же рода, что у столов:
   * план описывал `GET /menu` без параметров, а `MenuController` размечен
   * `api/v1/venues/{venueId:guid}/menu`. Заведение уезжает путём, а не
   * заголовком, потому что так его разметил узел.
   *
   * Несуществующее заведение — это `404`, а не пустое меню: касса, показавшая
   * пустой экран вместо отказа, выглядит как касса с распроданным меню.
   */
  menu(venueId: UUID): Promise<MenuSnapshot> {
    return this.http.get<MenuSnapshot>(`/api/v1/venues/${venueId}/menu`);
  }

  stations(): Promise<StationsSnapshot> {
    return this.http.get<StationsSnapshot>("/stations");
  }

  /**
   * Стол в ответе узла.
   *
   * Форма отличается от `TableLayout`, и разницу держим здесь, а не
   * подгоняем одно под другое:
   * - `shape` в БД только `rect`/`circle` — квадрата как отдельного значения
   *   нет, он выражается равными сторонами (`CHECK` в схеме);
   * - `capacity` — это `tables.seats`, геометрии не касается;
   * - `cx`/`cy` приходят как `NUMERIC`, то есть числом, а не строкой.
   */
  tables(venueId: UUID): Promise<NodeTable[]> {
    return this.http.get<NodeTable[]>(`/api/v1/venues/${venueId}/tables`);
  }

  /**
   * Сохранение положения одного стола.
   *
   * Контракт из `docs/plan.md` описывал расстановку одним документом
   * (`PUT /tables`), но узел сохраняет её построчно и меняет только геометрию:
   * создания, удаления и переименования у него пока нет вовсе. Расхождение
   * оставлено видимым намеренно — подписи «как в плане» на методе, который
   * ходит в другой маршрут, дороже, чем честное имя.
   */
  updateTableLayout(
    venueId: UUID,
    tableId: UUID,
    layout: { cx: number; cy: number; width: number; height: number },
  ): Promise<void> {
    return this.http.put<void>(
      `/api/v1/venues/${venueId}/tables/${tableId}`,
      layout,
    );
  }

  /**
   * Активные заказы заведения — сводками, а не снимками целиком: залу нужна
   * занятость стола, а не состав счёта.
   */
  venueOrders(venueId: UUID, status?: string): Promise<NodeOrderSummary[]> {
    return this.http.get<NodeOrderSummary[]>(
      `/api/v1/venues/${venueId}/orders`,
      status ? { params: { status } } : undefined,
    );
  }

  // ── Смена ─────────────────────────────────────────────────────────────────

  openShift(cashStart: string): Promise<OpenShiftResult> {
    return this.http.post<OpenShiftResult>("/shifts/open", { cashStart });
  }

  closeShift(cashEnd: string): Promise<Shift> {
    return this.http.post<Shift>("/shifts/close", { cashEnd });
  }

  // ── Заказы ────────────────────────────────────────────────────────────────

  activeOrders(): Promise<OrderSnapshot[]> {
    return this.http.get<OrderSnapshot[]>("/orders?active=true");
  }

  order(orderId: UUID): Promise<OrderSnapshot> {
    return this.http.get<OrderSnapshot>(`/orders/${orderId}`);
  }

  createOrder(request: CreateOrderRequest): Promise<OrderSnapshot> {
    return this.http.post<OrderSnapshot>("/orders", request);
  }

  addItem(orderId: UUID, request: AddItemRequest): Promise<OrderSnapshot> {
    return this.http.post<OrderSnapshot>(`/orders/${orderId}/items`, request);
  }

  /** Количество правится только до отправки на кухню. */
  setItemQuantity(itemId: UUID, quantity: number): Promise<OrderSnapshot> {
    return this.http.patch<OrderSnapshot>(`/order-items/${itemId}`, {
      quantity,
    });
  }

  setItemStatus(
    itemId: UUID,
    status: OrderItemStatus,
  ): Promise<OrderSnapshot> {
    return this.http.post<OrderSnapshot>(`/order-items/${itemId}/status`, {
      status,
    });
  }

  /**
   * Сторно отправленной позиции. Строка не удаляется (append-only, инвариант
   * №6) — она остаётся со статусом `voided`: из суммы выпадает, из чека нет.
   */
  voidItem(itemId: UUID): Promise<OrderSnapshot> {
    return this.http.post<OrderSnapshot>(`/order-items/${itemId}/void`, {});
  }

  /**
   * Отправка на кухню. Узел одной транзакцией переводит позиции и ставит марки
   * в очередь печати: заказ, ушедший без марок, — это блюдо, которое никто
   * не готовит.
   */
  fire(orderId: UUID): Promise<OrderSnapshot> {
    return this.http.post<OrderSnapshot>(`/orders/${orderId}/fire`, {});
  }

  pay(orderId: UUID, request: PayRequest): Promise<OrderSnapshot> {
    return this.http.post<OrderSnapshot>(`/orders/${orderId}/pay`, request);
  }

  cancelOrder(orderId: UUID): Promise<OrderSnapshot> {
    return this.http.post<OrderSnapshot>(`/orders/${orderId}/cancel`, {});
  }

  // ── Печать ────────────────────────────────────────────────────────────────

  printJobs(): Promise<PrintJob[]> {
    return this.http.get<PrintJob[]>("/print-jobs");
  }

  /** Копия печатается с пометкой: молчаливый дубль марки — второе блюдо. */
  reprint(jobId: UUID): Promise<PrintJob> {
    return this.http.post<PrintJob>(`/print-jobs/${jobId}/reprint`, {});
  }
}
