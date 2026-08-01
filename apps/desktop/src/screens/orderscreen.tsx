import { useState } from "react";

export function OrderScreen() {
  const [category, setCategory] = useState("Горячее");
  return (
    <div className="w-screen h-screen bg-[#1e2530] text-white flex overflow-hidden select-none">
      
      {/* ЛЕВАЯ ПАНЕЛЬ: КОРЗИНА ЗАКАЗА (35% ширины) */}
      <div className="w-[35%] border-r border-slate-700 flex flex-col bg-slate-900">
        {/* Инфо о столе */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Стол 2</h2>
            <p className="text-xs text-slate-400">Гостей: 2 • Официант: Иван П.</p>
          </div>
          <button className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold">Выйти</button>
        </div>

        {/* Список добавленных блюд со скроллом */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-between items-start border-b border-slate-800 pb-2">
            <div>
              <div className="font-bold text-base">1. Суп Борщ Украинский</div>
              <div className="text-xs text-amber-400 ml-3">• со сметаной</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm">2 x 350 ₽</div>
              <div className="font-bold text-sm text-slate-300">700 ₽</div>
            </div>
          </div>
          {/* Конец списка блюд */}
        </div>

        {/* Футер корзины с кнопкой оплаты */}
        <div className="p-4 bg-slate-850 border-t border-slate-700 space-y-4">
          <div className="flex justify-between text-xl font-black">
            <span>ИТОГО:</span>
            <span className="font-mono text-amber-400">700 ₽</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold">Пречек</button>
            <button className="bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-black text-white shadow-lg">ОПЛАТА</button>
          </div>
        </div>
      </div>

      {/* ПРАВАЯ ПАНЕЛЬ: КАТЕГОРИИ И СЕТКА БЛЮД (65% ширины) */}
      <div className="flex-1 flex flex-col p-4 bg-[#1e2530]">
        {/* Горизонтальный скролл категорий */}
        <nav className="flex gap-2 overflow-x-auto pb-4 border-b border-slate-700 mb-4">
          {["Популярное", "Холодные закуски", "Горячее", "Супы", "Десерты", "Бар"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-3 rounded-xl font-bold whitespace-nowrap transition ${
                category === cat ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Сетка товаров (CSS Grid) литые плитки с ценами */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto">
          {[
            { name: "Стейк Рибай", price: 1200 },
            { name: "Шашлык свиной", price: 550 },
            { name: "Паста Карбонара", price: 480 },
            { name: "Пюре с котлетой", price: 320 },
            { name: "Куриные крылья", price: 420 },
            { name: "Овощи гриль", price: 280 }
          ].map((dish, i) => (
            <button
              key={i}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 flex flex-col justify-between items-start text-left aspect-square shadow-sm transition active:scale-97"
            >
              <div className="text-lg font-bold leading-tight">{dish.name}</div>
              <div className="text-xl font-black text-blue-400 font-mono">{dish.price} ₽</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
