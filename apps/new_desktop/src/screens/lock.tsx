import { PinPad } from "@restopos/ui-kit";

interface LockScreenProps {
  onUnlock: () => void;
}

/**
 * Блокировка терминала.
 *
 * Пин демонстрационный и проверяется на терминале: узла под прототипом нет.
 * На проде пины лежат хешами в БД узла (`staff.pin_code_hash`), и сюда
 * приедет `data/session-source.ts`, а экран не изменится.
 */
const DEMO_PIN = "2222";

export function LockScreen({ onUnlock }: LockScreenProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 bg-neutral-950 text-white">
      <div className="text-center">
        <p className="text-3xl font-bold text-orange-500">RestoPOS</p>
        <p className="mt-2 text-neutral-500">Терминал заблокирован</p>
      </div>

      <PinPad
        onSubmit={(pin) => {
          if (pin !== DEMO_PIN) return Promise.reject(new Error("Неверный PIN"));
          onUnlock();
          return Promise.resolve();
        }}
      />

      <p className="text-sm text-neutral-700">Демо-пин кассира: 2222</p>
    </div>
  );
}
