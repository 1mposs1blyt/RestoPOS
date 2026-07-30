import { useState } from "react";
import type { Table } from "@restopos/shared-types";
import { Button, TableStatusIndicator } from "@restopos/ui-kit";

// Заглушка вместо ответа GET /venues/:id/tables — до появления бэкенда.
const DEMO_TABLES: Table[] = [
  { id: "1", venueId: "demo", label: "1", status: "free" },
  { id: "2", venueId: "demo", label: "2", status: "occupied" },
  { id: "3", venueId: "demo", label: "3", status: "reserved" },
  { id: "4", venueId: "demo", label: "4", status: "free" },
  { id: "5", venueId: "demo", label: "5", status: "occupied" },
  { id: "6", venueId: "demo", label: "6", status: "free" },
];

function App() {
  const [selected, setSelected] = useState<Table | null>(null);

  return (
    <main className="min-h-screen bg-slate-100 p-6 dark:bg-slate-900">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Зал
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selected ? `Выбран стол ${selected.label}` : "Стол не выбран"}
          </p>
        </div>
        <Button disabled={!selected}>Открыть заказ</Button>
      </header>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-4">
        {DEMO_TABLES.map((table) => (
          <TableStatusIndicator
            key={table.id}
            label={table.label}
            status={table.status}
            onClick={() => setSelected(table)}
          />
        ))}
      </div>
    </main>
  );
}

export default App;
