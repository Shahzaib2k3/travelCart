"use client";

import Link from "next/link";
import { BOOKING_TYPES, JOURNEY_TYPES } from "@/lib/booking-form";
import { formatDate, labelOf, money, type BookingRow } from "@/lib/labels";

export type SortState = { key: string; dir: "asc" | "desc"; onSort: (key: string) => void };

// One muted colour per booking type, reused wherever types are shown
export const TYPE_DOT: Record<string, string> = {
  PAYMENT_PLAN: "bg-[#5b6bc0]",
  PAYMENT_AWAITING: "bg-[#c47f17]",
  FULL_PAYMENT: "bg-[#2e8b63]",
  DATE_CHANGE: "bg-[#8a5fb0]",
};

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <span aria-hidden className={`h-2 w-2 rounded-full ${TYPE_DOT[type] ?? "bg-subtle"}`} />
      {labelOf(BOOKING_TYPES, type)}
    </span>
  );
}

function SortIcon({ state }: { state: "none" | "asc" | "desc" }) {
  return (
    <svg aria-hidden viewBox="0 0 10 14" className="h-3 w-2.5">
      <path d="M5 1 1.5 5h7z" className={state === "asc" ? "fill-ink" : "fill-line-strong"} />
      <path d="M5 13 1.5 9h7z" className={state === "desc" ? "fill-ink" : "fill-line-strong"} />
    </svg>
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
  const cls = `whitespace-nowrap border-b border-line bg-sunken px-4 py-3 text-xs font-medium text-muted ${right ? "text-right" : "text-left"}`;

  if (!sortKey || !sort) return <th scope="col" className={cls}>{children}</th>;

  const active = sort.key === sortKey;
  const state = active ? sort.dir : "none";
  return (
    <th scope="col" className={cls} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => sort.onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 hover:text-ink ${right ? "flex-row-reverse" : ""} ${active ? "text-ink" : ""}`}
      >
        {children}
        <SortIcon state={state} />
      </button>
    </th>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-line" role="status" aria-label="Loading bookings">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-6 px-4 py-4">
          <div className="h-3.5 w-28 animate-pulse rounded bg-line" />
          <div className="h-3.5 w-40 animate-pulse rounded bg-line" />
          <div className="hidden h-3.5 w-24 animate-pulse rounded bg-line sm:block" />
          <div className="ml-auto h-3.5 w-16 animate-pulse rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

export default function BookingsTable({
  rows, loading = false, sort, empty,
}: {
  rows: BookingRow[];
  loading?: boolean;
  sort?: SortState; // leave out for a table that is not sortable (the dashboard)
  empty?: React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="panel" aria-busy={loading}>
        {loading ? (
          <Skeleton />
        ) : (
          <div className="px-6 py-14 text-center text-sm text-muted">{empty ?? "No bookings to show."}</div>
        )}
      </div>
    );
  }

  // Financial columns appear only if the API included the figures
  const showFin = rows[0].totalSold !== undefined;
  const cell = "px-4 py-3.5 align-top";
  const num = "whitespace-nowrap px-4 py-3.5 text-right align-top tabular-nums";

  return (
    <div className="panel overflow-hidden" aria-busy={loading}>
      {/* Desktop and tablet: a real table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[56rem] text-sm">
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

          <tbody className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-line first:border-t-0 hover:bg-sunken">
                <td className={cell}>
                  <Link href={`/bookings/${b.reference}`} className="font-mono text-[13px] font-medium text-accent hover:underline">
                    {b.reference}
                  </Link>
                </td>
                <td className={cell}>
                  <div className="font-medium">{b.customerName}</div>
                  <div className="text-xs text-muted">{b.phone}</div>
                </td>
                <td className={cell}><TypeBadge type={b.bookingType} /></td>
                <td className={cell}>
                  <div className="whitespace-nowrap font-mono text-[13px] font-medium">
                    {b.departureAirport} <span className="text-subtle">to</span> {b.destinationAirport}
                  </div>
                  <div className="text-xs text-muted">
                    {formatDate(b.departureDate)}
                    {b.journeyType === "MULTI_CITY" && `, ${labelOf(JOURNEY_TYPES, b.journeyType)}`}
                  </div>
                </td>
                {showFin && <td className={num}>{money(b.totalSold)}</td>}
                {showFin && <td className={num}>{money(b.ticketCost)}</td>}
                {showFin && (
                  <td className={`${num} font-semibold ${b.profit?.startsWith("-") ? "text-danger" : ""}`}>{money(b.profit)}</td>
                )}
                <td className={cell}>
                  <div>{b.createdBy.fullName}</div>
                  <div className="text-xs text-muted">{formatDate(b.createdAt)}</div>
                </td>
                <td className={cell}>
                  <div className="flex gap-4 whitespace-nowrap">
                    <Link href={`/bookings/${b.reference}`} className="text-accent hover:underline">View</Link>
                    <Link href={`/bookings/${b.reference}/edit`} className="text-muted hover:text-ink hover:underline">Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: each booking becomes a stacked entry instead of a sideways scroll */}
      <ul className={`divide-y divide-line md:hidden ${loading ? "opacity-60" : ""}`}>
        {rows.map((b) => (
          <li key={b.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/bookings/${b.reference}`} className="font-mono text-[13px] font-medium text-accent hover:underline">
                {b.reference}
              </Link>
              <TypeBadge type={b.bookingType} />
            </div>

            <div className="mt-2 font-medium">{b.customerName}</div>
            <div className="text-xs text-muted">{b.phone}</div>

            <div className="mt-3 font-mono text-[13px] font-medium">
              {b.departureAirport} <span className="text-subtle">to</span> {b.destinationAirport}
            </div>
            <div className="text-xs text-muted">
              {formatDate(b.departureDate)}
              {b.journeyType === "MULTI_CITY" && `, ${labelOf(JOURNEY_TYPES, b.journeyType)}`}
            </div>

            {showFin && (
              <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Total sold</dt>
                  <dd className="tabular-nums">{money(b.totalSold)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Ticket cost</dt>
                  <dd className="tabular-nums">{money(b.ticketCost)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Profit</dt>
                  <dd className={`font-semibold tabular-nums ${b.profit?.startsWith("-") ? "text-danger" : ""}`}>{money(b.profit)}</dd>
                </div>
              </dl>
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs text-muted">
                Created by {b.createdBy.fullName} on {formatDate(b.createdAt)}
              </div>
              <div className="flex gap-4 whitespace-nowrap text-sm">
                <Link href={`/bookings/${b.reference}`} className="text-accent hover:underline">View</Link>
                <Link href={`/bookings/${b.reference}/edit`} className="text-muted hover:text-ink hover:underline">Edit</Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
