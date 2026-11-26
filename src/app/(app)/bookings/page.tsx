import { Suspense } from "react";
import BookingsList from "@/components/BookingsList";

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading bookings...</div>}>
      <BookingsList />
    </Suspense>
  );
}