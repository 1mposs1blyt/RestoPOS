import type { StaffRole, TerminalKind, UUID } from "@restopos/shared-types";

/**
 * Контекст арендатора для запроса — определяет, ЧЬИ данные видны и что разрешено.
 * organizationId — корень тенанта (подписки и тариф висят на нём), venueId —
 * фильтр практически всех выборок. Без обоих ни один защищённый эндпоинт работать
 * не должен: отсутствие venue-фильтра — это утечка между арендаторами.
 *
 * Роль (что можно сотруднику) и тариф (что оплачено организацией) — независимые
 * проверки, обе обязательны.
 */
export interface RequestContext {
  organizationId: UUID;
  venueId: UUID;
  terminalKind: TerminalKind;
  staffId: UUID | null;
  role: StaffRole | null;
}

declare module "fastify" {
  interface FastifyRequest {
    ctx: RequestContext;
  }
}
