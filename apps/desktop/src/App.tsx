// src/App.tsx
import React, { useState } from 'react';
import { OrderScreen } from './screens/orderscreen';
import { AuthScreen } from './screens/auth';
// import { KitchenScreen } from './screens/kitchenscreen'; // Раскомментируйте, когда добавите kds
import { TableScheme } from './screens/tablescheme';
type ScreenType = 'auth' | 'layout' | 'order' | 'kitchen';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('layout'); 
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Состояние для пин-кода (передается в контролируемый AuthScreen)
  const [pinValue, setPinValue] = useState<string>('');

  // Обработчик клика по столу на схеме зала
  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId);
    setCurrentScreen('order'); // Автопереключение на экран заказа
  };

  // Возврат из меню обратно на схему зала
  const handleBackToScheme = () => {
    setSelectedTableId(null);
    setCurrentScreen('layout');
  };

  // Обработчик успешного ввода пин-кода
  const handleAuthComplete = (pin: string) => {
    console.log("ПИН-код отправлен на проверку:", pin);
    // Имитация успешной авторизации — пускаем в зал
    setCurrentScreen('layout');
    setPinValue(''); // Сбрасываем поле ввода
  };

  return (
    <div className="w-screen h-screen bg-slate-900 text-white overflow-hidden relative">
      
      {/* Глобальный плавающий навигационный бар (из выжимки) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 shadow-2xl z-50 flex gap-2">
        <button 
          onClick={() => setCurrentScreen('auth')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            currentScreen === 'auth' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          🔐 Блокировка
        </button>
        <button 
          onClick={() => setCurrentScreen('layout')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            currentScreen === 'layout' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          🍽️ Схема зала
        </button>
        <button 
          onClick={() => setCurrentScreen('kitchen')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            currentScreen === 'kitchen' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          🍳 Кухня (KDS)
        </button>
      </nav>

      {/* Контейнер рендеринга экранов со смещением под навигацию */}
      <main className="w-full h-full pb-20">
        
        {/* ЭКРАН 1: Авторизация (с плавными оранжевыми точками) */}
        {currentScreen === 'auth' && (
          <AuthScreen 
            value={pinValue}
            onChange={setPinValue}
            maxLength={4}
            onComplete={handleAuthComplete}
          />
        )}

        {/* ЭКРАН 2: Схема зала (с localStorage и выводом клика) */}
        {currentScreen === 'layout' && (
          <TableScheme onTableSelect={handleTableSelect} />
        )}

        {/* ЭКРАН 3: Оформление заказа (открывается при клике на стол) */}
        {currentScreen === 'order' && selectedTableId && (
          <OrderScreen 
            tableId={selectedTableId} 
            onBackToScheme={handleBackToScheme} 
          />
        )}

        {/* ЭКРАН 4: Монитор кухни */}
        {currentScreen === 'kitchen' && (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <span className="text-4xl">🍳</span>
              <p className="mt-2 text-sm">Экран кухни (KDS) готов к интеграции списков.</p>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
