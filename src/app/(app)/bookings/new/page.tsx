import BookingForm from "@/components/BookingForm";

export default function NewBookingPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold text-slate-800">Upload New Booking</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        Complete each section, then save. The booking reference is generated automatically.
      </p>
      <BookingForm />
    </div>
  );
}