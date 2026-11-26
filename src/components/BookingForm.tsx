"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AirportInput from "@/components/AirportInput";
import { Field, Section, inputClass } from "@/components/form-ui";
import { AIRLINES } from "@/lib/airlines";
import {
  BOOKING_TYPES, JOURNEY_TYPES, CABIN_CLASSES, PAYMENT_METHODS, TITLES,
  PASSENGER_TYPES, PASSENGER_INFO, MAX_TRAVELLERS, MAX_SEGMENTS,
  emptyValues, syncTravellers, travellerLabel, totalTravellers,
  previewProfit, formatGBP, validate, buildPayload, todayISO,
  type BookingFormValues, type PassengerType, type TravellerForm, type SegmentForm,
} from "@/lib/booking-form";

type Errors = Record<string, string>;

type Props = {
  initial?: BookingFormValues; // Edit page passes the saved booking
  bookingId?: string; // present => we are editing (PUT), absent => creating (POST)
  reference?: string; // shown read-only on the edit page
};

export default function BookingForm({ initial, bookingId, reference }: Props) {
  const router = useRouter();
  const editing = Boolean(bookingId);

  const [v, setValues] = useState<BookingFormValues>(() => initial ?? emptyValues());
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false); // blocks a second click instantly
  const [idempotencyKey] = useState(() => crypto.randomUUID()); // one per form session

  const today = todayISO();
  const total = totalTravellers(v.counts);
  const profit = previewProfit(v.totalSold, v.ticketCost);

  // ---------- small state helpers ----------
  const clearErrors = (...keys: string[]) =>
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const dropErrors = (prefix: string) =>
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(prefix))));

  function update<K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) {
    setValues((cur) => ({ ...cur, [key]: value }));
    clearErrors(key as string);
  }

  function changeCount(type: PassengerType, delta: number) {
    setValues((cur) => {
      if (delta > 0 && totalTravellers(cur.counts) >= MAX_TRAVELLERS) return cur;
      const counts = { ...cur.counts, [type]: Math.min(9, Math.max(0, cur.counts[type] + delta)) };
      return { ...cur, counts, travellers: syncTravellers(cur.travellers, counts) };
    });
    dropErrors("travellers"); // indexes may have shifted
  }

  function updateTraveller(i: number, patch: Partial<TravellerForm>) {
    setValues((cur) => ({
      ...cur,
      travellers: cur.travellers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));
    clearErrors(...Object.keys(patch).map((k) => `travellers.${i}.${k}`));
  }

  function updateSegment(i: number, patch: Partial<SegmentForm>) {
    setValues((cur) => ({
      ...cur,
      segments: cur.segments.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
    clearErrors(...Object.keys(patch).map((k) => `segments.${i}.${k}`));
  }

  function addSegment() {
    setValues((cur) => {
      if (cur.segments.length >= MAX_SEGMENTS) return cur;
      const last = cur.segments[cur.segments.length - 1];
      // convenience: the next flight usually leaves from where the last one landed
      return {
        ...cur,
        segments: [...cur.segments, { departureAirport: last?.destinationAirport ?? "", destinationAirport: "", departureDate: "" }],
      };
    });
    clearErrors("segments");
  }

  function removeSegment(i: number) {
    setValues((cur) => (cur.segments.length <= 2 ? cur : { ...cur, segments: cur.segments.filter((_, idx) => idx !== i) }));
    dropErrors("segments");
  }

  function focusFirstError() {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
    }, 50);
  }

  const invalid = (key: string) => (errors[key] ? true : undefined);

  // ---------- submit ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return; // ignore double clicks

    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Please fix the highlighted fields");
      focusFirstError();
      return;
    }

    submitting.current = true;
    setSaving(true);

    try {
      const res = await fetch(editing ? `/api/bookings/${bookingId}` : "/api/bookings", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(v, editing ? undefined : idempotencyKey)),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(editing ? "Booking updated" : `Booking ${data.booking.reference} saved`);
        router.push(`/bookings/${data.booking.reference}`);
        return; // leave the button disabled while we redirect
      }

      if (res.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        router.push("/login");
        return;
      }

      if (res.status === 400 && Array.isArray(data.issues)) {
        // The server's field paths match ours, so errors land on the right inputs
        const mapped: Errors = {};
        for (const issue of data.issues) if (!mapped[issue.path]) mapped[issue.path] = issue.message;
        setErrors(mapped);
        toast.error(data.error ?? "Some details need fixing");
        focusFirstError();
      } else {
        toast.error(data.error ?? "Could not save the booking. Please try again.");
      }
    } catch {
      toast.error("Network problem. Check your connection and try again.");
    }

    submitting.current = false;
    setSaving(false);
  }

  // ---------- UI ----------
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* A. Booking & customer */}
      <Section title="A. Booking & Customer Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Booking Reference" htmlFor="reference" hint="Created by the system when you save. It cannot be edited.">
            <input
              id="reference"
              disabled
              value={reference ?? "Assigned automatically on save"}
              className="w-full rounded border border-slate-200 bg-slate-100 p-2.5 text-slate-500"
            />
          </Field>
          <Field label="Customer Name" htmlFor="customerName" required error={errors.customerName}>
            <input id="customerName" value={v.customerName} aria-invalid={invalid("customerName")}
              onChange={(e) => update("customerName", e.target.value)} className={inputClass(errors.customerName)} />
          </Field>
          <Field label="Phone" htmlFor="phone" required error={errors.phone}>
            <input id="phone" type="tel" value={v.phone} aria-invalid={invalid("phone")} placeholder="+44 7700 900123"
              onChange={(e) => update("phone", e.target.value)} className={inputClass(errors.phone)} />
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email}>
            <input id="email" type="email" value={v.email} aria-invalid={invalid("email")}
              onChange={(e) => update("email", e.target.value)} className={inputClass(errors.email)} />
          </Field>
        </div>
      </Section>

      {/* B. Booking type */}
      <Section title="B. Booking Type">
        <div className="max-w-sm">
          <Field label="Booking Type" htmlFor="bookingType" required error={errors.bookingType}>
            <select id="bookingType" value={v.bookingType} aria-invalid={invalid("bookingType")}
              onChange={(e) => update("bookingType", e.target.value)} className={inputClass(errors.bookingType)}>
              <option value="">Select booking type</option>
              {BOOKING_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* C. Journey type */}
      <Section title="C. Journey Type">
        <div className="max-w-sm">
          <Field label="Journey Type" htmlFor="journeyType" required error={errors.journeyType}>
            <select
              id="journeyType"
              value={v.journeyType}
              aria-invalid={invalid("journeyType")}
              onChange={(e) => {
                update("journeyType", e.target.value);
                clearErrors("departureAirport", "destinationAirport", "departureDate", "returnDate", "segments");
              }}
              className={inputClass(errors.journeyType)}
            >
              <option value="">Select journey type</option>
              {JOURNEY_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* D. Travellers & cabin class */}
      <Section title="D. Travellers & Cabin Class" description="The number of travellers decides how many traveller forms appear below.">
        <div className="mb-5 max-w-sm">
          <Field label="Cabin Class" htmlFor="cabinClass" required error={errors.cabinClass}>
            <select id="cabinClass" value={v.cabinClass} aria-invalid={invalid("cabinClass")}
              onChange={(e) => update("cabinClass", e.target.value)} className={inputClass(errors.cabinClass)}>
              {CABIN_CLASSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {PASSENGER_TYPES.map((type) => (
            <div key={type} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium text-slate-800">{PASSENGER_INFO[type].label}</div>
                <div className="text-xs text-slate-500">{PASSENGER_INFO[type].age}</div>
              </div>
              <div className="flex items-center gap-3">
                {/* type="button" matters: inside a <form>, buttons submit by default */}
                <button type="button" aria-label={`Remove one ${PASSENGER_INFO[type].label}`}
                  onClick={() => changeCount(type, -1)} disabled={v.counts[type] === 0}
                  className="h-9 w-9 rounded border border-slate-300 text-lg hover:bg-slate-50 disabled:opacity-40">-</button>
                <span className="w-6 text-center tabular-nums">{v.counts[type]}</span>
                <button type="button" aria-label={`Add one ${PASSENGER_INFO[type].label}`}
                  onClick={() => changeCount(type, 1)} disabled={total >= MAX_TRAVELLERS || v.counts[type] >= 9}
                  className="h-9 w-9 rounded border border-slate-300 text-lg hover:bg-slate-50 disabled:opacity-40">+</button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Total travellers: <strong>{total}</strong>
        </p>
        {errors.travellers && <p className="mt-1 text-xs text-red-600">{errors.travellers}</p>}
      </Section>

      {/* E. Traveller information */}
      {v.travellers.length > 0 && (
        <Section title="E. Traveller Information" description="One form per traveller. Each is saved separately and linked to this booking.">
          <div className="space-y-4">
            {v.travellers.map((t, i) => {
              const p = `travellers.${i}`;
              return (
                <div key={`${t.passengerType}-${i}`} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <h3 className="font-medium text-slate-800">{travellerLabel(v.travellers, i)}</h3>
                    <span className="text-xs text-slate-500">{PASSENGER_INFO[t.passengerType].age}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Title" htmlFor={`${p}.title`} required error={errors[`${p}.title`]}>
                      <select id={`${p}.title`} value={t.title} aria-invalid={invalid(`${p}.title`)}
                        onChange={(e) => updateTraveller(i, { title: e.target.value })} className={inputClass(errors[`${p}.title`])}>
                        <option value="">Select</option>
                        {TITLES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </Field>
                    <Field label="First Name" htmlFor={`${p}.firstName`} required error={errors[`${p}.firstName`]}>
                      <input id={`${p}.firstName`} value={t.firstName} aria-invalid={invalid(`${p}.firstName`)}
                        onChange={(e) => updateTraveller(i, { firstName: e.target.value })} className={inputClass(errors[`${p}.firstName`])} />
                    </Field>
                    <Field label="Middle Name" htmlFor={`${p}.middleName`}>
                      <input id={`${p}.middleName`} value={t.middleName}
                        onChange={(e) => updateTraveller(i, { middleName: e.target.value })} className={inputClass()} />
                    </Field>
                    <Field label="Last Name" htmlFor={`${p}.lastName`} required error={errors[`${p}.lastName`]}>
                      <input id={`${p}.lastName`} value={t.lastName} aria-invalid={invalid(`${p}.lastName`)}
                        onChange={(e) => updateTraveller(i, { lastName: e.target.value })} className={inputClass(errors[`${p}.lastName`])} />
                    </Field>
                    <Field label="Date of Birth" htmlFor={`${p}.dateOfBirth`} required error={errors[`${p}.dateOfBirth`]}>
                      <input id={`${p}.dateOfBirth`} type="date" max={today} value={t.dateOfBirth}
                        aria-invalid={invalid(`${p}.dateOfBirth`)}
                        onChange={(e) => updateTraveller(i, { dateOfBirth: e.target.value })} className={inputClass(errors[`${p}.dateOfBirth`])} />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* F. Flight information */}
      <Section title="F. Flight Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Airline" htmlFor="airline" required error={errors.airline} hint="Pick a suggestion or type any airline.">
            <input id="airline" list="airline-options" value={v.airline} aria-invalid={invalid("airline")}
              onChange={(e) => update("airline", e.target.value)} className={inputClass(errors.airline)} />
            <datalist id="airline-options">
              {AIRLINES.map((a) => <option key={a} value={a} />)}
            </datalist>
          </Field>
        </div>

        {!v.journeyType && (
          <p className="mt-4 rounded bg-slate-50 p-3 text-sm text-slate-500">
            Choose a journey type in section C to enter the flight details.
          </p>
        )}

        {(v.journeyType === "ONE_WAY" || v.journeyType === "RETURN") && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Departure Airport" htmlFor="departureAirport" required error={errors.departureAirport}>
              <AirportInput id="departureAirport" value={v.departureAirport} error={errors.departureAirport}
                onChange={(c) => update("departureAirport", c)} />
            </Field>
            <Field label="Destination Airport" htmlFor="destinationAirport" required error={errors.destinationAirport}>
              <AirportInput id="destinationAirport" value={v.destinationAirport} error={errors.destinationAirport}
                onChange={(c) => update("destinationAirport", c)} />
            </Field>
            <Field label="Departure Date" htmlFor="departureDate" required error={errors.departureDate}>
              <input id="departureDate" type="date" value={v.departureDate} aria-invalid={invalid("departureDate")}
                onChange={(e) => update("departureDate", e.target.value)} className={inputClass(errors.departureDate)} />
            </Field>
            {v.journeyType === "RETURN" && (
              <Field label="Return Date" htmlFor="returnDate" required error={errors.returnDate}>
                <input id="returnDate" type="date" min={v.departureDate || undefined} value={v.returnDate}
                  aria-invalid={invalid("returnDate")}
                  onChange={(e) => update("returnDate", e.target.value)} className={inputClass(errors.returnDate)} />
              </Field>
            )}
          </div>
        )}

        {v.journeyType === "MULTI_CITY" && (
          <div className="mt-4 space-y-4">
            {v.segments.map((s, i) => {
              const p = `segments.${i}`;
              return (
                <div key={i} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-slate-800">Flight {i + 1}</h3>
                    {v.segments.length > 2 && (
                      <button type="button" onClick={() => removeSegment(i)} className="text-sm text-red-600 hover:underline">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Departure Airport" htmlFor={`${p}.departureAirport`} required error={errors[`${p}.departureAirport`]}>
                      <AirportInput id={`${p}.departureAirport`} value={s.departureAirport} error={errors[`${p}.departureAirport`]}
                        onChange={(c) => updateSegment(i, { departureAirport: c })} />
                    </Field>
                    <Field label="Destination Airport" htmlFor={`${p}.destinationAirport`} required error={errors[`${p}.destinationAirport`]}>
                      <AirportInput id={`${p}.destinationAirport`} value={s.destinationAirport} error={errors[`${p}.destinationAirport`]}
                        onChange={(c) => updateSegment(i, { destinationAirport: c })} />
                    </Field>
                    <Field label="Travel Date" htmlFor={`${p}.departureDate`} required error={errors[`${p}.departureDate`]}>
                      <input id={`${p}.departureDate`} type="date" value={s.departureDate}
                        min={(i > 0 && v.segments[i - 1].departureDate) || undefined}
                        aria-invalid={invalid(`${p}.departureDate`)}
                        onChange={(e) => updateSegment(i, { departureDate: e.target.value })}
                        className={inputClass(errors[`${p}.departureDate`])} />
                    </Field>
                  </div>
                </div>
              );
            })}
            {errors.segments && <p className="text-xs text-red-600">{errors.segments}</p>}
            {v.segments.length < MAX_SEGMENTS && (
              <button type="button" onClick={addSegment}
                className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
                Add flight segment
              </button>
            )}
          </div>
        )}
      </Section>

      {/* G. Financial information */}
      <Section title="G. Financial Information" description="All amounts are in pounds sterling (GBP).">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Total Sold" htmlFor="totalSold" required error={errors.totalSold} hint="The total charged to the customer.">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">£</span>
              <input id="totalSold" inputMode="decimal" value={v.totalSold} aria-invalid={invalid("totalSold")}
                onChange={(e) => update("totalSold", e.target.value.replace(/[^0-9.]/g, ""))}
                className={`${inputClass(errors.totalSold)} pl-7`} />
            </div>
          </Field>
          <Field label="Ticket Cost (Supplier)" htmlFor="ticketCost" required error={errors.ticketCost} hint="The cost payable to the airline or supplier.">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">£</span>
              <input id="ticketCost" inputMode="decimal" value={v.ticketCost} aria-invalid={invalid("ticketCost")}
                onChange={(e) => update("ticketCost", e.target.value.replace(/[^0-9.]/g, ""))}
                className={`${inputClass(errors.ticketCost)} pl-7`} />
            </div>
          </Field>
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Booking Profit</span>
            <div className={`rounded border border-slate-200 bg-slate-100 p-2.5 font-semibold ${profit?.isNegative() ? "text-red-600" : "text-slate-800"}`}>
              {profit ? formatGBP(profit) : "-"}
            </div>
            <p className="mt-1 text-xs text-slate-500">Calculated automatically: Total Sold minus Ticket Cost.</p>
          </div>
        </div>
      </Section>

      {/* H. Payment method */}
      <Section title="H. Payment Method">
        <div className="max-w-sm">
          <Field label="Payment Method" htmlFor="paymentMethod" required error={errors.paymentMethod}>
            <select id="paymentMethod" value={v.paymentMethod} aria-invalid={invalid("paymentMethod")}
              onChange={(e) => update("paymentMethod", e.target.value)} className={inputClass(errors.paymentMethod)}>
              <option value="">Select payment method</option>
              {PAYMENT_METHODS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* I. Notes */}
      <Section title="I. Flight Details / Notes" description="Itinerary details, special instructions, customer or supplier information.">
        <textarea id="notes" rows={5} maxLength={5000} value={v.notes}
          onChange={(e) => update("notes", e.target.value)} className={inputClass()} />
      </Section>

      {/* Actions */}
      <div className="sticky bottom-0 -mx-1 flex gap-3 border-t border-slate-200 bg-slate-100/95 px-1 py-4 backdrop-blur">
        <button type="submit" disabled={saving}
          className="rounded bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : editing ? "Save Changes" : "Save Booking"}
        </button>
        <button type="button" onClick={() => router.back()} disabled={saving}
          className="rounded border border-slate-300 bg-white px-6 py-2.5 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          Cancel
        </button>
      </div>
    </form>
  );
}