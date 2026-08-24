import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../cn";
import { NumKeyboard, type NumKeyboardKey } from "../medium/NumKeyboard";
import { PinDots } from "./PinDots";

export interface PinPadProps {
  /**
   * Вызывается, когда набраны все `length` символов.
   * Если промис отклонён — пин считается неверным: поле подсвечивается
   * и очищается. Возвращать сам результат проверки наружу не нужно.
   */
  onSubmit: (pin: string) => void | Promise<void>;
  /** Длина, на которой пин уходит на проверку сам. */
  length?: number;
  /**
   * До скольки символов можно продолжать набор.
   *
   * По умолчанию равен `length` — обычный пин сотрудника ровно четыре цифры
   * и длиннее не бывает. Больше нужно там, где рядом с четырёхзначными
   * пинами живёт длинный код: сервисный вход техподдержки.
   */
  maxLength?: number;
  /**
   * Набранное **может оказаться началом** более длинного кода.
   *
   * Без этого длинный код ввести невозможно в принципе: первые четыре
   * символа `041978` — это `0419`, панель отправила бы их на проверку,
   * получила отказ и очистила поле. Проверка синхронная и локальная:
   * ходить в сеть на каждый символ нельзя.
   */
  mayContinue?: (pin: string) => boolean;
  /**
   * Набранное — законченный длинный код, проверять прямо сейчас.
   *
   * Тоже локально и синхронно. Сам факт совпадения решает вызывающий,
   * панель только спрашивает после каждого символа.
   */
  accepts?: (pin: string) => boolean;
  /** Текст ошибки под точками (например, ответ сервера). */
  error?: string | null;
  /** Слушать физическую цифровую клавиатуру терминала. По умолчанию — да. */
  listenPhysicalKeyboard?: boolean;
  className?: string;
}

/** Сколько держать красную подсветку после неверного пина. */
const INVALID_HOLD_MS = 600;

export function PinPad({
  onSubmit,
  length = 4,
  maxLength,
  mayContinue,
  accepts,
  error,
  listenPhysicalKeyboard = true,
  className,
}: PinPadProps) {
  const limit = Math.max(maxLength ?? length, length);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);

  // Актуальное значение читаем из ref, а не из замыкания: иначе `press`
  // пришлось бы пересоздавать на каждый символ, переподписывая слушатель
  // физической клавиатуры. Побочные эффекты внутри апдейтера setValue
  // недопустимы — в StrictMode он вызывается дважды и пин ушёл бы на
  // проверку два раза.
  const valueRef = useRef("");
  const setPin = useCallback((next: string) => {
    valueRef.current = next;
    setValue(next);
  }, []);

  // onSubmit держим в ref: иначе нестабильная ссылка из родителя
  // пересоздавала бы обработчик клавиатуры на каждый рендер.
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const id of timers.current) clearTimeout(id);
    },
    [],
  );

  // Стабильная ссылка: `press` держит её в зависимостях, а пересоздание
  // на каждый рендер переподписывало бы слушатель физической клавиатуры.
  const delay = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        timers.current.push(setTimeout(resolve, ms));
      }),
    [],
  );

  const press = useCallback(
    (key: NumKeyboardKey) => {
      if (busy) return;

      if (key === "backspace") {
        setInvalid(false);
        setPin(valueRef.current.slice(0, -1));
        return;
      }

      if (valueRef.current.length >= limit) return;
      const next = valueRef.current + key;
      setPin(next);

      /*
       * Когда отправлять на проверку.
       *
       * Законченный длинный код — сразу. Иначе на своей штатной длине,
       * но только если набранное не может быть началом длинного:
       * `0419` — это и «неверный пин сотрудника», и первые четыре символа
       * сервисного кода, и отправив их, мы очистили бы поле на полпути.
       */
      const done = accepts?.(next) === true;
      if (!done) {
        if (next.length !== length) return;
        if (mayContinue?.(next) === true) return;
      }

      setBusy(true);
      void (async () => {
        try {
          // Никаких таймеров перед проверкой: последняя точка успевает
          // отрисоваться до резолва промиса, а таймер на пути аутентификации
          // подвесил бы вход везде, где браузер их тормозит (скрытая вкладка).
          await onSubmitRef.current(next);
          setPin("");
        } catch {
          setInvalid(true);
          await delay(INVALID_HOLD_MS);
          setPin("");
          setInvalid(false);
        } finally {
          setBusy(false);
        }
      })();
    },
    [busy, length, limit, mayContinue, accepts, setPin, delay],
  );

  useEffect(() => {
    if (!listenPhysicalKeyboard) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key >= "0" && event.key <= "9") {
        press(event.key as NumKeyboardKey);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        press("backspace");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [press, listenPhysicalKeyboard]);

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      {/* Точек столько, сколько символов уже есть: длинный код набирается
          редко, и держать под него пустой ряд из двенадцати кружков
          значило бы каждый день пугать кассира чужой длиной пина. */}
      <PinDots
        filled={value.length}
        length={Math.max(length, value.length)}
        invalid={invalid}
      />

      {/* Место под ошибку зарезервировано всегда — иначе клавиатура прыгает */}
      <p
        className={cn(
          "h-4 text-xs font-medium transition-opacity",
          error ? "text-rose-400 opacity-100" : "opacity-0",
        )}
        role={error ? "alert" : undefined}
      >
        {error ?? " "}
      </p>

      <NumKeyboard onPress={press} disabled={busy} />
    </div>
  );
}
