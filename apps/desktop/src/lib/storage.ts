/**
 * Локальное хранилище терминала.
 *
 * Пока бэкенд не подключён, оно играет роль источника данных. Когда подключим —
 * останется в роли офлайн-кеша: источник истины по инварианту №3 всегда БД,
 * а localStorage переживает перезапуск кассы между сменами.
 */

const PREFIX = "restopos.";

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
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

/** Временный идентификатор для сущностей, созданных до синхронизации. */
export function newId(): string {
  return crypto.randomUUID();
}
