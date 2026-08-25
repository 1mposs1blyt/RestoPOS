import { useEffect, useMemo, useState } from "react";
import type { OrderItem, UUID } from "@restopos/shared-types";
import { OrderItemStatusBadge, OrderStatusBadge, cn } from "@restopos/ui-kit";
import { useAccess } from "../app/access";
import { useNavigation } from "../app/navigation";
import { useSession } from "../app/session";
import { useOrders } from "../state/orders";
import { usePrinting } from "../state/printing";
import { useStopList } from "../state/stoplist";
import { useTables } from "../state/tables";
import { useMenu } from "../state/menu";
import { MenuNotice } from "./menunotice";
import { formatMoney } from "../lib/money";
import { lineTotal, unitPrice } from "../lib/order-price";
import { FunctionBar, FunctionKey } from "../components/functionbar";
import { SplitDialog } from "../components/splitdialog";

/**
 * Экран заказа: чек слева, меню справа.
 *
 * Позиция редактируется, пока не ушла на кухню (`status === "new"`). После
 * отправки её нельзя удалить из чека — это инвариант №6, append-only
 * на уровне `order_items`: потерянная позиция означает несъеденное блюдо
 * либо неоплаченное. Отменить её можно только сторно, и это уже действие
 * с подтверждением.
 *
 * Разграничение здесь двух видов. Право, которого нет и не может быть,
 * просто гасит кнопку. Право, которое можно подтвердить (`order.item.void`,
 * `order.foreign`), ведёт в диалог подтверждения — см. `app/access.tsx`.
 */
