import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Money, OrderItem, UUID } from "@restopos/shared-types";
import { useSession } from "../app/session";
import { findPaymentType } from "../data/payment-types";
import { newId } from "../lib/storage";
import { toMinor } from "../lib/money";
import { buildReceiptLines, type ReceiptLineSource } from "../lib/receipt-lines";
import {
  acquiringPay,
  acquiringRefund,
  acquiringReversal,
  describeTerminalError,
} from "../lib/acquiring";
import { refundablePayments } from "../lib/refund";
import {
  describeFiscalError,
  fiscalRegister,
  type FiscalReceipt,
  type FiscalReceiptItem,
  type FiscalReceiptPayment,
  type VatRate,
} from "../lib/fiscal";
import { useMenu, type MenuItemLookup } from "./menu";
import { useDevices } from "./devices";
import { useOrders, type PaymentDraft } from "./orders";
import { useShifts } from "./shifts";

/**
 * Расчёт гостя: порядок операций в одном месте.
 *
 * **Порядок нерушим: эквайринг → фискальный чек → заказ оплачен.**
 *
 * - чек до эквайринга — это фискальный документ на платёж, которого может
 *   не случиться: гость уйдёт с чеком, денег не будет, и расхождение вылезет
 *   при сверке итогов дня;
 * - заказ оплачен до чека — это закрытый счёт без фискального документа:
 *   с точки зрения налоговой продажи не было.
 *
 * Живёт в сторе, а не в экране оплаты, потому что тот же порядок нужен
 * прилавку (`counterscreen`), где платят вперёд. Продублированная в двух
 * экранах последовательность разъедется на первой правке, а расхождение
 * здесь — это чек, не совпавший с деньгами.
 *
 * # Компенсация
 *
 * Всё, что успели списать, обязано быть возвращено, если чек не состоялся.
 * Две карты в одном чеке — обычное дело, и отказ второй не должен оставлять
 * первую списанной. Единственное исключение — неизвестный исход регистрации
 * чека: там отменять нельзя, потому что чек мог записаться, и отмена оставила
 * бы фискальный документ без денег. Такое разбирает человек.
 */

/**
 * Что именно идёт: продажа или возврат.
 *
 * Порядок операций у них один, а тексты на экране — противоположные:
 * «приложите карту» против «приложите карту для возврата», «деньги гостя
 * на месте» против «деньги гостю не отданы». Кассир по ним и понимает,
 * в какую сторону не прошли деньги.
 */
export type CheckoutOperation = "sale" | "refund";

/** Что показывать на экране прямо сейчас. */
export type CheckoutStage =
  | { stage: "idle" }
  /** Гость прикладывает карту. `line` из `of` — если карт несколько. */
  | { stage: "acquiring"; operation: CheckoutOperation; line: number; of: number }
  | { stage: "fiscal"; operation: CheckoutOperation }
  /** Готово. `receipt` = `null` — нефискальный режим. */
  | { stage: "done"; operation: CheckoutOperation; receipt: FiscalReceipt | null }
  /**
   * Не получилось, и деньги на месте: банк отказал либо всё списанное
   * возвращено. Заказ остался как был, можно пробовать снова.
   */
  | { stage: "failed"; operation: CheckoutOperation; reason: string }
  /**
   * **Требует человека.** Исход неизвестен: деньги могли уйти, чек мог
   * записаться. Ни повторять, ни закрывать заказ нельзя.
   */
  | { stage: "needsAttention"; reason: string; hint: string; clientId: string };

interface CheckoutValue {
  status: CheckoutStage;
  /** Идёт ли расчёт: экран обязан заблокировать повторное нажатие. */
  isBusy: boolean;
  /**
   * Провести расчёт. Промис резолвится всегда — исход смотреть в `status`,
   * а не в исключении: «требует человека» не ошибка вызова, а состояние кассы.
   */
  pay: (orderId: UUID, drafts: PaymentDraft[]) => Promise<CheckoutStage>;
  /**
   * Возврат по чеку целиком: деньги гостю, чек возврата прихода на ККТ,
   * встречные строки в заказе. Частичного возврата здесь нет намеренно —
   * причина в комментарии к реализации.
   */
  refund: (orderId: UUID) => Promise<CheckoutStage>;
  /** Убрать сообщение и вернуть экран в рабочее состояние. */
  reset: () => void;
  /**
   * Работает ли касса без фискализации. Истина, когда ККМ не заведена вовсе:
   * браузерная отладка и терминал без ФР.
   */
  isNonFiscal: boolean;
}

