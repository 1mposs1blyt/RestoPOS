import { useState } from "react";
import { cn } from "../cn";

/**
 * Экранная клавиатура для текста.
 *
 * На кассе физической клавиатуры нет: имя гостя, адрес доставки и поиск
 * по меню набирают пальцем. `NumKeyboard` для этого не годится — им набирают
 * суммы, а не слова.
 *
 * Две раскладки, ЙЦУКЕН и QWERTY: имя гостя пишут по-русски, а внешний номер
 * заказа из агрегатора — латиницей, и переключаться приходится в одном поле.
 *
 * Клавиши «литые», без зазоров: на сенсорном экране промежуток между кнопками
 * это мёртвая зона, где касание не срабатывает вовсе.
 */
export type TextKeyboardLayout = "ru" | "en";

const RU_ROWS = [
  ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ъ"],
  ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
  ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю"],
];

const EN_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"];

export interface TextKeyboardProps {
  value: string;
  onChange: (next: string) => void;
  /** Нажатие Enter — обычно «искать» или «сохранить». */
  onSubmit?: () => void;
  layout?: TextKeyboardLayout;
  className?: string;
}

export function TextKeyboard({
  value,
  onChange,
  onSubmit,
  layout: initialLayout = "ru",
  className,
}: TextKeyboardProps) {
  const [layout, setLayout] = useState<TextKeyboardLayout>(initialLayout);
  /**
   * Регистр держим залипающим на одну букву — как на телефоне: имя пишут
   * с большой один раз, и снимать регистр вручную после каждой заглавной
   * значит два лишних касания на каждое слово.
   */
  const [shift, setShift] = useState(false);

  const rows = layout === "ru" ? RU_ROWS : EN_ROWS;

  const type = (char: string) => {
    onChange(value + (shift ? char.toUpperCase() : char));
    setShift(false);
  };

  return (
    <div
      className={cn(
        "select-none overflow-hidden rounded-2xl border border-slate-600/50 bg-slate-700/40",
        className,
      )}
    >
      <Row>
        {DIGITS.map((digit) => (
          <Key key={digit} onPress={() => onChange(value + digit)}>
            {digit}
          </Key>
        ))}
        <Key
          onPress={() => onChange(value.slice(0, -1))}
          className="text-rose-400"
          aria-label="Стереть символ"
        >
          ⌫
        </Key>
      </Row>

      {rows.map((row, index) => (
        <Row key={row.join("")}>
          {index === 2 && (
            <Key
              onPress={() => setShift((prev) => !prev)}
              className={cn(shift && "bg-orange-500 text-white")}
            >
              Регистр
            </Key>
          )}
          {row.map((char) => (
            <Key key={char} onPress={() => type(char)}>
              {shift ? char.toUpperCase() : char}
            </Key>
          ))}
          {index === 2 && onSubmit && (
            <Key onPress={onSubmit} className="bg-slate-600/60">
              Ввод
            </Key>
          )}
        </Row>
      ))}

      <Row>
        <Key
          onPress={() => setLayout((prev) => (prev === "ru" ? "en" : "ru"))}
          className="w-20"
        >
          {layout === "ru" ? "EN" : "РУ"}
        </Key>
        <Key onPress={() => onChange(`${value} `)} className="flex-1">
          пробел
        </Key>
        <Key onPress={() => onChange("")} className="text-rose-400">
          Стереть всё
        </Key>
      </Row>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex">{children}</div>;
}

function Key({
  onPress,
  className,
  children,
  ...rest
}: {
  onPress: () => void;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children">) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        // Минимальная цель касания — 44px по высоте; ширину раздаёт flex,
        // чтобы ряды разной длины заполняли строку целиком без зазоров.
        "min-h-14 flex-1 border-b border-r border-slate-600/40 px-1 text-base font-bold text-slate-200",
        "transition-colors active:bg-slate-600/70",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