export function OrderScreen({ tableId }: { tableId: UUID }) {
  const { back, navigate } = useNavigation();
  const { findTable } = useTables();
  const { staff } = useSession();
  const { can, authorize } = useAccess();
  const {
    orderOfTable,
    openOrder,
    itemsOfOrder,
    orderTotal,
    hasPendingItems,
    addItem,
    setQuantity,
    removeItem,
    voidItem,
    setItemStatus,
    splitItem,
    setGuestCount,
  } = useOrders();
  // Отправка и печать марок — одна операция: разъехавшись, они дают повару
  // на бумаге не то, что у него на экране.
  const { fireOrder } = usePrinting();
  const { isStopped, entryOf } = useStopList();
  const {
    categories,
    itemsOfCategory,
    status: menuStatus,
  } = useMenu();

  const table = findTable(tableId);
  const order = orderOfTable(tableId);

  useEffect(() => {
    if (!order) openOrder(tableId);
  }, [order, tableId, openOrder]);

  /*
   * Категория выбирается лениво: меню приезжает с узла, и на первом рендере
   * его ещё нет. `null` — «ни одна не выбрана», а не «первая»; какая первая,
   * станет известно, когда меню доедет.
   */
  const [pickedCategoryId, setPickedCategoryId] = useState<UUID | null>(null);
  /*
   * Выбранная категория может исчезнуть: меню перечитывают по кнопке, и там
   * его правит менеджер. Ссылка на пропавшую категорию — это пустая сетка
   * блюд с подсветкой на кнопке, которой в списке уже нет.
   */
  const activeCategoryId =
    categories.find((category) => category.id === pickedCategoryId)?.id ??
    categories[0]?.id ??
    null;
  /** Доступ к чужому заказу, подтверждённый на этот заход. */
  const [isForeignApproved, setForeignApproved] = useState(false);
  /** Позиция, которую делят прямо сейчас. */
  const [splittingId, setSplittingId] = useState<UUID | null>(null);

  // Подтверждение действует на один заказ, а не на терминал: перешли к другому
  // столу — спрашиваем заново.
  // biome-ignore lint/correctness/useExhaustiveDependencies: tableId не читается в теле, он триггер сброса — правило такой приём не различает
  useEffect(() => {
    setForeignApproved(false);
  }, [tableId]);

  const categoryItems = useMemo(
    () => (activeCategoryId ? itemsOfCategory(activeCategoryId) : []),
    [activeCategoryId, itemsOfCategory],
  );

  // Один кадр между монтированием и созданием заказа в эффекте.
  if (!order) return null;

  const items = itemsOfOrder(order.id);
  const total = orderTotal(order.id);
  const canSend = hasPendingItems(order.id) && can("order.send");
  const canEditItems = can("order.item.add");
  const canPay = can("payment.accept");
  const canServe = can("order.item.serve");

  const subject = `Заказ № ${order.number}, стол ${table?.label ?? "—"}`;

  /*
   * Чужой заказ. Официант отвечает за свои столы: `orders.waiter_id` — это
   * чья выручка и чьи чаевые, и подойти к чужому чеку он может только
   * с ведома того, у кого право есть (у кассира и менеджера оно своё).
   */
  const isForeign = Boolean(staff && order.waiterId !== staff.id);
  const needsForeignApproval =
    isForeign && !can("order.foreign") && !isForeignApproved;

  if (needsForeignApproval) {
    return (
      <ForeignOrderGuard
        subject={subject}
        onRequest={() => {
          authorize("order.foreign", subject).then(
            () => setForeignApproved(true),
            // Отказались подтверждать — возвращаем в зал, а не оставляем
            // стоять перед закрытой дверью.
            () => back(),
          );
        }}
        onBack={back}
      />
    );
  }

  /*
   * Оплата уехала на отдельный экран: способов больше двух, они смешиваются
   * в одном чеке, и там же считается сдача. Двумя кнопками «Наличные»
   * и «Картой» это не выражается — гость, платящий тысячей за чек на 700,
   * должен увидеть сдачу, а не молча закрытый счёт.
   */
  const goToPayment = () => {
    navigate({ name: "payment", orderId: order.id });
  };

  const handleVoid = (itemId: UUID) => {
    // Промис отклоняется, если подтверждение отменили, — это штатный путь,
    // и делать в этом случае нечего.
    authorize("order.item.void", subject).then(
      () => voidItem(itemId),
      () => undefined,
    );
  };

  return (
    /*
     * Раскладка iikoFront: чек слева, сетка блюд по центру, категории колонкой
     * справа, функции полосой внизу.
     *
     * Без внешних отступов и скруглений намеренно. На моноблоке 1024x768 рамка
     * в 16px по кругу — это 3% площади, отданные ни за что, а закруглённые углы
     * панелей режут те самые пиксели, куда целится палец. Разделяем панели
     * границами в один пиксель, а не воздухом.
     */
    <div className="flex h-full w-full select-none overflow-hidden bg-slate-950">
      {/* Чек стола */}
      {/* На 1024 фиксированные 384px съедали больше трети экрана. */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 xl:w-96">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-3">
          <div>
            <h3 className="text-lg font-black text-emerald-400">
              Стол {table?.label ?? "—"}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <OrderStatusBadge status={order.status} />
              {/* Число гостей нужно и для деления счёта, и для отчётов:
                  средний чек на гостя — не то же, что средний на заказ. */}
              <GuestCounter
                value={order.guestCount ?? 1}
                onChange={(next) => setGuestCount(order.id, next)}
              />
            </div>
          </div>
          {/* «В зал» переехало в панель функций внизу: две кнопки с одним
              действием на одном экране — это две мишени вместо одной
              и лишний повод промахнуться. */}
          <span className="text-2xl font-black tabular-nums text-slate-600">
            №{order.number}
          </span>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-600">
              <span className="mb-2 text-3xl">📝</span>
              <p className="text-xs">Заказ пуст. Выберите блюда.</p>
            </div>
          ) : (
            items.map((item) => (
              <CheckLine
                key={item.id}
                item={item}
                canEdit={canEditItems}
                canServe={canServe}
                canSplit={can("order.item.split")}
                onQuantity={setQuantity}
                onRemove={removeItem}
                onVoid={handleVoid}
                onServe={(itemId) => setItemStatus(itemId, "served")}
                onSplit={setSplittingId}
              />
            ))
          )}
        </div>

        {/* Итог в чеке, действия — внизу экрана: так в iikoFront, и так
            правильнее. Сумма нужна глазу постоянно, а кнопка «К оплате»
            нажимается один раз за заказ, и держать её в узкой колонке
            значит отдавать под неё место, которое нужнее строкам чека. */}
        <div className="flex items-baseline justify-between border-t-2 border-slate-800 bg-slate-900 px-3 py-3">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Итого
          </span>
          <span className="text-3xl font-black tabular-nums text-emerald-400">
            {formatMoney(total)}
          </span>
        </div>
      </div>

      {/* Меню, категории и панель функций */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          {menuStatus === "ready" ? null : (
            <div className="p-3">
              <MenuNotice />
            </div>
          )}

          {/* Колонки считаем от ширины самой сетки, а не от вьюпорта: ширина
              здесь зависит ещё и от панели чека, и брейкпоинты по экрану давали
              на 1024 карточки по ~145px — под названия блюд в две строки мало.

              Плитки плотнее и площе, чем были: в запару важно, сколько блюд
              видно без прокрутки, а не насколько мягкие у карточки углы.
              Цену держим крупной — по ней кассир сверяется вслух с гостем. */}
          <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(160px,1fr))] content-start gap-2 overflow-y-auto p-3">
            {categoryItems.map((menuItem) => (
              <button
                key={menuItem.id}
                type="button"
                // Стоп-лист терминала важнее флага в меню: он живой, его правит
                // повар в течение смены, а `isStopListed` из меню — снимок.
                disabled={isStopped(menuItem.id) || !canEditItems}
                onClick={() => addItem(order.id, menuItem.id)}
                className={cn(
                  "flex h-24 flex-col justify-between rounded border-b-4 p-2 text-left transition",
                  isStopped(menuItem.id)
                    ? "cursor-not-allowed border-slate-800 bg-slate-900/60 opacity-50"
                    : "border-orange-500/70 bg-slate-800 active:scale-95 hover:bg-slate-700",
                )}
              >
                <span className="line-clamp-3 text-sm font-bold leading-tight text-slate-100">
                  {menuItem.name}
                </span>
                {isStopped(menuItem.id) ? (
                  <span className="text-xs font-bold uppercase text-rose-400">
                    Стоп-лист
                  </span>
                ) : (
                  <span className="flex items-baseline justify-between gap-1">
                    <span className="text-base font-black tabular-nums text-orange-400">
                      {formatMoney(menuItem.price)}
                    </span>
                    {/* Положительный остаток — предупреждение, а не запрет:
                        блюдо ещё можно продать, и кнопку гасить рано. */}
                    {entryOf(menuItem.id) && (
                      <span className="text-xs font-bold text-amber-400">
                        ост. {entryOf(menuItem.id)?.remainder}
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Полоса функций внизу — общий компонент, см. components/functionbar. */}
          <FunctionBar>
            <FunctionKey label="← В зал" onClick={back} />
            <FunctionKey
              label={canSend ? "Отправить на кухню" : "Всё отправлено"}
              tone="accept"
              disabled={!canSend}
              onClick={() => fireOrder(order.id)}
            />
            <FunctionKey
              label={canPay ? "К оплате" : "Оплату принимает кассир"}
              tone="pay"
              disabled={items.length === 0 || !canPay}
              onClick={goToPayment}
            />
          </FunctionBar>
        </div>

        {/* Категории колонкой справа. Строкой сверху они переносились на две
            и съедали высоту сетки блюд; колонка держит их на одном месте
            независимо от числа и длины названий. */}
        <div className="flex w-36 shrink-0 flex-col gap-px overflow-y-auto border-l border-slate-800 bg-slate-800 xl:w-44">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setPickedCategoryId(category.id)}
              className={cn(
                "min-h-14 shrink-0 px-3 py-2 text-left text-sm font-bold uppercase leading-tight tracking-wide transition",
                activeCategoryId === category.id
                  ? "bg-orange-500 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {splittingId !== null && (
        <SplitDialog
          quantity={items.find((item) => item.id === splittingId)?.quantity ?? 1}
          guestCount={order.guestCount ?? 1}
          onCancel={() => setSplittingId(null)}
          onConfirm={(parts, guestNumbers) => {
            splitItem(splittingId, parts, guestNumbers);
            setSplittingId(null);
          }}
        />
      )}
    </div>
  );
}

/** Сколько гостей за столом. Меньше одного не бывает: стол занят. */
function GuestCounter({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-800 px-1">
      <button
        type="button"
        aria-label="Меньше гостей"
        onClick={() => onChange(Math.max(1, value - 1))}
        // Ширина тоже 44, а не только высота: цель касания меряется по обеим
        // сторонам, и кнопка 32px шириной промахивается пальцем ровно так же,
        // как низкая. Замер на 1024x768 её и поймал.
        className="min-h-11 w-11 text-lg text-slate-400 transition active:bg-slate-700"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums text-slate-200">
        {value}
      </span>
      <button
        type="button"
        aria-label="Больше гостей"
        onClick={() => onChange(value + 1)}
        // Ширина тоже 44, а не только высота: цель касания меряется по обеим
        // сторонам, и кнопка 32px шириной промахивается пальцем ровно так же,
        // как низкая. Замер на 1024x768 её и поймал.
        className="min-h-11 w-11 text-lg text-slate-400 transition active:bg-slate-700"
      >
        +
      </button>
    </div>
  );
}

/**
 * Заслонка перед чужим заказом.
 *
 * Показываем сам факт и предлагаем подтвердить, а не прячем стол из зала:
 * официанту нужно видеть, что стол занят коллегой, иначе он будет считать
 * его свободным и сажать туда гостей.
 */
function ForeignOrderGuard({
  subject,
  onRequest,
  onBack,
}: {
  subject: string;
  onRequest: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center">
        <span className="text-4xl">🔑</span>
        <h2 className="text-lg font-bold text-slate-200">
          Заказ другого сотрудника
        </h2>
        <p className="text-sm text-slate-500">
          {subject}. Чтобы открыть его, нужно подтверждение кассира или
          менеджера.
        </p>
        <button
          type="button"
          onClick={onRequest}
          className="min-h-14 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-sm font-bold text-white transition hover:from-amber-500 hover:to-orange-500 active:scale-95"
        >
          Запросить подтверждение
        </button>
        <button
          type="button"
          onClick={onBack}
          className="min-h-14 w-full rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-slate-300 transition hover:bg-slate-700 active:scale-95"
        >
          ← В зал
        </button>
      </div>
    </div>
  );
}

function CheckLine({
  item,
  canEdit,
  canServe,
  canSplit,
  onQuantity,
  onRemove,
  onVoid,
  onServe,
  onSplit,
}: {
  item: OrderItem;
  canEdit: boolean;
  canServe: boolean;
  canSplit: boolean;
  onQuantity: (itemId: UUID, quantity: number) => void;
  onRemove: (itemId: UUID) => void;
  onVoid: (itemId: UUID) => void;
  onServe: (itemId: UUID) => void;
  onSplit: (itemId: UUID) => void;
}) {
  const { findMenuItem } = useMenu();
  const menuItem = findMenuItem(item.menuItemId);
  const isEditable = item.status === "new" && canEdit;
  const isVoided = item.status === "voided";
  const isSplit = item.status === "split";
  /*
   * Делят еду, а не заказ: только готовое и поданное. До готовности количество
   * правят обычным способом — иначе на станцию уедет «полборща», и повар
   * не поймёт, что готовить (правило продублировано в редьюсере, здесь оно
   * только гасит кнопку).
   */
  const showSplit =
    canSplit && (item.status === "ready" || item.status === "served");
  // Сторнировать можно то, что уже уехало на кухню и ещё не отдано гостю.
  const canVoid = item.status === "cooking" || item.status === "ready";
  /*
   * «Отдано» отмечает официант, а не кухня. Без этой кнопки станция без
   * экрана (тариф без KDS, только принтер) не закрывается ничем: позиции
   * приезжают сразу готовыми, и двигать их дальше некому.
   */
  const showServe = item.status === "ready" && canServe;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800/60 bg-slate-900 p-3",
        (isVoided || isSplit) && "opacity-50",
        // Доля — часть другой позиции, а не самостоятельная строка:
        // сдвигаем её, иначе чек читается как удвоенный заказ.
        item.splitOf && "ml-4 border-l-2 border-l-orange-500/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium",
              isVoided && "line-through",
            )}
          >
            {menuItem?.name ?? "Позиция удалена из меню"}
          </p>
          <p className="text-xs tabular-nums text-slate-500">
            {formatMoney(unitPrice(item, findMenuItem))}
            {item.guestNumber != null && (
              <span className="ml-2 text-orange-400/80">
                гость {item.guestNumber}
              </span>
            )}
          </p>
        </div>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            (isVoided || isSplit) && "line-through",
          )}
        >
          {formatMoney(lineTotal(item, findMenuItem))}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {isEditable ? (
          <div className="flex items-center gap-2">
            <QuantityButton
              onClick={() => onQuantity(item.id, item.quantity - 1)}
              label="Уменьшить количество"
            >
              −
            </QuantityButton>
            <span className="min-w-6 text-center text-sm font-bold tabular-nums text-orange-400">
              {item.quantity}
            </span>
            <QuantityButton
              onClick={() => onQuantity(item.id, item.quantity + 1)}
              label="Увеличить количество"
            >
              +
            </QuantityButton>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="ml-1 inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
            >
              Удалить
            </button>
          </div>
        ) : (
          // Отправленную позицию из чека не убрать — только сторнировать,
          // и это действие с подтверждением.
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tabular-nums text-slate-400">
              × {item.quantity}
            </span>
            {showServe && (
              <button
                type="button"
                onClick={() => onServe(item.id)}
                className="inline-flex min-h-11 items-center rounded-lg bg-emerald-600/20 px-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-600/30 active:scale-95"
              >
                Отдано
              </button>
            )}
            {canVoid && (
              <button
                type="button"
                onClick={() => onVoid(item.id)}
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
              >
                Сторно
              </button>
            )}
            {showSplit && (
              <button
                type="button"
                onClick={() => onSplit(item.id)}
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-500 transition hover:bg-orange-500/10 hover:text-orange-300"
              >
                Разделить
              </button>
            )}
          </div>
        )}

        {!isEditable && <OrderItemStatusBadge status={item.status} />}
      </div>
    </div>
  );
}

function QuantityButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-11 w-11 rounded-lg bg-slate-800 text-lg font-bold text-slate-300 transition hover:bg-slate-700 active:scale-90"
    >
      {children}
    </button>
  );
}
