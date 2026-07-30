import type { Order } from "@restopos/shared-types";
import { Button, OrderCard } from "@restopos/ui-kit";

// Заглушка вместо ответа GET /venues/:id/orders — до появления бэкенда.
const DEMO_ORDERS: Order[] = [
  {
    id: "o1",
    venueId: "demo",
    tableId: "2",
    shiftId: "s1",
    waiterId: "w1",
    status: "sent_to_kitchen",
    createdAt: new Date().toISOString(),
  },
  {
    id: "o2",
    venueId: "demo",
    tableId: null,
    shiftId: "s1",
    waiterId: "w1",
    status: "open",
    createdAt: new Date().toISOString(),
  },
];

function App() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 dark:bg-slate-900">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          Мои заказы
        </h1>
      </header>

      <div className="flex flex-col gap-3">
        {DEMO_ORDERS.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            tableLabel={order.tableId ?? undefined}
            itemCount={3}
            total="1450.00"
          />
        ))}
      </div>

      <Button fullWidth className="mt-4">
        Новый заказ
      </Button>
    </main>
  );
}

export default App;
