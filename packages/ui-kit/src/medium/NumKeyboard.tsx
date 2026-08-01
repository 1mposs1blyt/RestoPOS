// import { cn } from "../../cn"; // Убедитесь, что путь к cn правильный

// 1. Обязательно добавляем описание интерфейса для пропсов клавиатуры
export interface NumKeyboardProps {
  onPress: (value: string) => void;
}

// 2. Указываем этот интерфейс в параметрах функции и деструктурируем onPress
export function NumKeyboard({ onPress }: NumKeyboardProps) {
  const buttons = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="grid grid-cols-3 w-full max-w-xs bg-slate-600 rounded-2xl overflow-hidden shadow-xl text-white border border-slate-500">
      {/* Кнопки 1-9 */}
      {buttons.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onPress(num)}
          className="bg-slate-600 hover:bg-slate-500 active:bg-slate-700 text-3xl font-extrabold transition aspect-square flex items-center justify-center border-b border-r border-slate-500 select-none"
        >
          {num}
        </button>
      ))}

      {/* Пустой квадратный блок-заглушка */}
      <div className="bg-slate-600 border-b border-r border-slate-500 aspect-square"></div>

      {/* Кнопка 0 */}
      <button
        type="button"
        onClick={() => onPress("0")}
        className="bg-slate-600 hover:bg-slate-500 active:bg-slate-700 text-3xl font-extrabold transition aspect-square flex items-center justify-center border-r border-slate-500 select-none"
      >
        0
      </button>

      {/* Кнопка удаления (✕) */}
      <button
        type="button"
        onClick={() => onPress("✕")}
        className="bg-slate-600 hover:bg-slate-500 active:bg-slate-700 text-3xl font-extrabold transition aspect-square flex items-center justify-center text-red-400 hover:text-red-300 select-none"
      >
        ✕
      </button>
    </div>
  );
}
