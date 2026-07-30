import type {
  ISODateString,
  Money,
  StaffRole,
  TerminalKind,
  UUID,
} from "./common";

export interface Venue {
  id: UUID;
  organizationId: UUID;
  name: string;
  address: string | null;
}

export interface Terminal {
  id: UUID;
  venueId: UUID;
  kind: TerminalKind;
  label: string | null;
}

/**
 * Сотрудник привязан к организации, а не к заведению, — он может работать
 * на нескольких точках. `pin_code_hash` на клиент не отдаётся никогда.
 */
export interface Staff {
  id: UUID;
  organizationId: UUID;
  fullName: string;
  role: StaffRole;
}

export interface Shift {
  id: UUID;
  venueId: UUID;
  openedBy: UUID;
  openedAt: ISODateString;
  closedAt: ISODateString | null;
  cashStart: Money | null;
  cashEnd: Money | null;
}
