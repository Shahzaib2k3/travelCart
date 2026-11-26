"use client";

import Link from "next/link";
import { BOOKING_TYPES, JOURNEY_TYPES } from "@/lib/booking-form";
import { formatDate, labelOf, money, type BookingRow } from "@/lib/labels";

export type SortState = { key: string; dir: "asc" | "desc"; onSort: (key: string) => void };

const typeStyles: Record<string, string> = {
  PAYMENT_PLAN: "bg-violet-100 text-violet-800",
  PAYMENT_AWAITING: "bg-amber-100 text-amber-800",
  FULL_PAYMENT: "bg-green-100 text-green-800",
  DATE_CHANGE: "bg-sky-100 text-sky-800",
};

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[type] ?? "bg-slate-100 text-slate-700"}`}>
      {labelOf(BOOKING_TYPES, type)}
    </span>
  );
}

function Th({
  children, sortKey, sort, right,
}: {
  children: React.ReactNode;
  sortKey?: string;
  sort?: SortState;
  right?: boolean;
}) {
  const cls = `whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 ${right ? "text-right" : "text-left"}`;

  if (!sortKey || !sort) return <th scope="col" className={cls}>{children}</th>;

  const active = sort.key === sortKey;
  return (
    <th scope="col" className={cls} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => sort.onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-slate-900">
        {children}
        <span aria-hidden="true" className={active ? "text-blue-600" : "text-slate-300"}>
          {active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

export default function BookingsTable({
  rows, loading = false, sort, empty,
}: {
  rows: BookingRow[];
  loading?: boolean;
  sort?: SortState; // omit for a table that isn't sortable (the dashboard)
  empty?: React.ReactNode;
}) {
  // Financial columns appear only if the API included the figures
  const showFin = rows.length === 0 || rows[0].totalSold !== undefined;
  const cols = showFin ? 9 : 6;
  const num = "whitespace-nowrap px-4 py-3 text-right tabular-nums";
  const cell = "px-4 py-3 align-top";

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow" aria-busy={loading}>
      <table className="w-full min-w-[60rem] text-sm">
        <thead>
          <tr>
            <Th sortKey="reference" sort={sort}>Booking Ref</Th>
            <Th sortKey="customerName" sort={sort}>Customer / Phone</Th>
            <Th>Booking Type</Th>
            <Th sortKey="departureDate" sort={sort}>Departure / Destination</Th>
            {showFin && <Th sortKey="totalSold" sort={sort} right>Total Sold</Th>}
            {showFin && <Th right>Ticket Cost</Th>}
            {showFin && <Th sortKey="profit" sort={sort} right>Profit</Th>}
            <Th sortKey="createdAt" sort={sort}>Created By / Date</Th>
            <Th>Action</Th>
          </tr>
        </thead>

        <tbody className={loading && rows.length > 0 ? "opacity-60 transition-opacity" : ""}>
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols} className="px-4 py-12 text-center text-slate-500">
                {loading ? "Loading bookings..." : (empty ?? "No bookings to show.")}
              </td>
            </tr>
          )}

          {rows.map((b) => (
            <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className={cell}>
                <Link href={`/bookings/${b.reference}`} className="font-mono text-[13px] font-medium text-blue-600 hover:underline">
                  {b.reference}
                </Link>
              </td>
              <td className={cell}>
                <div className="font-medium text-slate-800">{b.customerName}</div>
                <div className="text-xs text-slate-500">{b.phone}</div>
              </td>
              <td className={cell}><TypeBadge type={b.bookingType} /></td>
              <td className={cell}>
                <div className="whitespace-nowrap font-medium text-slate-800">
                  {b.departureAirport} → {b.destinationAirport}
                </div>
                <div className="text-xs text-slate-500">
                  {formatDate(b.departureDate)}
                  {b.journeyType === "MULTI_CITY" && ` · ${labelOf(JOURNEY_TYPES, b.journeyType)}`}
                </div>
              </td>
              {showFin && <td className={num}>{money(b.totalSold)}</td>}
              {showFin && <td className={num}>{money(b.ticketCost)}</td>}
              {showFin && (
                <td className={`${num} font-medium ${b.profit?.startsWith("-") ? "text-red-600" : "text-green-700"}`}>
                  {money(b.profit)}
                </td>
              )}
              <td className={cell}>
                <div className="text-slate-800">{b.createdBy.fullName}</div>
                <div className="text-xs text-slate-500">{formatDate(b.createdAt)}</div>
              </td>
              <td className={cell}>
                <div className="flex gap-3 whitespace-nowrap">
                  <Link href={`/bookings/${b.reference}`} className="text-blue-600 hover:underline">View</Link>
                  <Link href={`/bookings/${b.reference}/edit`} className="text-slate-600 hover:underline">Edit</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}