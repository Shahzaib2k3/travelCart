import BookingForm from "@/components/BookingForm";
import { Breadcrumb, Page, PageHeader } from "@/components/ui";

export default function NewBookingPage() {
  return (
    <Page size="form">
      <Breadcrumb items={[{ label: "Bookings", href: "/bookings" }, { label: "Upload New Booking" }]} />
      <PageHeader
        title="Upload New Booking"
        subtitle="Complete each section, then save. The booking reference is generated automatically."
      />
      <BookingForm />
    </Page>
  );
}
