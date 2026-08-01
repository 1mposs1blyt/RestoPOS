// src/screens/auth.tsx
import React from 'react';

interface AuthScreenProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  onComplete: (pin: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  value,
  onChange,
  maxLength = 4,
  onComplete,
}) => {
  // Генерируем массив для отрисовки точек-индикаторов
  const indicators = Array.from({ length: maxLength });

  // Обработка клика по клавишам встроенной или внешней клавиатуры
  const handleKeyPress = (char: string) => {
    if (char === '✕') {
      // Стирание последнего символа
      const newValue = value.slice(0, -1);
      onChange(newValue);
    } else {
      // Ввод цифры (если не превышен лимит)
      if (value.length < maxLength) {
        const newValue = value + char;
        onChange(newValue);
        
        // Если ввели последнюю цифру — триггерим проверку API
        if (newValue.length === maxLength) {
          // Небольшая задержка в 150мс для UX, чтобы точка успела визуально зажечься
          setTimeout(() => {
            onComplete(newValue);
          }, 150);
        }
      }
    }
  };

  return (
    <div className="w-full h-full flex bg-slate-900 text-slate-100 select-none overflow-hidden">
      
      {/* ЛЕВАЯ ЧАСТЬ: Светлый паттерн-узор (50/50 по выжимке) */}
      <div className="w-1/2 shrink-0 overflow-hidden relative bg-slate-100 flex flex-col items-center justify-center p-8">
        {/* Повторяющийся фоновый паттерн с иконками касс и оборудования */}
        <div 
          className="absolute inset-0 bg-repeat opacity-15"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://w3.org' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23475569' fill-opacity='1'%3E%3Cpath d='M10 10h10v10H10zm30 0h10v10H10zM10 40h10v10H10zm30 0h10v10H10zM20 20h10v10H20zm30 0h10v10H50zM20 50h10v10H20zm30 0h10v10H50z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '320px',
          }}
        />
        {/* Слой легкого затемнения поверх паттерна */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Контент поверх фона для солидности ERP-системы */}
        <div className="relative z-10 text-center space-y-2">
          <div className="text-5xl mb-4">🖥️</div>
          <h1 className="text-3xl font-black text-slate-800 tracking-wider">Tauri POS</h1>
          <p className="text-sm text-slate-600 font-medium">Терминал обслуживания ресторанов</p>
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Темно-синяя зона с ПИН-кодом и клавиатурой */}
      <div className="w-1/2 bg-[#1e2530] flex flex-col items-center justify-center p-12 border-l border-slate-800/50">
        
        {/* Заголовок ввода */}
        <div className="text-center mb-8 space-y-1">
          <h2 className="text-xl font-bold tracking-wide text-slate-200">Авторизация</h2>
          <p className="text-xs text-slate-500">Введите персональный PIN-код официанта</p>
        </div>

        {/* КРУГЛЫЕ ТОЧКИ-ИНДИКАТОРЫ ВВОДА */}
        <div className="flex items-center justify-center gap-5 mb-10 h-6">
          {indicators.map((_, index) => {
            // Проверяем, введена ли цифра для текущей позиции
            const isFilled = index < value.length;
            
            return (
              <div
                key={index}
                className={`
                  w-5 h-5 rounded-full border-2 transition-all duration-300 ease-out transform
                  ${isFilled 
                    ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/40 scale-110' 
                    : 'bg-transparent border-slate-600 scale-100'
                  }
                `}
              />
            );
          })}
        </div>

        {/* ИНТЕГРАЦИЯ ЛИТОЙ КЛАВИАТУРЫ (Стиль slate-600, без gap, границы через border) */}
        <div className="w-72 bg-slate-700/40 rounded-2xl overflow-hidden border border-slate-600/50 shadow-xl backdrop-blur-sm">
          <div className="grid grid-cols-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="h-16 text-xl font-bold text-slate-200 bg-transparent border-b border-r border-slate-600/40 hover:bg-slate-600/40 active:bg-slate-600/70 transition-colors"
              >
                {num}
              </button>
            ))}
            {/* Нижний ряд клавиш */}
            <button
              disabled
              className="h-16 text-slate-500 bg-transparent border-r border-slate-600/40 cursor-default"
            >
              {/* Пустая кнопка для симметрии */}
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className="h-16 text-xl font-bold text-slate-200 bg-transparent border-r border-slate-600/40 hover:bg-slate-600/40 active:bg-slate-600/70 transition-colors"
            >
              0
            </button>
            <button
              onClick={() => handleKeyPress('✕')}
              className="h-16 text-xl font-bold text-rose-400 bg-transparent hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
