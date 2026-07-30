import type { TerminalKind, UUID } from "@restopos/shared-types";

/**
 * Имя комнаты socket.io. ДОЛЖНО совпадать с roomName в
 * packages/api-client/src/types.ts — клиент присылает это же имя при подписке.
 * Изоляция комнат = venue_id + kind: кухня не получает события зала и наоборот
 * (инвариант №4).
 */
export function roomName(venueId: UUID, kind: TerminalKind): string {
  return `venue:${venueId}:${kind}`;
}
