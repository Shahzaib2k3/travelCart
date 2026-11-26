"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

// TEMPORARY: replaced by the real details page in Phase 8
export default function TempBookingPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/bookings/${ref}`).then(async (r) => {
      const d = await r.json();
      if (r.ok) setData(d.booking);
      else setError(d.error ?? "Could not load booking");
    });
  }, [ref]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold text-slate-800">Booking {ref}</h1>
      <p className="mb-4 text-sm text-slate-500">Temporary page: the saved record exactly as the database returned it.</p>
      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {data !== null && (
        <pre className="overflow-x-auto rounded-xl bg-white p-4 text-xs shadow">{JSON.stringify(data, null, 2)}</pre>
      )}
      <Link href="/bookings/new" className="mt-4 inline-block text-blue-600 hover:underline">Create another booking</Link>
    </div>
  );
}