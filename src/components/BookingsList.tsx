"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BookingsTable from "@/components/BookingsTable";
import { Field, inputClass } from "@/components/form-ui";
import { AIRLINES } from "@/lib/airlines";
import { BOOKING_TYPES, JOURNEY_TYPES } from "@/lib/booking-form";
import type { BookingRow } from "@/lib/labels";

type ListResponse = { bookings: BookingRow[]; page: number; pageSize: number; total: number; totalPages: number };
type UserOption = { id: string; fullName: string };

const PAGE_SIZES = [10, 25, 50];
const FILTER_KEYS = ["q", "bookingType", "journeyType", "airline", "departureFrom", "departureTo", "createdFrom", "createdTo", "createdBy"];
const defaultDir = (key: string) => (key === "customerName" || key === "reference" ? "asc" : "desc");

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

    fetch(`/api/bookings?${params}`, { signal: ctrl.signal })
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

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">All Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Search, filter and sort every booking.</p>
        </div>
        <Link href="/bookings/new" className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Upload New Booking
        </Link>
      </div>

      {/* Search and filters */}
      <section className="mb-6 rounded-xl bg-white p-5 shadow">
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
          <Field label="Booking Type" htmlFor="f-type">
            <select id="f-type" value={get("bookingType")} onChange={(e) => setParams({ bookingType: e.target.value || null })} className={inputClass()}>
              <option value="">All types</option>
              {BOOKING_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Journey Type" htmlFor="f-journey">
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
            <Field label="Created By" htmlFor="f-creator">
              <select id="f-creator" value={get("createdBy")} onChange={(e) => setParams({ createdBy: e.target.value || null })} className={inputClass()}>
                <option value="">All users</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </Field>
          )}
          <Field label="Departure from" htmlFor="f-dep-from">
            <input id="f-dep-from" type="date" value={get("departureFrom")} onChange={(e) => setParams({ departureFrom: e.target.value || null })} className={inputClass()} />
          </Field>
          <Field label="Departure to" htmlFor="f-dep-to">
            <input id="f-dep-to" type="date" value={get("departureTo")} min={get("departureFrom") || undefined} onChange={(e) => setParams({ departureTo: e.target.value || null })} className={inputClass()} />
          </Field>
          <Field label="Created from" htmlFor="f-cre-from">
            <input id="f-cre-from" type="date" value={get("createdFrom")} onChange={(e) => setParams({ createdFrom: e.target.value || null })} className={inputClass()} />
          </Field>
          <Field label="Created to" htmlFor="f-cre-to">
            <input id="f-cre-to" type="date" value={get("createdTo")} min={get("createdFrom") || undefined} onChange={(e) => setParams({ createdTo: e.target.value || null })} className={inputClass()} />
          </Field>
        </div>

        {hasFilters && (
          <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="mt-4 text-sm text-blue-600 hover:underline">
            Clear all filters
          </button>
        )}
      </section>

      {error && <div role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <BookingsTable
        rows={data?.bookings ?? []}
        loading={loading}
        sort={{ key: sortKey, dir, onSort }}
        empty={
          hasFilters ? (
            <>
              No bookings match these filters.{" "}
              <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="text-blue-600 hover:underline">
                Clear filters
              </button>
            </>
          ) : (
            <>
              No bookings yet.{" "}
              <Link href="/bookings/new" className="text-blue-600 hover:underline">Upload the first booking</Link>.
            </>
          )
        }
      />

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div aria-live="polite">{total === 0 ? "No bookings" : `Showing ${from}-${to} of ${total.toLocaleString("en-GB")}`}</div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => setParams({ pageSize: e.target.value === "10" ? null : e.target.value })}
              className="rounded border border-slate-300 p-1.5"
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => goTo(page - 1)} disabled={page <= 1 || loading}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40">
              Previous
            </button>
            <span className="tabular-nums">Page {page} of {totalPages}</span>
            <button type="button" onClick={() => goTo(page + 1)} disabled={page >= totalPages || loading}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}