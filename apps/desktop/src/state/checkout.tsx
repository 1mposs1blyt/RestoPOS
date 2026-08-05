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
  acquiringReversal,
  describeTerminalError,
} from "../lib/acquiring";
import {
  describeFiscalError,
  fiscalRegister,
  type FiscalReceipt,
  type FiscalReceiptItem,
  type FiscalReceiptPayment,
  type VatRate,
} from "../lib/fiscal";
import { findMenuItem } from "./menu";
import { useDevices } from "./devices";
import { useOrders, type PaymentDraft } from "./orders";

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

/** Что показывать на экране прямо сейчас. */
export type CheckoutStage =
  | { stage: "idle" }
  /** Гость прикладывает карту. `line` из `of` — если карт несколько. */
  | { stage: "acquiring"; line: number; of: number }
  | { stage: "fiscal" }
  /** Готово. `receipt` = `null` — нефискальный режим. */
  | { stage: "done"; receipt: FiscalReceipt | null }
  /**
   * Не получилось, и деньги гостя на месте: банк отказал либо всё списанное
   * возвращено. Заказ остался открытым, можно пробовать снова.
   */
  | { stage: "failed"; reason: string }
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
  const { state, itemsOfOrder, orderTotals, payOrder } = useOrders();

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
        return finish({ stage: "failed", reason: "Заказ не найден" });
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
          reason: `ККМ «${kkm.name}» остановлена — запустите её в настройках оборудования`,
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
        return finish({ stage: "failed", reason });
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
          setStatus({ stage: "fiscal" });

          const outcome = await fiscalRegister({
            kind: "sale",
            items: receiptItems(
              itemsOfOrder(orderId),
              orderTotals(orderId).total,
              kkm?.defaultVat ?? "vat20",
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

        return finish({ stage: "done", receipt });
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
    [state.orders, kkm, isNonFiscal, staff, itemsOfOrder, orderTotals, payOrder],
  );

  const value = useMemo<CheckoutValue>(
    () => ({
      status,
      isBusy:
        status.stage === "acquiring" || status.stage === "fiscal",
      pay,
      reset: () => setStatus({ stage: "idle" }),
      isNonFiscal,
    }),
    [status, pay, isNonFiscal],
  );

  return (
    <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
  );
}

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
