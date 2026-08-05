import { useCheckout } from "../state/checkout";

/**
 * Ход расчёта поверх экрана оплаты и прилавка.
 *
 * Общий на оба экрана: порядок операций у них один (`state/checkout.tsx`),
 * и объяснять его гостю и кассиру двумя разными способами незачем.
 *
 * Три вида сообщений, и разница между ними не косметическая:
 *
 * - **идёт** — кассир ждёт и ничего не нажимает;
 * - **не вышло** — деньги гостя на месте, можно пробовать снова;
 * - **требует человека** — исход неизвестен, и повторять НЕЛЬЗЯ: можно
 *   списать дважды или напечатать второй чек. Поэтому у этого сообщения
 *   нет кнопки «повторить», только «понятно», и оно другого цвета.
 */
export function CheckoutOverlay() {
  const { status, reset } = useCheckout();

  if (status.stage === "idle" || status.stage === "done") return null;

  if (status.stage === "acquiring" || status.stage === "fiscal") {
    return (
      <Backdrop>
        <div className="w-[28rem] space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">
          <span className="text-5xl">
            {status.stage === "acquiring" ? "💳" : "🧾"}
          </span>
          <h2 className="text-xl font-black text-slate-100">
            {status.stage === "acquiring"
              ? "Приложите карту к терминалу"
              : "Печатаем фискальный чек"}
          </h2>
          {status.stage === "acquiring" && status.of > 1 && (
            <p className="text-sm text-slate-400">
              Карта {status.line} из {status.of}
            </p>
          )}
          <p className="text-sm text-slate-500">
            Не выключайте кассу и не нажимайте ничего до ответа устройства.
          </p>
        </div>
      </Backdrop>
    );
  }

  if (status.stage === "failed") {
    return (
      <Backdrop>
        <div className="w-[28rem] space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">
          <span className="text-5xl">🚫</span>
          <h2 className="text-xl font-black text-slate-100">
            Расчёт не прошёл
          </h2>
          <p className="text-sm leading-snug text-slate-400">{status.reason}</p>
          <p className="text-sm text-slate-500">
            Деньги гостя на месте. Можно пробовать снова.
          </p>
          <button
            type="button"
            onClick={reset}
            className="min-h-14 w-full rounded-xl bg-slate-800 text-sm font-bold text-slate-200 transition hover:bg-slate-700 active:scale-95"
          >
            Понятно
          </button>
        </div>
      </Backdrop>
    );
  }

  return (
    <Backdrop>
      <div className="w-[32rem] space-y-4 rounded-2xl border-2 border-amber-500/70 bg-slate-900 p-8 text-center shadow-2xl">
        <span className="text-5xl">⚠️</span>
        <h2 className="text-xl font-black text-amber-300">
          Нужна проверка — не повторяйте оплату
        </h2>
        <p className="text-sm leading-snug text-slate-300">{status.reason}</p>
        <p className="text-sm leading-snug text-slate-400">{status.hint}</p>
        {/* Идентификатор операции — то, по чему её найдут на терминале
            и в журнале ККТ. Без него «сверьте последний чек» — это совет
            искать иголку в стоге. */}
        <p className="rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-slate-500">
          {status.clientId}
        </p>
        <button
          type="button"
          onClick={reset}
          className="min-h-14 w-full rounded-xl border border-amber-700 bg-amber-950/60 text-sm font-bold text-amber-200 transition active:scale-95"
        >
          Понятно
        </button>
      </div>
    </Backdrop>
  );
}

function Backdrop({ children }: { children: React.ReactNode }) {
  // `fixed`, а не `absolute`: оверлей рендерится внутри экрана, у которого
  // позиционированного предка может не оказаться.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6">
      {children}
    </div>
  );
}
