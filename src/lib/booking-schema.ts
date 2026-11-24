import { z } from "zod";
import Decimal from "decimal.js";

// "2026-12-20" only, and it must be a real calendar date (rejects 2026-02-31)
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Enter a valid date");

// Accepts "1200" or "1200.50" or 1200.5. Max 2 decimals, no negatives. Becomes a Decimal.
const money = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d{1,10}(\.\d{1,2})?$/.test(v), "Enter an amount in pounds with up to 2 decimal places")
  .transform((v) => new Decimal(v));

const iata = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Choose an airport (3-letter IATA code)");

const travellerSchema = z.object({
  passengerType: z.enum(["ADULT", "CHILD", "YOUTH", "INFANT"]),
  title: z.enum(["MR", "MRS", "MS", "MISS", "MSTR"]),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  middleName: z.string().trim().max(60).nullish(),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  dateOfBirth: isoDate,
});

const segmentSchema = z.object({
  airline: z.string().trim().max(80).nullish(),
  departureAirport: iata,
  destinationAirport: iata,
  departureDate: isoDate,
});

export const bookingSchema = z
  .object({
    idempotencyKey: z.string().min(8).max(100).optional(),

    customerName: z.string().trim().min(2, "Customer name is required").max(120),
    phone: z.string().trim().regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),

    bookingType: z.enum(["PAYMENT_PLAN", "PAYMENT_AWAITING", "FULL_PAYMENT", "DATE_CHANGE"]),
    journeyType: z.enum(["ONE_WAY", "RETURN", "MULTI_CITY"]),
    cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]),

    airline: z.string().trim().min(2, "Airline is required").max(80),

    // Used for ONE_WAY and RETURN. For MULTI_CITY these come from the segments.
    departureAirport: iata.nullish(),
    destinationAirport: iata.nullish(),
    departureDate: isoDate.nullish(),
    returnDate: isoDate.nullish(),
    segments: z.array(segmentSchema).max(10).nullish(),

    travellers: z.array(travellerSchema).min(1, "Add at least one traveller").max(20),

    totalSold: money,
    ticketCost: money,
    paymentMethod: z.enum(["BANK_PAYMENT", "CARD", "INTERNATIONAL_CARD", "KLARNA", "CLEARPAY", "PAYPAL"]),
    notes: z.string().trim().max(5000).nullish(),
  })
  .superRefine((d, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (d.journeyType === "MULTI_CITY") {
      const segs = d.segments ?? [];
      if (segs.length < 2) issue(["segments"], "Multi-city needs at least two flight segments");
      segs.forEach((s, i) => {
        if (s.departureAirport === s.destinationAirport)
          issue(["segments", i, "destinationAirport"], "Departure and destination must be different");
        if (i > 0 && s.departureDate < segs[i - 1].departureDate)
          issue(["segments", i, "departureDate"], "Segment dates must be in order");
      });
    } else {
      if (!d.departureAirport) issue(["departureAirport"], "Departure airport is required");
      if (!d.destinationAirport) issue(["destinationAirport"], "Destination airport is required");
      if (d.departureAirport && d.departureAirport === d.destinationAirport)
        issue(["destinationAirport"], "Departure and destination must be different");
      if (!d.departureDate) issue(["departureDate"], "Departure date is required");

      if (d.journeyType === "RETURN") {
        if (!d.returnDate) issue(["returnDate"], "Return date is required for return journeys");
        else if (d.departureDate && d.returnDate < d.departureDate)
          issue(["returnDate"], "Return date cannot be before the departure date");
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    d.travellers.forEach((t, i) => {
      if (t.dateOfBirth > today) issue(["travellers", i, "dateOfBirth"], "Date of birth cannot be in the future");
    });
  });

export type BookingInput = z.output<typeof bookingSchema>;