import Decimal from "decimal.js";
import { formatGBP } from "@/lib/booking-form";

// The shape of one row returned by GET /api/bookings and /api/dashboard
export type BookingRow = {
  id: string;
  reference: string;
  customerName: string;
  phone: string;
  email: string;
  bookingType: string;
  journeyType: string;
  airline: string;
  departureAirport: string;
  destinationAirport: string;
  departureDate: string;
  travellerCount: number;
  totalSold?: string; // missing when the role may not see financials
  ticketCost?: string;
  profit?: string;
  createdBy: { id: string; fullName: string };
  createdAt: string;
};

export const labelOf = (list: { value: string; label: string }[], value: string) =>
  list.find((o) => o.value === value)?.label ?? value;

// "1200.10" -> "£1,200.10". Decimal keeps it exact.
export const money = (s?: string) => (s === undefined ? "" : formatGBP(new Decimal(s)));

// Handles "2026-12-20" (a calendar date) and full timestamps
export function formatDate(s: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
  const d = new Date(dateOnly ? `${s}T00:00:00Z` : s);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  });
}