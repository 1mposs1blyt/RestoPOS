/**
 * Локальное хранилище терминала.
 *
 * Пока бэкенд не подключён, оно играет роль источника данных. Когда подключим —
 * останется в роли офлайн-кеша: источник истины по инварианту №3 всегда БД,
 * а localStorage переживает перезапуск кассы между сменами.
 */

const PREFIX = "restopos.";

/** Обычный объект, а не массив, `null` или экземпляр класса. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

/**
 * Дополнить прочитанное состояние полями, которых в нём нет.
 *
 * Верхний уровень и только он: сторы держат состояние формой
 * «несколько словарей рядом» (`{ orders, items, payments, discounts }`),
 * и потерянное поле здесь — это `undefined` вместо словаря.
 */
function withDefaults<T>(stored: unknown, fallback: T): T {
  if (!isPlainObject(stored) || !isPlainObject(fallback)) return stored as T;

  const merged: Record<string, unknown> = { ...stored };
  for (const [field, value] of Object.entries(fallback)) {
    if (merged[field] === undefined) merged[field] = value;
  }
  return merged as T;
}

/**
 * Прочитать состояние стора.
 *
 * **Прочитанное дополняется значениями по умолчанию, а не отдаётся как есть.**
 * Причина конкретная: состояние переживает обновления кассы, а формат его
 * растёт. Заказы, сохранённые до появления скидок, приезжали без поля
 * `discounts`, и первый же `Object.values(state.discounts)` ронял приложение
 * в белый экран — без сообщения и без выхода, потому что упавший провайдер
 * уносит с собой и навигацию, и сервисный экран, с которого состояние
 * можно было бы сбросить.
 *
 * Слияние поверхностное: оно закрывает «поле добавили», а не произвольную
 * смену формы. Переезды посложнее (как три поколения расстановки столов)
 * стор делает сам, и делает это уже после чтения.
 */
export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return withDefaults(JSON.parse(raw) as unknown, fallback);
  } catch (error) {
    console.error(`Не удалось прочитать «${key}» из localStorage:`, error);
    return fallback;
  }
}

export function saveState(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error(`Не удалось сохранить «${key}» в localStorage:`, error);
  }
}

/**
 * Стереть всё состояние терминала. Чужие ключи в localStorage не трогаем:
 * на одном WebView может жить не только касса.
 */
export function clearAll(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  for (const key of keys) localStorage.removeItem(key);
}

/** Временный идентификатор для сущностей, созданных до синхронизации. */
export function newId(): string {
  return crypto.randomUUID();
}
