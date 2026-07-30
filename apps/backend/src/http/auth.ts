import type { FastifyInstance, FastifyRequest } from "fastify";
import type { StaffRole, TerminalKind } from "@restopos/shared-types";
import { config } from "../config";
import { unauthorized } from "./errors";
import type { RequestContext } from "./context";

// Публичные префиксы, не требующие контекста арендатора.
const PUBLIC_PREFIXES = ["/health", "/auth"];

function isPublic(url: string): boolean {
  const path = url.split("?")[0];
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/**
 * Достаёт контекст арендатора из запроса. Пока нет входа по PIN и токенов смены —
 * два режима:
 *   - AUTH_DEV_BYPASS=1 → из заголовков x-org-id / x-venue-id / ... (локально);
 *   - иначе ожидается Bearer-токен, разбор которого ещё не реализован (TODO).
 * Это единственная точка, которую заменит реальная аутентификация терминала.
 */
function resolveContext(req: FastifyRequest): RequestContext {
  if (config.authDevBypass) {
    const h = req.headers;
    const organizationId = str(h["x-org-id"]);
    const venueId = str(h["x-venue-id"]);
    if (!organizationId || !venueId) {
      throw unauthorized("dev-bypass требует заголовки x-org-id и x-venue-id");
    }
    return {
      organizationId,
      venueId,
      terminalKind: (str(h["x-terminal-kind"]) ?? "pos") as TerminalKind,
      staffId: str(h["x-staff-id"]) ?? null,
      role: (str(h["x-staff-role"]) as StaffRole | undefined) ?? null,
    };
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) throw unauthorized();
  // TODO: проверить токен смены и достать из него organization/venue/staff.
  throw unauthorized("Проверка Bearer-токена ещё не реализована");
}

/** Навешивает разбор контекста на все непубличные запросы. */
export function registerAuth(app: FastifyInstance): void {
  app.addHook("onRequest", async (req) => {
    if (isPublic(req.url)) return;
    req.ctx = resolveContext(req);
  });
}
