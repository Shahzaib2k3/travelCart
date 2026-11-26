"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Role } from "@prisma/client";
import ConfirmDialog from "@/components/ConfirmDialog";
import { TypeBadge } from "@/components/BookingsTable";
import { Section } from "@/components/form-ui";
import { airportByCode } from "@/lib/airports";
import {
  CABIN_CLASSES, JOURNEY_TYPES, PASSENGER_INFO, PASSENGER_TYPES, PAYMENT_METHODS, TITLES,
  travellerLabel, type BookingDetail,
} from "@/lib/booking-form";
import { can } from "@/lib/permissions";
import { formatDate, labelOf, money } from "@/lib/labels";

type LoadState = "loading" | "ready" | "notfound" | "error";

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{children}</dd>
    </div>
  );
}

const grid = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

const airportText = (code: string) => {
  const a = airportByCode(code);
  return a ? `${a.code} - ${a.name}, ${a.city}` : code;
};

const formatDateTime = (s: string) =>
  new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function BookingDetailsPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setState("loading");

    Promise.all([
      fetch(`/api/bookings/${ref}`, { signal: ctrl.signal }),
      fetch("/api/auth/me", { signal: ctrl.signal }),
    ])
      .then(async ([bookingRes, meRes]) => {
        if (bookingRes.status === 401 || meRes.status === 401) return router.push("/login");
        if (bookingRes.status === 404) return setState("notfound");
        if (!bookingRes.ok) return setState("error");

        setBooking((await bookingRes.json()).booking);
        setRole((await meRes.json()).user?.role ?? null);
        setState("ready");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setState("error");
      });

    return () => ctrl.abort();
  }, [ref, router]);

  async function remove() {
    if (!booking || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Booking ${booking.reference} deleted`);
        router.push("/bookings");
        return; // stay in the "deleting" state while we leave the page
      }
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Could not delete the booking");
    } catch {
      toast.error("Network problem. Please try again.");
    }
    setDeleting(false);
    setConfirmOpen(false);
  }

  // ----- non-ready states -----
  if (state === "loading") return <div className="p-6 text-slate-500">Loading booking...</div>;

  if (state === "notfound" || state === "error" || !booking) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-semibold text-slate-800">
            {state === "notfound" ? "Booking not found" : "Could not load this booking"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {state === "notfound"
              ? `There is no booking with the reference ${ref}. It may have been deleted.`
              : "Something went wrong. Please try again."}
          </p>
          <Link href="/bookings" className="mt-4 inline-block text-blue-600 hover:underline">Back to All Bookings</Link>
        </div>
      </div>
    );
  }

  // ----- ready -----
  const b = booking;
  const multi = b.journeyType === "MULTI_CITY";
  const hasFinancials = b.totalSold !== undefined;
  const profitNegative = b.profit?.startsWith("-");

  const passengerSummary = PASSENGER_TYPES
    .map((t) => ({ t, n: b.travellers.filter((x) => x.passengerType === t).length }))
    .filter((x) => x.n > 0)
    .map((x) => `${x.n} ${PASSENGER_INFO[x.t].label}${x.n > 1 ? "s" : ""}`)
    .join(", ");

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header and actions */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/bookings" className="text-sm text-blue-600 hover:underline">← Back to All Bookings</Link>
          <h1 className="mt-2 font-mono text-2xl font-semibold text-slate-800">{b.reference}</h1>
          <div className="mt-2"><TypeBadge type={b.bookingType} /></div>
        </div>

        <div className="flex gap-3">
          {role && can(role, "editBooking") && (
            <Link href={`/bookings/${b.reference}/edit`} className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
              Edit Booking
            </Link>
          )}
          {role && can(role, "deleteBooking") && (
            <button type="button" onClick={() => setConfirmOpen(true)}
              className="rounded border border-red-300 bg-white px-4 py-2 font-medium text-red-700 hover:bg-red-50">
              Delete Booking
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Section title="Booking Overview">
          <dl className={grid}>
            <Item label="Booking Ref"><span className="font-mono">{b.reference}</span></Item>
            <Item label="Booking Type"><TypeBadge type={b.bookingType} /></Item>
            <Item label="Created Date">{formatDateTime(b.createdAt)}</Item>
            <Item label="Created By">{b.createdBy.fullName}</Item>
            <Item label="Last Updated Date">{formatDateTime(b.updatedAt)}</Item>
            <Item label="Last Updated By">{b.updatedBy.fullName}</Item>
          </dl>
        </Section>

        <Section title="Customer Information">
          <dl className={grid}>
            <Item label="Customer Name">{b.customerName}</Item>
            <Item label="Phone">{b.phone}</Item>
            <Item label="Email"><span className="break-all">{b.email}</span></Item>
          </dl>
        </Section>

        <Section title="Journey Information">
          <dl className={grid}>
            <Item label="Journey Type">{labelOf(JOURNEY_TYPES, b.journeyType)}</Item>
            <Item label="Airline">{b.airline}</Item>
          </dl>

          {multi ? (
            <ol className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
              {b.segments.map((s, i) => (
                <li key={s.id} className="grid gap-1 p-3 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                  <span className="text-xs font-medium text-slate-500">Flight {i + 1}</span>
                  <span className="text-slate-800">{airportText(s.departureAirport)} → {airportText(s.destinationAirport)}</span>
                  <span className="text-sm text-slate-600">{formatDate(s.departureDate)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <dl className={`${grid} mt-4`}>
              <Item label="Departure Airport">{airportText(b.departureAirport)}</Item>
              <Item label="Destination Airport">{airportText(b.destinationAirport)}</Item>
              <Item label="Departure Date">{formatDate(b.departureDate)}</Item>
              {b.journeyType === "RETURN" && b.returnDate && <Item label="Return Date">{formatDate(b.returnDate)}</Item>}
            </dl>
          )}
        </Section>

        <Section title="Traveller Information">
          <dl className={grid}>
            <Item label="Total Travellers">{b.travellers.length}</Item>
            <Item label="Cabin Class">{labelOf(CABIN_CLASSES, b.cabinClass)}</Item>
            <Item label="Passengers">{passengerSummary}</Item>
          </dl>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                  <th scope="col" className="px-4 py-2.5">Passenger</th>
                  <th scope="col" className="px-4 py-2.5">Name</th>
                  <th scope="col" className="px-4 py-2.5">Date of Birth</th>
                </tr>
              </thead>
              <tbody>
                {b.travellers.map((t, i) => (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{travellerLabel(b.travellers, i)}</div>
                      <div className="text-xs text-slate-500">{PASSENGER_INFO[t.passengerType].age}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      {[labelOf(TITLES, t.title), t.firstName, t.middleName, t.lastName].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-4 py-2.5">{formatDate(t.dateOfBirth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {hasFinancials && (
          <Section title="Financial Information">
            <dl className={grid}>
              <Item label="Total Sold"><span className="tabular-nums">{money(b.totalSold)}</span></Item>
              <Item label="Ticket Cost (Supplier)"><span className="tabular-nums">{money(b.ticketCost)}</span></Item>
              <Item label="Booking Profit">
                <span className={`font-semibold tabular-nums ${profitNegative ? "text-red-600" : "text-green-700"}`}>
                  {money(b.profit)}
                </span>
              </Item>
            </dl>
            <p className="mt-3 text-xs text-slate-500">Profit is calculated automatically: Total Sold minus Ticket Cost.</p>
          </Section>
        )}

        <Section title="Payment Information">
          <dl className={grid}>
            <Item label="Payment Method">{labelOf(PAYMENT_METHODS, b.paymentMethod)}</Item>
          </dl>
        </Section>

        <Section title="Flight Details / Notes">
          {b.notes ? (
            <p className="whitespace-pre-wrap text-slate-800">{b.notes}</p>
          ) : (
            <p className="text-slate-500">No notes were saved for this booking.</p>
          )}
        </Section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete booking ${b.reference}?`}
        confirmLabel="Delete booking"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>
          This booking for <strong>{b.customerName}</strong> will disappear from the dashboard, the booking list and
          search for everyone. The reference is never reused.
        </p>
      </ConfirmDialog>
    </div>
  );
}