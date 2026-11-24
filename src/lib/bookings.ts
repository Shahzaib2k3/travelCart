import { Prisma, type Role } from "@prisma/client";
import Decimal from "decimal.js";
import { can } from "./permissions";
import type { BookingInput } from "./booking-schema";

export const toDate = (s: string) => new Date(`${s}T00:00:00.000Z`);
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

// Booking Profit = Total Sold - Ticket Cost (Supplier), calculated with exact decimals
export const calcProfit = (sold: Decimal, cost: Decimal) => sold.minus(cost).toDecimalPlaces(2);

// Must run inside a transaction. One atomic upsert per call, so no two
// bookings can ever receive the same number.
export async function nextReference(tx: Prisma.TransactionClient) {
  const year = new Date().getUTCFullYear();
  const counter = await tx.bookingCounter.upsert({
    where: { year },
    create: { year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `TC-${year}-${String(counter.lastNumber).padStart(6, "0")}`;
}

export const bookingInclude = {
  travellers: { orderBy: { sortOrder: "asc" } },
  segments: { orderBy: { segmentOrder: "asc" } },
  createdBy: { select: { id: true, fullName: true } },
  updatedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.BookingInclude;

export const listInclude = {
  createdBy: { select: { id: true, fullName: true } },
  _count: { select: { travellers: true } },
} satisfies Prisma.BookingInclude;

type BookingFull = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;
type BookingListRow = Prisma.BookingGetPayload<{ include: typeof listInclude }>;

// Turns validated input into the booking's own columns.
// For multi-city, the top-level route fields are derived from the segments so
// that the list, search and filters work the same for every journey type.
export function buildBookingData(input: BookingInput) {
  const segs = input.journeyType === "MULTI_CITY" ? (input.segments ?? []) : [];
  const first = segs[0];
  const last = segs[segs.length - 1];

  return {
    customerName: input.customerName,
    phone: input.phone,
    email: input.email,
    bookingType: input.bookingType,
    journeyType: input.journeyType,
    cabinClass: input.cabinClass,
    airline: input.airline,
    departureAirport: first ? first.departureAirport : input.departureAirport!,
    destinationAirport: last ? last.destinationAirport : input.destinationAirport!,
    departureDate: toDate(first ? first.departureDate : input.departureDate!),
    returnDate: input.journeyType === "RETURN" && input.returnDate ? toDate(input.returnDate) : null,
    totalSold: input.totalSold.toFixed(2),
    ticketCost: input.ticketCost.toFixed(2),
    profit: calcProfit(input.totalSold, input.ticketCost).toFixed(2),
    paymentMethod: input.paymentMethod,
    notes: input.notes || null,
  };
}

export const buildTravellers = (input: BookingInput) =>
  input.travellers.map((t, i) => ({
    passengerType: t.passengerType,
    title: t.title,
    firstName: t.firstName,
    middleName: t.middleName || null,
    lastName: t.lastName,
    dateOfBirth: toDate(t.dateOfBirth),
    sortOrder: i,
  }));

export const buildSegments = (input: BookingInput) =>
  input.journeyType === "MULTI_CITY"
    ? (input.segments ?? []).map((s, i) => ({
        segmentOrder: i,
        airline: s.airline || null,
        departureAirport: s.departureAirport,
        destinationAirport: s.destinationAirport,
        departureDate: toDate(s.departureDate),
      }))
    : [];

// What the API sends to the browser. Financial fields are only included
// when the user's role is allowed to see them.
const money = (b: { totalSold: Prisma.Decimal; ticketCost: Prisma.Decimal; profit: Prisma.Decimal }, role: Role) =>
  can(role, "viewFinancials")
    ? { totalSold: b.totalSold.toFixed(2), ticketCost: b.ticketCost.toFixed(2), profit: b.profit.toFixed(2) }
    : {};

export function serializeBooking(b: BookingFull, role: Role) {
  return {
    id: b.id,
    reference: b.reference,
    customerName: b.customerName,
    phone: b.phone,
    email: b.email,
    bookingType: b.bookingType,
    journeyType: b.journeyType,
    cabinClass: b.cabinClass,
    airline: b.airline,
    departureAirport: b.departureAirport,
    destinationAirport: b.destinationAirport,
    departureDate: fmtDate(b.departureDate),
    returnDate: b.returnDate ? fmtDate(b.returnDate) : null,
    paymentMethod: b.paymentMethod,
    notes: b.notes,
    ...money(b, role),
    travellers: b.travellers.map((t) => ({
      id: t.id,
      passengerType: t.passengerType,
      title: t.title,
      firstName: t.firstName,
      middleName: t.middleName,
      lastName: t.lastName,
      dateOfBirth: fmtDate(t.dateOfBirth),
      sortOrder: t.sortOrder,
    })),
    segments: b.segments.map((s) => ({
      id: s.id,
      segmentOrder: s.segmentOrder,
      airline: s.airline,
      departureAirport: s.departureAirport,
      destinationAirport: s.destinationAirport,
      departureDate: fmtDate(s.departureDate),
    })),
    createdBy: b.createdBy,
    updatedBy: b.updatedBy,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export function serializeListItem(b: BookingListRow, role: Role) {
  return {
    id: b.id,
    reference: b.reference,
    customerName: b.customerName,
    phone: b.phone,
    email: b.email,
    bookingType: b.bookingType,
    journeyType: b.journeyType,
    airline: b.airline,
    departureAirport: b.departureAirport,
    destinationAirport: b.destinationAirport,
    departureDate: fmtDate(b.departureDate),
    travellerCount: b._count.travellers,
    ...money(b, role),
    createdBy: b.createdBy,
    createdAt: b.createdAt.toISOString(),
  };
}