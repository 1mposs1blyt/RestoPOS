import type {
  FeatureCode,
  MenuCategory,
  MenuItem,
  Modifier,
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
  TableLayout,
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

export interface MenuSnapshot {
  categories: MenuCategory[];
  items: MenuItem[];
  modifiers: Modifier[];
}

export interface StationsSnapshot {
  stations: PrepStation[];
  outputs: StationOutput[];
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

  menu(): Promise<MenuSnapshot> {
    return this.http.get<MenuSnapshot>("/menu");
  }

  stations(): Promise<StationsSnapshot> {
    return this.http.get<StationsSnapshot>("/stations");
  }

  tables(): Promise<TableLayout[]> {
    return this.http.get<TableLayout[]>("/tables");
  }

  /** Расстановка сохраняется целиком: это один документ, а не набор строк. */
  saveTables(tables: TableLayout[]): Promise<TableLayout[]> {
    return this.http.put<TableLayout[]>("/tables", tables);
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
