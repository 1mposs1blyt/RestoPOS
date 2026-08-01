import { useEffect } from "react";
import { cn } from "../cn";
import { NumKeyboard } from "../medium/NumKeyboard";

export interface AuthFormProps {
  /** Текущее строковое значение пин-кода (передается из родителя) */
  value: string;
  /** Функция обратного вызова для изменения строки ввода */
  onChange: (newValue: string) => void;
  /** Максимальная длина пин-кода (по умолчанию 4) */
  maxLength?: number;
  /** Функция, которая сработает автоматически при полном вводе кода */
  onComplete?: (pin: string) => void;
}

export function AuthForm({ 
  value = "", 
  onChange, 
  maxLength = 4, 
  onComplete 
}: AuthFormProps) {

  // Функция обработки нажатий на кнопки клавиатуры
  const handleKeyPress = (pressedKey: string) => {
    if (pressedKey === "✕") {
      // Кнопка удаления: убираем последний символ
      onChange(value.slice(0, -1));
    } else {
      // Кнопка с цифрой: добавляем символ, если лимит длины не превышен
      if (value.length < maxLength) {
        onChange(value + pressedKey);
      }
    }
  };

  // Автоматический вызов onComplete при заполнении всех символов
  useEffect(() => {
    if (value.length === maxLength && onComplete) {
      onComplete(value);
    }
  }, [value, maxLength, onComplete]);

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* Левая половина (Паттерн-узор) */}
      <div
        className="hidden md:flex md:w-1/2 shrink-0 bg-repeat bg-[length:320px] relative border-r border-gray-200"
        style={{ backgroundImage: "url('/bg-logo.webp')" }}
      >
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Правая половина (Форма авторизации) */}
      <div className="w-full md:w-1/2 shrink-0 bg-[#1e2530] flex flex-col justify-center items-center gap-12 p-6 text-white">
        
        {/* БЛОК ДЛЯ ЛОГОТИПА И НАЗВАНИЯ */}
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-black tracking-wider uppercase mb-1">
            Resto_POS
          </h1>
          <p className="text-gray-400 text-sm">
            Введите ваш персональный пин-код
          </p>
        </div>

        {/* 
          ПЕРЕИСПОЛЬЗУЕМАЯ КЛАВИАТУРА 
          Она остается абсолютно независимой и "глупой"
        */}
        <NumKeyboard onPress={handleKeyPress} />
        
      </div>
    </div>
  );
}
