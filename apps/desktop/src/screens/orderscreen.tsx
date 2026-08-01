// src/screens/orderscreen.tsx
import React, { useState } from 'react';

interface OrderScreenProps {
  tableId: string;
  onBackToScheme: () => void;
}

// Заглушка данных для демонстрации интерфейса меню
const MOCK_CATEGORIES = ['Популярное', 'Супы', 'Горячее', 'Напитки', 'Десерты'];
const MOCK_ITEMS = [
  { id: '1', name: 'Борщ с говядиной', price: 420, cat: 'Супы' },
  { id: '2', name: 'Стейк Рибай', price: 1500, cat: 'Горячее' },
  { id: '3', name: 'Морс клюквенный', price: 150, cat: 'Напитки' },
  { id: '4', name: 'Фо-Бо', price: 480, cat: 'Супы' },
  { id: '5', name: 'Медовик', price: 320, cat: 'Десерты' },
];

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const OrderScreen: React.FC<OrderScreenProps> = ({ tableId, onBackToScheme }) => {
  const [activeCategory, setActiveCategory] = useState('Популярное');
  const [cart, setCart] = useState<OrderItem[]>([]);

  // Добавление блюда в корзину стола
  const addToCart = (item: typeof MOCK_ITEMS[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Расчет суммы чека
  const totalSum = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="w-full h-full flex bg-slate-900 text-slate-100 p-4 gap-4 overflow-hidden select-none">
      
      {/* ЛЕВАЯ ЧАСТЬ: ТЕКУЩИЙ ЗАКАЗ (ЧЕК СТОЛА) */}
      <div className="w-96 flex flex-col bg-slate-950 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden shrink-0">
        {/* Шапка заказа */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-black text-lg text-emerald-400">Стол #{tableId.split('_')[1] || tableId}</h3>
            <span className="text-xs text-slate-500">Новый заказ</span>
          </div>
          <button 
            onClick={onBackToScheme}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition border border-slate-700/50"
          >
            ← В зал
          </button>
        </div>

        {/* Список блюд в чеке */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <span className="text-3xl mb-2">📝</span>
              <p className="text-xs">Заказ пуст. Выберите блюда.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800/60">
                <div className="flex flex-col max-w-[180px]">
                  <span className="font-medium text-sm truncate">{item.name}</span>
                  <span className="text-xs text-slate-500">{item.price} ₽</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold bg-slate-800 px-2 py-0.5 rounded text-orange-400">x{item.quantity}</span>
                  <span className="font-bold text-sm min-w-[60px] text-right">{item.price * item.quantity} ₽</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Итог и Кнопки действий */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-lg font-black px-1">
            <span>ИТОГО:</span>
            <span className="text-emerald-400 text-xl">{totalSum} ₽</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-3 bg-slate-800 hover:bg-slate-700 font-bold text-xs rounded-xl transition border border-slate-700 active:scale-95 text-slate-300">
              Пречек
            </button>
            <button 
              disabled={cart.length === 0}
              className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs text-white rounded-xl transition shadow-lg shadow-emerald-900/20 active:scale-95"
            >
              Отправить на кухню
            </button>
          </div>
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: МЕНЮ (КАТЕГОРИИ И БЛЮДА) */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Горизонтальный выбор категорий */}
        <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          {MOCK_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition whitespace-nowrap border active:scale-95 ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white border-transparent shadow-md shadow-orange-500/10'
                  : 'bg-slate-800 text-slate-400 border-slate-700/50 hover:bg-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Сетка блюд */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start pr-1">
          {MOCK_ITEMS
            .filter(item => activeCategory === 'Популярное' || item.cat === activeCategory)
            .map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="h-28 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 hover:border-slate-600/80 rounded-2xl p-4 flex flex-col justify-between items-start text-left transition shadow-sm active:scale-95 group"
              >
                <span className="font-bold text-sm leading-tight text-slate-200 group-hover:text-white transition-colors">
                  {item.name}
                </span>
                <span className="font-black text-sm text-orange-400 bg-slate-950/40 px-2 py-0.5 rounded-lg border border-slate-800/40">
                  {item.price} ₽
                </span>
              </button>
            ))}
        </div>
      </div>

    </div>
  );
};
