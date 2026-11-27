"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BookingsTable from "@/components/BookingsTable";
import { Field, inputClass } from "@/components/form-ui";
import { buttonClass, Page, PageHeader } from "@/components/ui";
import { AIRLINES } from "@/lib/airlines";
import { BOOKING_TYPES, JOURNEY_TYPES } from "@/lib/booking-form";
import type { BookingRow } from "@/lib/labels";

type ListResponse = { bookings: BookingRow[]; page: number; pageSize: number; total: number; totalPages: number };
type UserOption = { id: string; fullName: string };

const PAGE_SIZES = [10, 25, 50];
const FILTER_KEYS = ["q", "bookingType", "journeyType", "airline", "departureFrom", "departureTo", "createdFrom", "createdTo", "createdBy"];
const defaultDir = (key: string) => (key === "customerName" || key === "reference" ? "asc" : "desc");

// Sorting choices for phones, where there are no column headers to click
const SORT_OPTIONS = [
  { label: "Newest first", sort: "createdAt", dir: "desc", fin: false },
  { label: "Oldest first", sort: "createdAt", dir: "asc", fin: false },
  { label: "Customer, A to Z", sort: "customerName", dir: "asc", fin: false },
  { label: "Departure, latest first", sort: "departureDate", dir: "desc", fin: false },
  { label: "Departure, earliest first", sort: "departureDate", dir: "asc", fin: false },
  { label: "Profit, high to low", sort: "profit", dir: "desc", fin: true },
  { label: "Total sold, high to low", sort: "totalSold", dir: "desc", fin: true },
];

