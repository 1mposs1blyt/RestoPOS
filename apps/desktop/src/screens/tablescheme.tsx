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

// Строго объявляем интерфейс пропсов на экспорт
export interface TableSchemeProps {
  onTableSelect?: (tableId: string) => void;
}

// Передаем интерфейс в React.FC<TableSchemeProps>
export const TableScheme: React.FC<TableSchemeProps> = ({ onTableSelect }) => {
  const [tables, setTables] = useState<Table[]>(getInitialTables);
  const [isDesignMode, setIsDesignMode] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [dragInfo, setDragInfo] = useState<{
    tableId: string;
    startX: number; 
    startY: number;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tables));
  }, [tables]);

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

  const deleteTable = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    setTables(prev => prev.filter(t => t.id !== id));
  };

  const handleMouseDown = (e: React.MouseEvent, table: Table) => {
    if (!isDesignMode) return;
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    setDragInfo({
      tableId: table.id,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragInfo || !isDesignMode || !canvasRef.current) return;
    
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    let newX = e.clientX - canvasRect.left - dragInfo.startX;
    let newY = e.clientY - canvasRect.top - dragInfo.startY;
    
    const currentTable = tables.find(t => t.id === dragInfo.tableId);
    if (!currentTable) return;

    const maxX = canvasRect.width - currentTable.width;
    const maxY = canvasRect.height - currentTable.height;
    
    if (newX < 0) newX = 0;
    if (newX > maxX) newX = maxX;
    if (newY < 0) newY = 0;
    if (newY > maxY) newY = maxY;

    setTables(prev => prev.map(t => 
      t.id === dragInfo.tableId ? { ...t, x: Math.round(newX), y: Math.round(newY) } : t
    ));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragInfo) {
      e.preventDefault();
      setDragInfo(null);
    }
  };

  const handleTableClick = (table: Table, e: React.MouseEvent) => {
    if (isDesignMode) return;
    e.preventDefault();
    if (onTableSelect) {
      onTableSelect(table.id);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 p-6 select-none">
      <div className="flex items-center justify-between mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700/50 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold tracking-wide">Схема зала</h2>
          <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-md">
            Столов: {tables.length}
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
              setDragInfo(null);
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

      <div 
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full flex-1 bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-800/80 shadow-inner"
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
              onClick={(e) => handleTableClick(table, e)}
              style={{
                position: 'absolute',
                left: `${table.x}px`,
                top: `${table.y}px`,
                width: `${table.width}px`,
                height: `${table.height}px`,
                zIndex: isDragging ? 50 : 10,
              }}
              className={`
                flex items-center justify-center border-2 font-bold text-lg transition-colors duration-150 shadow-md touch-none
                ${isCircle ? 'rounded-full' : 'rounded-xl'}
                ${isDesignMode 
                  ? isDragging
                    ? 'border-orange-400 bg-orange-500/20 cursor-grabbing shadow-lg shadow-orange-500/10'
                    : 'border-orange-500/40 bg-orange-500/5 cursor-grab hover:border-orange-400 hover:bg-orange-500/10'
                  : 'border-emerald-500/50 bg-emerald-500/5 cursor-pointer hover:border-emerald-400 hover:bg-emerald-500/15 hover:shadow-emerald-500/10 active:scale-98'
                }
              `}
            >
              <div className="flex flex-col items-center pointer-events-none">
                <span className="text-xs uppercase text-slate-500 tracking-wider font-medium mb-0.5">Стол</span>
                <span className={isDesignMode ? 'text-orange-400' : 'text-emerald-400'}>{table.number}</span>
              </div>
              
              {isDesignMode && (
                <button
                  onClick={(e) => deleteTable(table.id, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-90 rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-slate-950 shadow-md z-20"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
        
        {tables.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
            <span className="text-4xl mb-2">🍽️</span>
            <p className="text-sm">На холсте пока нет столов.</p>
          </div>
        )}
      </div>
    </div>
  );
};