const CheckoutContext = createContext<CheckoutValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { staff } = useSession();
  const { kkm } = useDevices();
  const { findMenuItem } = useMenu();
  const { cashShift } = useShifts();
  const {
    state,
    itemsOfOrder,
    orderTotals,
    payOrder,
    paymentsOfOrder,
    refundPayments,
  } = useOrders();

  const [status, setStatus] = useState<CheckoutStage>({ stage: "idle" });

  /*
   * Защита от второго нажатия. Именно ref, а не состояние: два касания
   * по сенсорному экрану приходят в одном кадре и оба видят `isBusy === false`,
   * если читать его из состояния. Второй расчёт — это второе списание.
   */
  const busyRef = useRef(false);

  const isNonFiscal = kkm === undefined;

  const pay = useCallback(
    async (orderId: UUID, drafts: PaymentDraft[]): Promise<CheckoutStage> => {
      const finish = (next: CheckoutStage): CheckoutStage => {
        setStatus(next);
        busyRef.current = false;
        return next;
      };

      // Второе касание по «Оплатить» приходит в том же кадре и не должно
      // начать второй расчёт. Молча: сообщение здесь только запутает.
      if (busyRef.current) return { stage: "idle" };

      const order = state.orders[orderId];
      if (!order) {
        return finish({
          stage: "failed",
          operation: "sale",
          reason: "Заказ не найден",
        });
      }

      /*
       * ККМ заведена, но остановлена: порт отпущен сервисным экраном ради
       * утилиты производителя (`state/devices.tsx`). Это не поломка, а режим
       * обслуживания, и говорить о нём надо прямо — иначе кассир будет
       * жать «Оплатить» и получать невнятный отказ драйвера.
       */
      if (kkm && !kkm.isRunning) {
        return finish({
          stage: "failed",
          operation: "sale",
          reason: stoppedKkmReason(kkm.name),
        });
      }

      /*
       * Без открытой кассовой смены запись платежа не состоится
       * (`orders.tsx::payOrder` выходит молча), а деньги к тому моменту уже
       * списаны и чек пробит. Экран оплаты сюда не доводит, но проверка обязана
       * стоять до первой операции с железом, а не после неё.
       */
      if (!cashShift) {
        return finish({
          stage: "failed",
          operation: "sale",
          reason: NO_CASH_SHIFT,
        });
      }

      busyRef.current = true;

      // Один идентификатор на весь расчёт: по нему и терминал, и ККТ узнают
      // свою операцию после обрыва.
      const clientId = newId();
      const approved: string[] = [];

      /** Вернуть всё, что успели списать, и показать причину. */
      const rollback = async (reason: string): Promise<CheckoutStage> => {
        for (const id of approved) {
          try {
            await acquiringReversal(id);
          } catch {
            // Отменить не вышло — дальше решает человек: деньги списаны,
            // а чека нет. Текст ошибки терминала здесь ничего не добавляет:
            // важно не почему не вышло, а что делать кассиру.
            return finish({
              stage: "needsAttention",
              reason,
              hint:
                "Списание по карте отменить не удалось. Сверьте операции " +
                "на терминале и при необходимости сделайте возврат.",
              clientId: id,
            });
          }
        }
        return finish({ stage: "failed", operation: "sale", reason });
      };

      try {
        // ── 1. Эквайринг ──────────────────────────────────────────────────
        const cardDrafts = drafts.filter(
          (draft) => findPaymentType(draft.paymentTypeId)?.kind === "card",
        );
        const settled: PaymentDraft[] = [...drafts];

        for (const [index, draft] of cardDrafts.entries()) {
          setStatus({
            stage: "acquiring",
            operation: "sale",
            line: index + 1,
            of: cardDrafts.length,
          });

          // Свой идентификатор на каждую карту: у двух операций в банке
          // не может быть одного номера.
          const lineId = `${clientId}-${index + 1}`;
          const outcome = await acquiringPay({
            amount: toMinor(draft.amount),
            clientId: lineId,
            orderNumber: order.number,
          });

          if (outcome.outcome === "declined") {
            return await rollback(outcome.reason);
          }

          if (outcome.outcome === "needs_attention") {
            return finish({
              stage: "needsAttention",
              reason: describeTerminalError(outcome.error),
              hint:
                "Проверьте на терминале, прошла ли операция, прежде чем " +
                "повторять оплату. Заказ не закрыт.",
              clientId: lineId,
            });
          }

          approved.push(lineId);
          const position = settled.indexOf(draft);
          settled[position] = {
            ...draft,
            authCode: outcome.authorization.authCode,
            rrn: outcome.authorization.rrn,
          };
        }

        // ── 2. Фискальный чек ─────────────────────────────────────────────
        let receipt: FiscalReceipt | null = null;

        if (!isNonFiscal) {
          setStatus({ stage: "fiscal", operation: "sale" });

          const outcome = await fiscalRegister({
            kind: "sale",
            items: receiptItems(
              itemsOfOrder(orderId),
              orderTotals(orderId).total,
              kkm?.defaultVat ?? "vat20",
              findMenuItem,
            ),
            payments: fiscalPayments(settled),
            taxSystem: kkm?.taxSystem ?? "usn_income",
            cashierName: staff?.fullName ?? "—",
            orderNumber: order.number,
            clientId,
          });

          if (outcome.outcome === "failed") {
            // Чека нет — значит и денег быть не должно.
            return await rollback(describeFiscalError(outcome.error));
          }

          if (outcome.outcome === "needs_attention") {
            /*
             * Отменять списание здесь НЕЛЬЗЯ: чек мог записаться, и тогда
             * останется фискальный документ без денег — ровно та дыра,
             * от которой мы защищаемся с другой стороны.
             */
            return finish({
              stage: "needsAttention",
              reason: describeFiscalError(outcome.error),
              hint:
                "Сверьте последний чек на ККТ: он мог быть напечатан. " +
                "Заказ не закрыт, деньги по карте не возвращены.",
              clientId,
            });
          }

          receipt = outcome.receipt;
        }

        // ── 3. И только теперь заказ оплачен ──────────────────────────────
        payOrder(
          orderId,
          settled.map((draft) => ({
            ...draft,
            fiscalSign: receipt?.fiscalSign ?? null,
          })),
        );

        return finish({ stage: "done", operation: "sale", receipt });
      } catch (error) {
        // Сюда попадает только сорванный вызов моста — например, запуск
        // в браузере при заведённой ККМ. Списанное всё равно возвращаем.
        return await rollback(
          error instanceof Error ? error.message : "Расчёт не состоялся",
        );
      } finally {
        busyRef.current = false;
      }
    },
    [
      state.orders,
      kkm,
      cashShift,
      isNonFiscal,
      staff,
      itemsOfOrder,
      orderTotals,
      payOrder,
      findMenuItem,
    ],
  );

  /**
   * Возврат по чеку.
   *
   * Порядок тот же, что у продажи, и по той же причине: **деньги, потом
   * документ**. Чек возврата прихода до того, как терминал отдал деньги, —
   * это документ о возврате, которого не случилось; встречная строка в кассе
   * до чека — деньги, ушедшие мимо фискального документа.
   *
   * **Возвращается чек целиком**, а не отдельные позиции. Частичный возврат
   * требует своей раскладки по строкам: ККТ не примет документ, где сумма
   * позиций не сошлась с суммой платежей, и «вернуть одно блюдо из четырёх»
   * это не подмножество строк, а новый расчёт со своей скидкой. Пока такого
   * расчёта нет, честнее не показывать возможность, чем печатать документ,
   * который не сойдётся при сверке.
   */
  const refund = useCallback(
    async (orderId: UUID): Promise<CheckoutStage> => {
      const finish = (next: CheckoutStage): CheckoutStage => {
        setStatus(next);
        busyRef.current = false;
        return next;
      };

      const fail = (reason: string) =>
        finish({ stage: "failed", operation: "refund", reason });

      if (busyRef.current) return { stage: "idle" };

      const order = state.orders[orderId];
      if (!order) return fail("Заказ не найден");

      if (kkm && !kkm.isRunning) return fail(stoppedKkmReason(kkm.name));

      // Та же причина, что и у продажи: встречной строке нужна открытая смена,
      // иначе деньги уйдут гостю, а записать их будет некуда.
      if (!cashShift) return fail(NO_CASH_SHIFT);

      const payments = paymentsOfOrder(orderId);
      const refundable = refundablePayments(payments);

      if (refundable.length === 0) {
        return fail("По этому чеку возвращать нечего");
      }

      /*
       * Часть чека уже возвращена. Дальше идти нельзя: документ возврата
       * пробивается на весь состав заказа, и второй такой же означал бы
       * возврат тех же блюд дважды.
       */
      if (refundable.length !== payments.filter((p) => p.refundOf === null).length) {
        return fail("Часть чека уже возвращена — остаток возвращается вручную");
      }

      busyRef.current = true;

      const clientId = newId();
      /** Возвраты, которые уже отданы гостю: их и придётся откатывать. */
      const returned: string[] = [];

      /** Забрать обратно всё, что успели вернуть, и показать причину. */
      const rollback = async (reason: string): Promise<CheckoutStage> => {
        for (const id of returned) {
          try {
            await acquiringReversal(id);
          } catch {
            return finish({
              stage: "needsAttention",
              reason,
              hint:
                "Возврат по карте отменить не удалось: деньги гостю могли " +
                "уйти, а чек возврата не пробит. Сверьте операции на терминале.",
              clientId: id,
            });
          }
        }
        return fail(reason);
      };

      try {
        // ── 1. Деньги гостю ───────────────────────────────────────────────
        const cardLines = refundable.filter((payment) => payment.kind === "card");

        for (const [index, payment] of cardLines.entries()) {
          setStatus({
            stage: "acquiring",
            operation: "refund",
            line: index + 1,
            of: cardLines.length,
          });

          const lineId = `${clientId}-${index + 1}`;
          const outcome = await acquiringRefund({
            amount: toMinor(payment.amount),
            clientId: lineId,
            orderNumber: order.number,
          });

          if (outcome.outcome === "declined") {
            return await rollback(outcome.reason);
          }

          if (outcome.outcome === "needs_attention") {
            return finish({
              stage: "needsAttention",
              reason: describeTerminalError(outcome.error),
              hint:
                "Проверьте на терминале, прошёл ли возврат, прежде чем " +
                "повторять. Встречная строка в чеке не записана.",
              clientId: lineId,
            });
          }

          returned.push(lineId);
        }

        // ── 2. Чек возврата прихода ───────────────────────────────────────
        let receipt: FiscalReceipt | null = null;

        if (!isNonFiscal) {
          setStatus({ stage: "fiscal", operation: "refund" });

          const outcome = await fiscalRegister({
            kind: "refund",
            items: receiptItems(
              itemsOfOrder(orderId),
              orderTotals(orderId).total,
              kkm?.defaultVat ?? "vat20",
              findMenuItem,
            ),
            payments: refundable.map((payment) => ({
              kind: payment.kind === "cash" ? ("cash" as const) : ("cashless" as const),
              amount: toMinor(payment.amount),
            })),
            taxSystem: kkm?.taxSystem ?? "usn_income",
            cashierName: staff?.fullName ?? "—",
            orderNumber: order.number,
            clientId,
          });

          if (outcome.outcome === "failed") {
            // Документа нет — значит и деньги гостю уходить не должны.
            return await rollback(describeFiscalError(outcome.error));
          }

          if (outcome.outcome === "needs_attention") {
            /*
             * Как и при продаже: чек мог записаться, и отмена возврата
             * оставила бы документ без движения денег. Решает человек.
             */
            return finish({
              stage: "needsAttention",
              reason: describeFiscalError(outcome.error),
              hint:
                "Сверьте последний чек на ККТ: возврат мог быть напечатан. " +
                "Встречная строка в чеке не записана.",
              clientId,
            });
          }

          receipt = outcome.receipt;
        }

        // ── 3. И только теперь встречные строки ───────────────────────────
        refundPayments(refundable.map((payment) => payment.id));

        return finish({ stage: "done", operation: "refund", receipt });
      } catch (error) {
        return await rollback(
          error instanceof Error ? error.message : "Возврат не состоялся",
        );
      } finally {
        busyRef.current = false;
      }
    },
    [
      state.orders,
      kkm,
      cashShift,
      isNonFiscal,
      staff,
      itemsOfOrder,
      orderTotals,
      paymentsOfOrder,
      refundPayments,
      findMenuItem,
    ],
  );

  const value = useMemo<CheckoutValue>(
    () => ({
      status,
      isBusy:
        status.stage === "acquiring" || status.stage === "fiscal",
      pay,
      refund,
      reset: () => setStatus({ stage: "idle" }),
      isNonFiscal,
    }),
    [status, pay, refund, isNonFiscal],
  );

  return (
    <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
  );
}

