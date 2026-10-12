import { useState } from "react";
import { CounterScreen } from "./screens/counter";
import { LockScreen } from "./screens/lock";
import { RefundScreen } from "./screens/refund";
import type { Screen } from "./screens/routes";
import { ShiftScreen } from "./screens/shift";
import { StopListScreen } from "./screens/stoplist";
import { PosProvider } from "./state/pos";

/**
 * Оболочка терминала.
 *
 * Блокировка — не маршрут, а состояние поверх любого экрана: сняв её, кассир
 * обязан вернуться туда же, где был, иначе набранный заказ теряется при
 * каждом отходе от кассы.
 */
function Shell() {
  const [screen, setScreen] = useState<Screen>("counter");
  const [locked, setLocked] = useState(false);

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;

  const back = () => setScreen("counter");

  switch (screen) {
    case "shift":
      return <ShiftScreen onBack={back} />;
    case "stoplist":
      return <StopListScreen onBack={back} />;
    case "refund":
      return <RefundScreen onBack={back} />;
    case "counter":
      return (
        <CounterScreen onNavigate={setScreen} onLock={() => setLocked(true)} />
      );
  }
}

export default function App() {
  return (
    <PosProvider>
      <Shell />
    </PosProvider>
  );
}
