import { useEffect, useState } from "react";

/**
 * Текущее время, обновляемое по таймеру. Нужно там, где на экране «горит»
 * возраст заказа: на схеме зала и на кухне повар ориентируется по минутам,
 * поэтому цифра обязана идти сама, без перерисовки по другим причинам.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

export function minutesSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

export function formatElapsed(iso: string, now: number): string {
  const totalMinutes = minutesSince(iso, now);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}`
    : `${minutes} мин`;
}