/**
 * Отказ из-за остановленной ККМ.
 *
 * Общий на продажу и возврат: порт отпущен сервисным экраном ради утилиты
 * производителя (`state/devices.tsx`), и это режим обслуживания, а не поломка.
 * Кассир обязан прочесть, что делать, а не гадать по отказу драйвера.
 */
function stoppedKkmReason(name: string): string {
  return `ККМ «${name}» остановлена — запустите её в настройках оборудования`;
}

const NO_CASH_SHIFT =
  "Кассовая смена закрыта — откройте её на экране кассы, иначе платёж некуда записать";

/**
 * Позиции чека с разложенной по ним скидкой.
 *
 * Раскладка обязательна: ККТ не примет документ, в котором сумма позиций
 * не сошлась с суммой платежей, а скидка применяется к заказу целиком
 * (`lib/discount.ts`). Сама арифметика — в `lib/receipt-lines.ts` под тестами.
 */
function receiptItems(
  items: OrderItem[],
  total: Money,
  vat: VatRate,
  /**
   * Меню уезжает параметром, а не берётся из модуля: оно приезжает с узла
   * и меняется в течение смены, а функция обязана остаться чистой — по ней
   * собирается фискальный документ.
   */
  findMenuItem: MenuItemLookup,
): FiscalReceiptItem[] {
  const sources: ReceiptLineSource[] = items
    // Сторнированная позиция в чек не идёт: из суммы она выпала,
    // а в фискальном документе ей взяться неоткуда.
    .filter((item) => item.status !== "voided")
    .map((item) => {
      const menuItem = findMenuItem(item.menuItemId);
      return {
        name: menuItem?.name ?? "Позиция",
        quantity: item.quantity,
        unitPrice: menuItem?.price ?? "0.00",
      };
    });

  return buildReceiptLines(sources, total).map((line) => ({
    name: line.name,
    quantityMilli: line.quantityMilli,
    price: line.price,
    // Ставка одна на заведение и лежит в настройках ККМ: в меню её нет,
    // а у общепита она обычно и правда одна (см. `state/devices.tsx`).
    vat,
    lineTotal: line.lineTotal,
  }));
}

/**
 * Строки оплаты для ККТ.
 *
 * Кассе видов оплаты четыре, кассовому аппарату — два. Всё, что не наличные,
 * для него безнал: и карта, и расчёт по счёту. «Без выручки» в чек не идёт
 * вовсе — денег по нему не поступает.
 */
function fiscalPayments(drafts: PaymentDraft[]): FiscalReceiptPayment[] {
  return drafts
    .filter(
      (draft) => findPaymentType(draft.paymentTypeId)?.kind !== "no_revenue",
    )
    .map((draft) => ({
      kind:
        findPaymentType(draft.paymentTypeId)?.kind === "cash"
          ? ("cash" as const)
          : ("cashless" as const),
      amount: toMinor(draft.amount),
    }));
}

export function useCheckout(): CheckoutValue {
  const value = useContext(CheckoutContext);
  if (!value) {
    throw new Error("useCheckout вызван вне CheckoutProvider");
  }
  return value;
}
