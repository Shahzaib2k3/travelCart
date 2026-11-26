"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingsTable from "@/components/BookingsTable";
import { BOOKING_TYPES } from "@/lib/booking-form";
import { money, type BookingRow } from "@/lib/labels";

type DashboardData = {
  counts: { total: number; byType: Record<string, number> };
  financials?: { totalSold: string; ticketCost: string; profit: string };
  recent: BookingRow[];
};

function StatCard({
  label, value, href, tone = "text-slate-900",
}: {
  label: string;
  value: string;
  href?: string;
  tone?: string;
}) {
  const body = (
    <>
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
    </>
  );
  const cls = "rounded-xl bg-white p-5 shadow";
  return href ? (
    <Link href={href} className={`${cls} block transition hover:ring-2 hover:ring-blue-200`}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (res) => {
        if (res.status === 401) return router.push("/login");
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Could not load the dashboard");
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [router]);

  const dash = (n: number | undefined) => (n === undefined ? "-" : n.toLocaleString("en-GB"));
  const profitNegative = data?.financials?.profit.startsWith("-");

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Live figures from every booking in the system.</p>
        </div>
        <Link href="/bookings/new" className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Upload New Booking
        </Link>
      </div>

      {error && <div role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Booking counts. Each card opens the list already filtered. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Bookings" value={dash(data?.counts.total)} href="/bookings" />
        {BOOKING_TYPES.map((t) => (
          <StatCard key={t.value} label={t.label} value={dash(data?.counts.byType[t.value])} href={`/bookings?bookingType=${t.value}`} />
        ))}
      </div>

      {/* Money. Present only if the API sent financials. */}
      {(data === null || data.financials) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Sales (Total Sold)" value={data ? money(data.financials?.totalSold) : "-"} />
          <StatCard label="Total Supplier Costs (Ticket Cost)" value={data ? money(data.financials?.ticketCost) : "-"} />
          <StatCard
            label="Total Booking Profit"
            value={data ? money(data.financials?.profit) : "-"}
            tone={profitNegative ? "text-red-600" : "text-green-700"}
          />
        </div>
      )}

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Recently created bookings</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(search.trim() ? `/bookings?q=${encodeURIComponent(search.trim())}` : "/bookings");
            }}
            className="flex gap-2"
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a booking"
              aria-label="Find a booking by reference, customer, phone or email"
              className="w-56 rounded border border-slate-300 p-2 text-sm"
            />
            <button className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">Search</button>
          </form>
        </div>

        <BookingsTable
          rows={data?.recent ?? []}
          loading={data === null && !error}
          empty={
            <>
              No bookings yet.{" "}
              <Link href="/bookings/new" className="text-blue-600 hover:underline">Upload the first booking</Link>.
            </>
          }
        />

        <div className="mt-3 text-right">
          <Link href="/bookings" className="text-sm text-blue-600 hover:underline">View all bookings</Link>
        </div>
      </section>
    </div>
  );
}