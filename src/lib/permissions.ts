import type { Role } from "@prisma/client";

// Every role permission in one place. To hide financials from Agents in the
// future, set AGENT.viewFinancials to false. The API strips the fields.
const rules = {
  ADMIN: { viewFinancials: true, editBooking: true, deleteBooking: true, filterByCreator: true },
  AGENT: { viewFinancials: true, editBooking: true, deleteBooking: false, filterByCreator: false },
} as const;

export type Action = keyof typeof rules.ADMIN;

export function can(role: Role, action: Action): boolean {
  return rules[role][action];
}