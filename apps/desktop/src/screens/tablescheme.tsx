// src/screens/tablescheme.tsx
import React, { useState, useEffect, useRef } from 'react';

export interface Table {
  id: string;
  number: string;
  type: 'rectangle' | 'circle' | 'square';
  x: number;
  y: number;
  width: number;
  height: number;
}

const LOCAL_STORAGE_KEY = 'iiko_table_scheme';

const getInitialTables = (): Table[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Ошибка чтения схемы столов из localStorage:", error);
    return [];
  }
};

interface TableSchemeProps {
  onTableSelect?: (tableId: string) => void;
}

export const TableScheme: React.FC<TableSchemeProps> = ({ onTableSelect }) => {
  const [tables, setTables] = useState<Table[]>(getInitialTables);
  const [isDesignMode, setIsDesignMode] = useState<boolean>(false);
  
  // Реф для вычисления координат относительно холста
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Состояние для отслеживания текущего перетаскивания
  const [dragInfo, setDragInfo] = useState<{
    tableId: string;
    startX: number; // Смещение курсора относительно левого верхнего угла стола
    startY: number;
  } | null>(null);

  // Автосохранение в localStorage при любом изменении массива столов
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tables));
  }, [tables]);

  // Добавление нового стола на холст
  const addTable = (type: 'rectangle' | 'circle' | 'square') => {
    const defaultWidth = type === 'rectangle' ? 140 : type === 'square' ? 90 : 100;
    const defaultHeight = type === 'rectangle' ? 90 : type === 'square' ? 90 : 100;
    
    const newTable: Table = {
      id: `table_${Date.now()}`,
      number: `${tables.length + 1}`,
      type,
      x: 60,
      y: 60,
      width: defaultWidth,
      height: defaultHeight,
    };
    setTables(prev => [...prev, newTable]);
  };

  // Удаление стола
  const deleteTable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Чтобы не срабатывал клик по столу/холсту
    setTables(prev => prev.filter(t => t.id !== id));
  };

  // НАЧАЛО ПЕРЕТАСКИВАНИЯ (MouseDown)
  const handleMouseDown = (e: React.MouseEvent, table: Table) => {
    if (!isDesignMode) return;
    e.preventDefault();
    
    // Вычисляем, в какую именно точку стола ткнул пользователь,
    // чтобы при движении стол не "прыгал" левым верхним углом к курсору
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setDragInfo({
      tableId: table.id,
      startX,
      startY
    });
  };

  // ПРОЦЕСС ПЕРЕТАСКИВАНИЯ (MouseMove вешаем на холст)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragInfo || !isDesignMode || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Вычисляем новые координаты стола внутри холста с учетом смещения клика
    let newX = e.clientX - canvasRect.left - dragInfo.startX;
    let newY = e.clientY - canvasRect.top - dragInfo.startY;
    
    // Находим текущий перетаскиваемый стол для ограничений по осям (bounds checking)
    const currentTable = tables.find(t => t.id === dragInfo.tableId);
    if (!currentTable) return;

    // Ограничиваем движение границами холста
    const maxX = canvasRect.width - currentTable.width;
    const maxY = canvasRect.height - currentTable.height;
    
    if (newX < 0) newX = 0;
    if (newX > maxX) newX = maxX;
    if (newY < 0) newY = 0;
    if (newY > maxY) newY = maxY;

    // Обновляем координаты конкретного стола в стейте
    setTables(prev => prev.map(t => 
      t.id === dragInfo.tableId ? { ...t, x: Math.round(newX), y: Math.round(newY) } : t
    ));
  };

  // КОНЕЦ ПЕРЕТАСКИВАНИЯ (MouseUp)
  const handleMouseUp = () => {
    if (dragInfo) {
      setDragInfo(null);
    }
  };

  // Клик по столу (в режиме просмотра)
  const handleTableClick = (table: Table) => {
    if (isDesignMode) return; // В конструкторе переключать экраны нельзя
    if (onTableSelect) {
      onTableSelect(table.id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 p-6 select-none">
      {/* Верхняя панель управления */}
      <div className="flex items-center justify-between mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold tracking-wide">Схема зала</h2>
          <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-md">
            Всего столов: {tables.length}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {isDesignMode && (
            <div className="flex gap-2 bg-slate-950/50 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => addTable('rectangle')} 
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 active:scale-95 rounded transition"
              >
                + Прямоугольный
              </button>
              <button 
                onClick={() => addTable('square')} 
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 active:scale-95 rounded transition"
              >
                + Квадратный
              </button>
              <button 
                onClick={() => addTable('circle')} 
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 active:scale-95 rounded transition"
              >
                + Круглый
              </button>
            </div>
          )}
          
          <button 
            onClick={() => {
              setDragInfo(null); // Сбрасываем незавершенный drag при переключении режима
              setIsDesignMode(!isDesignMode);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold tracking-wide shadow-sm transition active:scale-95 ${
              isDesignMode 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/20' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {isDesignMode ? '💾 Сохранить расстановку' : '🛠️ Режим конструктора'}
          </button>
        </div>
      </div>

      {/* Интерактивный холст */}
      <div 
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Предотвращает залипание, если мышь ушла с холста
        className="w-full flex-1 bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-800/80 pattern-grid shadow-inner"
        style={{
          backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {tables.map((table) => {
          const isCircle = table.type === 'circle';
          const isDragging = dragInfo?.tableId === table.id;
          
          return (
            <div
              key={table.id}
              onMouseDown={(e) => handleMouseDown(e, table)}
              onClick={() => handleTableClick(table)}
              style={{
                position: 'absolute',
                left: `${table.x}px`,
                top: `${table.y}px`,
                width: `${table.width}px`,
                height: `${table.height}px`,
              }}
              className={`
                flex items-center justify-center border-2 font-bold text-lg transition-colors duration-150 shadow-md
                ${isCircle ? 'rounded-full' : 'rounded-xl'}
                ${isDesignMode 
                  ? isDragging
                    ? 'border-orange-400 bg-orange-500/20 cursor-grabbing shadow-lg shadow-orange-500/10 z-50'
                    : 'border-orange-500/40 bg-orange-500/5 cursor-grab hover:border-orange-400 hover:bg-orange-500/10'
                  : 'border-emerald-500/50 bg-emerald-500/5 cursor-pointer hover:border-emerald-400 hover:bg-emerald-500/15 hover:shadow-emerald-500/10 active:scale-98'
                }
              `}
            >
              {/* Контент стола (Номер) */}
              <div className="flex flex-col items-center pointer-events-none">
                <span className="text-xs uppercase text-slate-500 tracking-wider font-medium mb-0.5">Стол</span>
                <span className={isDesignMode ? 'text-orange-400' : 'text-emerald-400'}>{table.number}</span>
              </div>
              
              {/* Кнопка удаления стола (только для режима админа) */}
              {isDesignMode && (
                <button
                  onClick={(e) => deleteTable(table.id, e)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-90 rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-slate-950 shadow-md transition-transform"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
        
        {/* Хелпер-заглушка при пустом зале */}
        {tables.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
            <span className="text-4xl mb-2">🍽️</span>
            <p className="text-sm">На холсте пока нет столов.</p>
            {!isDesignMode && <p className="text-xs text-slate-700 mt-1">Включите режим конструктора, чтобы добавить.</p>}
          </div>
        )}
      </div>
    </div>
  );
};