// A text box that only writes to the URL after 400 ms of silence
function useDebouncedField(urlValue: string, commit: (value: string) => void) {
  const [text, setText] = useState(urlValue);

  // If the URL changes from outside (Clear filters, a link), follow it.
  // The trim check stops us deleting a space the user has just typed.
  useEffect(() => {
    setText((cur) => (cur.trim() === urlValue ? cur : urlValue));
  }, [urlValue]);

  useEffect(() => {
    if (text.trim() === urlValue) return;
    const timer = setTimeout(() => commit(text.trim()), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return [text, setText] as const;
}

export default function BookingsList() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const query = sp.toString();

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);

  // Everything below is read from the URL
  const get = (k: string) => sp.get(k) ?? "";
  const page = Math.max(1, Number(get("page")) || 1);
  const sortKey = get("sort") || "createdAt";
  const dir = get("dir") === "asc" ? "asc" : "desc";
  const pageSize = PAGE_SIZES.includes(Number(get("pageSize"))) ? Number(get("pageSize")) : 10;
  const hasFilters = FILTER_KEYS.some((k) => get(k));

  // Change some URL params. Any change except page itself returns to page 1.
  function setParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in patch)) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const [search, setSearch] = useDebouncedField(get("q"), (v) => setParams({ q: v || null }));
  const [airline, setAirline] = useDebouncedField(get("airline"), (v) => setParams({ airline: v || null }));

  function onSort(key: string) {
    if (key === sortKey) setParams({ sort: key, dir: dir === "asc" ? "desc" : "asc" });
    else setParams({ sort: key, dir: defaultDir(key) });
  }

  // Load the bookings whenever the URL changes. Aborting the previous
  // request means a slow old response can never overwrite a newer one.
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError("");

    const params = new URLSearchParams(query);
    params.set("pageSize", String(pageSize));

    fetch(`/api/bookings?${params}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return router.push("/login");
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Could not load bookings");
        setData(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message || "Could not load bookings");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [query, pageSize, router]);

  // Only Admins get the "Created By" filter, so only they fetch the user list
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (d) => {
        if (d.user?.role !== "ADMIN") return;
        setIsAdmin(true);
        const res = await fetch("/api/users");
        if (res.ok) setUsers((await res.json()).users);
      })
      .catch(() => {});
  }, []);

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const goTo = (p: number) => setParams({ page: p > 1 ? String(p) : null });
  const clearAll = () => router.replace(pathname, { scroll: false });

  const hasFin = !data || data.bookings.length === 0 || data.bookings[0].totalSold !== undefined;

  return (
    <Page size="wide">
      <PageHeader
        title="All Bookings"
        subtitle="Search, filter and sort every booking."
        action={<Link href="/bookings/new" className={buttonClass("primary")}>Upload New Booking</Link>}
      />

      {/* Search and filters */}
      <section className="panel mb-5 p-4 sm:p-5" aria-label="Search and filters">
        <Field label="Search" htmlFor="search">
          <input
            id="search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Booking reference, customer name, phone or email"
            className={inputClass()}
          />
        </Field>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Booking type" htmlFor="f-type">
            <select id="f-type" value={get("bookingType")} onChange={(e) => setParams({ bookingType: e.target.value || null })} className={inputClass()}>
              <option value="">All types</option>
              {BOOKING_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Journey type" htmlFor="f-journey">
            <select id="f-journey" value={get("journeyType")} onChange={(e) => setParams({ journeyType: e.target.value || null })} className={inputClass()}>
              <option value="">All journeys</option>
              {JOURNEY_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Airline" htmlFor="f-airline">
            <input id="f-airline" list="filter-airlines" value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Any airline" className={inputClass()} />
            <datalist id="filter-airlines">{AIRLINES.map((a) => <option key={a} value={a} />)}</datalist>
          </Field>
          {isAdmin && (
            <Field label="Created by" htmlFor="f-creator">
              <select id="f-creator" value={get("createdBy")} onChange={(e) => setParams({ createdBy: e.target.value || null })} className={inputClass()}>
                <option value="">All users</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </Field>
          )}

          <div className="sm:col-span-2">
            <Field label="Departure date">
              <div className="flex items-center gap-2">
                <input aria-label="Departure date from" type="date" value={get("departureFrom")}
                  onChange={(e) => setParams({ departureFrom: e.target.value || null })} className={inputClass()} />
                <span className="text-sm text-muted">to</span>
                <input aria-label="Departure date to" type="date" value={get("departureTo")} min={get("departureFrom") || undefined}
                  onChange={(e) => setParams({ departureTo: e.target.value || null })} className={inputClass()} />
              </div>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Booking creation date">
              <div className="flex items-center gap-2">
                <input aria-label="Created from" type="date" value={get("createdFrom")}
                  onChange={(e) => setParams({ createdFrom: e.target.value || null })} className={inputClass()} />
                <span className="text-sm text-muted">to</span>
                <input aria-label="Created to" type="date" value={get("createdTo")} min={get("createdFrom") || undefined}
                  onChange={(e) => setParams({ createdTo: e.target.value || null })} className={inputClass()} />
              </div>
            </Field>
          </div>

          {/* Phones have no column headers to click, so sorting is a dropdown */}
          <div className="sm:col-span-2 md:hidden">
            <Field label="Sort by" htmlFor="f-sort">
              <select
                id="f-sort"
                value={`${sortKey}:${dir}`}
                onChange={(e) => {
                  const [s, d] = e.target.value.split(":");
                  setParams({ sort: s, dir: d });
                }}
                className={inputClass()}
              >
                {SORT_OPTIONS.filter((o) => hasFin || !o.fin).map((o) => (
                  <option key={`${o.sort}:${o.dir}`} value={`${o.sort}:${o.dir}`}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-4 border-t border-line pt-3">
            <button type="button" onClick={clearAll} className="text-sm text-accent hover:underline">Clear all filters</button>
          </div>
        )}
      </section>

      {error && (
        <div role="alert" className="mb-5 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</div>
      )}

      <BookingsTable
        rows={data?.bookings ?? []}
        loading={loading}
        sort={{ key: sortKey, dir, onSort }}
        empty={
          hasFilters ? (
            <>
              No bookings match these filters.{" "}
              <button type="button" onClick={clearAll} className="text-accent hover:underline">Clear filters</button>
            </>
          ) : (
            <>
              No bookings yet.{" "}
              <Link href="/bookings/new" className="text-accent hover:underline">Upload the first booking</Link>.
            </>
          )
        }
      />

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <div aria-live="polite">
          {total === 0 ? "No bookings" : `Showing ${from} to ${to} of ${total.toLocaleString("en-GB")}`}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => setParams({ pageSize: e.target.value === "10" ? null : e.target.value })}
              className="rounded-md border border-line-strong bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15"
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => goTo(page - 1)} disabled={page <= 1 || loading} className={buttonClass("secondary", "py-1.5")}>
              Previous
            </button>
            <span className="tabular-nums">Page {page} of {totalPages}</span>
            <button type="button" onClick={() => goTo(page + 1)} disabled={page >= totalPages || loading} className={buttonClass("secondary", "py-1.5")}>
              Next
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
