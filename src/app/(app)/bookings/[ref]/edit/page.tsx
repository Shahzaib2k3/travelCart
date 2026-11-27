"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingForm from "@/components/BookingForm";
import { Breadcrumb, buttonClass, EmptyState, Page, PageHeader } from "@/components/ui";
import { bookingToFormValues, type BookingDetail } from "@/lib/booking-form";

export default function EditBookingPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    setBooking(null); // show the loading state instead of stale data
    setError("");

    fetch(`/api/bookings/${ref}`, { signal: ctrl.signal, cache: "no-store" })
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
      <Page size="narrow">
        <div className="panel">
          <EmptyState
            title="Cannot edit this booking"
            action={<Link href="/bookings" className={buttonClass("secondary")}>Back to All Bookings</Link>}
          >
            {error}
          </EmptyState>
        </div>
      </Page>
    );
  }

  if (!booking || !initial) {
    return (
      <Page size="form">
        <div role="status" aria-label="Loading booking" className="space-y-4">
          <div className="h-4 w-48 animate-pulse rounded bg-line" />
          <div className="h-8 w-56 animate-pulse rounded bg-line" />
          <div className="panel mt-8 h-96 animate-pulse bg-sunken" />
        </div>
      </Page>
    );
  }

  return (
    <Page size="form">
      <Breadcrumb
        items={[
          { label: "Bookings", href: "/bookings" },
          { label: booking.reference, href: `/bookings/${booking.reference}`, mono: true },
          { label: "Edit" },
        ]}
      />
      <PageHeader
        title="Edit Booking"
        subtitle={`Changes are saved against ${booking.reference}. The reference never changes, and profit is recalculated automatically.`}
      />
      <BookingForm
        key={`${booking.id}-${booking.updatedAt}`}
        initial={initial}
        bookingId={booking.id}
        reference={booking.reference}
      />
    </Page>
  );
}
