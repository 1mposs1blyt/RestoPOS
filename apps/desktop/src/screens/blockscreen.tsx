import { useState } from "react";
import { AuthForm } from "@restopos/ui-kit";
import { useSession } from "../app/session";

/**
 * Экран блокировки терминала. Первый и единственный экран, доступный
 * до открытия смены: вся навигация ниже требует авторизованного сотрудника.
 *
 * Вся логика ввода — в `PinPad` из ui-kit, здесь только брендирование
 * и связь с сессией. `signIn` бросает исключение при неверном пине,
 * `PinPad` по нему подсвечивает и очищает поле.
 *
 * Причину отказа показываем текстом: кроме неверного пина она бывает содержательной —
 * повар у кассы получает «на этом терминале нет доступных экранов», и без
 * объяснения он решит, что касса сломалась, и пойдёт искать менеджера.
 */
export function BlockScreen() {
  const { signIn } = useSession();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (pin: string) => {
    setError(null);
    try {
      await signIn(pin);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось войти");
      // Пробрасываем дальше: по отклонённому промису `PinPad` подсветит
      // и очистит поле.
      throw reason;
    }
  };

  return (
    <AuthForm
      onSubmit={handleSubmit}
      error={error}
      backgroundUrl="/bg-logo.webp"
      productName="RestoPOS"
      tagline="Терминал обслуживания ресторанов"
      hint="Введите персональный PIN-код"
      brand={
        <>
          <h1 className="text-3xl font-black tracking-wider text-slate-800">
            RestoPOS
          </h1>
          <p className="text-sm font-medium text-slate-600">
            Терминал обслуживания ресторанов
          </p>
          {import.meta.env.DEV && <DemoPins />}
        </>
      }
    />
  );
}

const DEMO_PINS = [
  ["1111", "Официант"],
  ["2222", "Кассир"],
  ["3333", "Менеджер"],
  ["4444", "Повар"],
  ["9999", "Тех. поддержка"],
];

/** Демо-подсказка: пока авторизации нет, пины зашиты в `session.tsx`. */
function DemoPins() {
  return (
    // Отступ через padding, а не margin: `space-y-*` родителя перебил бы `mt-*`.
    <div className="mx-auto w-fit translate-y-6 rounded-xl border border-slate-300 bg-white/70 px-4 py-3 text-left">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Демо-доступы
      </p>
      <ul className="space-y-1">
        {DEMO_PINS.map(([pin, role]) => (
          <li key={pin} className="flex gap-3 text-xs text-slate-700">
            <span className="font-mono font-bold tabular-nums">{pin}</span>
            <span className="text-slate-500">{role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
