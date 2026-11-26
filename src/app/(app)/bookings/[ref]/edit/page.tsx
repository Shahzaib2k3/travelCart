"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingForm from "@/components/BookingForm";
import { bookingToFormValues, type BookingDetail } from "@/lib/booking-form";

export default function EditBookingPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();

    fetch(`/api/bookings/${ref}`, { signal: ctrl.signal })
      .then(async (res) => {
        if (res.status === 401) return router.push("/login");
        const d = await res.json();
        if (!res.ok) throw new Error(res.status === 404 ? "This booking does not exist or was deleted." : (d.error ?? "Could not load the booking"));
        setBooking(d.booking);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });

    return () => ctrl.abort();
  }, [ref, router]);

  // The form only reads `initial` once, so build it once
  const initial = useMemo(() => (booking ? bookingToFormValues(booking) : null), [booking]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-xl font-semibold text-slate-800">Cannot edit this booking</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link href="/bookings" className="mt-4 inline-block text-blue-600 hover:underline">Back to All Bookings</Link>
        </div>
      </div>
    );
  }

  if (!booking || !initial) return <div className="p-6 text-slate-500">Loading booking...</div>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link href={`/bookings/${booking.reference}`} className="text-sm text-blue-600 hover:underline">
        ← Back to booking
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-800">Edit Booking</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        Changes are saved against <span className="font-mono">{booking.reference}</span>. The reference never changes, and
        profit is recalculated automatically.
      </p>
      <BookingForm key={booking.id} initial={initial} bookingId={booking.id} reference={booking.reference} />
    </div>
  );
}