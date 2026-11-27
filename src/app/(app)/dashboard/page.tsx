"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingsTable, { TYPE_DOT } from "@/components/BookingsTable";
import { inputClass } from "@/components/form-ui";
import { buttonClass, Page, PageHeader } from "@/components/ui";
import { BOOKING_TYPES } from "@/lib/booking-form";
import { money, type BookingRow } from "@/lib/labels";

type DashboardData = {
  counts: { total: number; byType: Record<string, number> };
  financials?: { totalSold: string; ticketCost: string; profit: string };
  recent: BookingRow[];
};

function Metric({ label, value, strong, negative }: { label: string; value: string; strong?: boolean; negative?: boolean }) {
  return (
    <div className={`px-6 py-5 ${strong ? "bg-sunken" : ""}`}>
      <p className="text-[13px] text-muted">{label}</p>
      <p className={`mt-1.5 text-2xl tabular-nums ${strong ? "font-semibold" : "font-medium"} ${negative ? "text-danger" : ""}`}>{value}</p>
    </div>
  );
}

const cellLink = "block px-5 py-4 transition-colors hover:bg-sunken";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return router.push("/login");
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Could not load the dashboard");
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [router]);

  const num = (n: number | undefined) => (n === undefined ? "-" : n.toLocaleString("en-GB"));

  return (
    <Page size="wide">
      <PageHeader
        title="Dashboard"
        subtitle="Live figures from every booking in the system."
        action={<Link href="/bookings/new" className={buttonClass("primary")}>Upload New Booking</Link>}
      />

      {error && (
        <div role="alert" className="mb-6 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</div>
      )}

      {/* Money. Shown only when the API sends financial figures for this role. */}
      {(data === null || data.financials) && (
        <section aria-label="Financial summary" className="panel grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Metric label="Total Sales (Total Sold)" value={data ? money(data.financials?.totalSold) : "-"} />
          <Metric label="Total Supplier Costs (Ticket Cost)" value={data ? money(data.financials?.ticketCost) : "-"} />
          <Metric
            label="Total Booking Profit"
            value={data ? money(data.financials?.profit) : "-"}
            strong
            negative={data?.financials?.profit.startsWith("-")}
          />
        </section>
      )}

      {/* Counts. Each one opens the list already filtered. */}
      <section aria-label="Bookings by type" className="mt-6">
        <div className="panel grid divide-y divide-line sm:grid-cols-5 sm:divide-x sm:divide-y-0">
          <Link href="/bookings" className={cellLink}>
            <p className="text-[13px] text-muted">Total Bookings</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{num(data?.counts.total)}</p>
          </Link>
          {BOOKING_TYPES.map((t) => (
            <Link key={t.value} href={`/bookings?bookingType=${t.value}`} className={cellLink}>
              <p className="flex items-center gap-2 text-[13px] text-muted">
                <span aria-hidden className={`h-2 w-2 rounded-full ${TYPE_DOT[t.value]}`} />
                {t.label}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{num(data?.counts.byType[t.value])}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Recently created bookings</h2>
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
              className={`${inputClass()} w-56`}
            />
            <button className={buttonClass("secondary")}>Search</button>
          </form>
        </div>

        <BookingsTable
          rows={data?.recent ?? []}
          loading={data === null && !error}
          empty={
            <>
              No bookings yet.{" "}
              <Link href="/bookings/new" className="text-accent hover:underline">Upload the first booking</Link>.
            </>
          }
        />

        <div className="mt-3 text-right">
          <Link href="/bookings" className="text-sm text-accent hover:underline">View all bookings</Link>
        </div>
      </section>
    </Page>
  );
}
