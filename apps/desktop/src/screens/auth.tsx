import { AuthForm, Button, TableStatusIndicator } from "@restopos/ui-kit";
import { useState } from "react";
import type { Table } from "@restopos/shared-types";

// Заглушка вместо ответа GET /venues/:id/tables — до появления бэкенда.
const DEMO_TABLES: Table[] = [
  { id: "1", venueId: "demo", label: "1", status: "free" },
  { id: "2", venueId: "demo", label: "2", status: "occupied" },
  { id: "3", venueId: "demo", label: "3", status: "reserved" },
  { id: "4", venueId: "demo", label: "4", status: "free" },
  { id: "5", venueId: "demo", label: "5", status: "occupied" },
  { id: "6", venueId: "demo", label: "6", status: "free" },
];

export function AuthScreen() {
  const [selected, setSelected] = useState<Table | null>(null);
  
  // 1. Создаем стейт для хранения вводимого пин-кода сотрудников
  const [pin, setPin] = useState<string>("");

  // 2. Функция, которая выполнится автоматически, когда пин-код будет введен полностью
  const handleAuthComplete = (finalPin: string) => {
    console.log("Пин-код полностью введен на экране AuthScreen:", finalPin);
    
    // Здесь будет вызов метода авторизации к бэкенду (например, authByPin(finalPin))
    // После успешной авторизации можно очистить пин-код: setPin("");
  };

  return (
    <>
      {/*
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
       */}
       
      {/* 
        3. Передаем контролируемые параметры в компонент формы авторизации.
        Теперь данные о вводе находятся здесь, на верхнем уровне экрана.
      */}
      <AuthForm 
        value={pin} 
        onChange={setPin} 
        maxLength={4} 
        onComplete={handleAuthComplete} 
      />
    </>
  );
}
