import { useState } from "react";
import { AuthScreen } from "./screens/auth";
import { KitchenScreen } from "./screens/kitchenscreen";
import { TableScheme } from "./screens/tablescheme";

// Задаем типы возможных экранов
type ScreenType = "auth" | "layout" | "kitchen";

function App() {
  // Начальный экран — авторизация
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("auth");

  return (
    <main className="relative min-h-screen w-screen bg-[#1e2530] overflow-hidden">
      
      {/* 1. ПАНЕЛЬ НАВИГАЦИИ (Висит поверх всех экранов) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl flex gap-2 border border-slate-700 shadow-2xl">
        <button
          onClick={() => setCurrentScreen("auth")}
          className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition ${
            currentScreen === "auth"
              ? "bg-blue-500 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🔐 Вход
        </button>
        <button
          onClick={() => setCurrentScreen("layout")}
          className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition ${
            currentScreen === "layout"
              ? "bg-blue-500 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🪑 Зал
        </button>
        <button
          onClick={() => setCurrentScreen("kitchen")}
          className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition ${
            currentScreen === "kitchen"
              ? "bg-blue-500 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🍳 Кухня
        </button>
      </div>

      {/* 2. РЕНДЕР ТЕКУЩЕГО ЭКРАНА В ЗАВИСИМОСТИ ОТ СОСТОЯНИЯ */}
      {currentScreen === "auth" && <AuthScreen />}
      {currentScreen === "layout" && <TableScheme />}
      {currentScreen === "kitchen" && <KitchenScreen />}

    </main>
  );
}

export default App;
