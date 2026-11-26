import Decimal from "decimal.js";

// ---------- Types and option lists ----------
export type PassengerType = "ADULT" | "CHILD" | "YOUTH" | "INFANT";
export const PASSENGER_TYPES: PassengerType[] = ["ADULT", "CHILD", "YOUTH", "INFANT"];

export const PASSENGER_INFO: Record<PassengerType, { label: string; age: string }> = {
  ADULT: { label: "Adult", age: "Aged 16+" },
  CHILD: { label: "Child", age: "Aged 2-12" },
  YOUTH: { label: "Youth", age: "Aged 12-16" },
  INFANT: { label: "Infant", age: "Aged 0-2" },
};

export const MAX_TRAVELLERS = 20;
export const MAX_SEGMENTS = 6;

export const BOOKING_TYPES = [
  { value: "PAYMENT_PLAN", label: "Payment Plan" },
  { value: "PAYMENT_AWAITING", label: "Payment Awaiting" },
  { value: "FULL_PAYMENT", label: "Full Payment" },
  { value: "DATE_CHANGE", label: "Date Change" },
];
export const JOURNEY_TYPES = [
  { value: "ONE_WAY", label: "One-way" },
  { value: "RETURN", label: "Return" },
  { value: "MULTI_CITY", label: "Multi City" },
];
export const CABIN_CLASSES = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First Class" },
];
export const PAYMENT_METHODS = [
  { value: "BANK_PAYMENT", label: "Bank Payment" },
  { value: "CARD", label: "Card" },
  { value: "INTERNATIONAL_CARD", label: "International Card" },
  { value: "KLARNA", label: "Klarna" },
  { value: "CLEARPAY", label: "Clearpay" },
  { value: "PAYPAL", label: "PayPal" },
];
export const TITLES = [
  { value: "MR", label: "Mr" },
  { value: "MRS", label: "Mrs" },
  { value: "MS", label: "Ms" },
  { value: "MISS", label: "Miss" },
  { value: "MSTR", label: "Mstr" },
];

export type Counts = Record<PassengerType, number>;

export type TravellerForm = {
  passengerType: PassengerType;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
};

export type SegmentForm = {
  departureAirport: string; // IATA code
  destinationAirport: string;
  departureDate: string;
};

export type BookingFormValues = {
  customerName: string;
  phone: string;
  email: string;
  bookingType: string;
  journeyType: string;
  cabinClass: string;
  counts: Counts;
  travellers: TravellerForm[];
  airline: string;
  departureAirport: string;
  destinationAirport: string;
  departureDate: string;
  returnDate: string;
  segments: SegmentForm[];
  totalSold: string; // money stays as text until the server turns it into a Decimal
  ticketCost: string;
  paymentMethod: string;
  notes: string;
};

// ---------- Travellers ----------
export const blankTraveller = (passengerType: PassengerType): TravellerForm => ({
  passengerType, title: "", firstName: "", middleName: "", lastName: "", dateOfBirth: "",
});

export const totalTravellers = (c: Counts) => PASSENGER_TYPES.reduce((sum, t) => sum + c[t], 0);

// Builds the traveller list from the counts, KEEPING anything already typed.
// 2 Adults + 1 Child + 1 Infant => Adult 1, Adult 2, Child 1, Infant 1.
export function syncTravellers(existing: TravellerForm[], counts: Counts): TravellerForm[] {
  const result: TravellerForm[] = [];
  for (const type of PASSENGER_TYPES) {
    const current = existing.filter((t) => t.passengerType === type);
    for (let i = 0; i < counts[type]; i++) result.push(current[i] ?? blankTraveller(type));
  }
  return result;
}

// "Adult 1", "Adult 2", "Child 1" ...
export function travellerLabel(travellers: TravellerForm[], index: number) {
  const type = travellers[index].passengerType;
  const n = travellers.slice(0, index + 1).filter((t) => t.passengerType === type).length;
  return `${PASSENGER_INFO[type].label} ${n}`;
}

export function emptyValues(): BookingFormValues {
  const counts: Counts = { ADULT: 1, CHILD: 0, YOUTH: 0, INFANT: 0 };
  return {
    customerName: "", phone: "", email: "",
    bookingType: "", journeyType: "", cabinClass: "ECONOMY",
    counts, travellers: syncTravellers([], counts),
    airline: "", departureAirport: "", destinationAirport: "", departureDate: "", returnDate: "",
    segments: [
      { departureAirport: "", destinationAirport: "", departureDate: "" },
      { departureAirport: "", destinationAirport: "", departureDate: "" },
    ],
    totalSold: "", ticketCost: "", paymentMethod: "", notes: "",
  };
}

// ---------- Money (display only: the server does the real calculation) ----------
const MONEY_RE = /^\d{1,10}(\.\d{1,2})?$/;

export function previewProfit(sold: string, cost: string): Decimal | null {
  if (!MONEY_RE.test(sold) || !MONEY_RE.test(cost)) return null;
  return new Decimal(sold).minus(cost).toDecimalPlaces(2);
}

export function formatGBP(d: Decimal) {
  const [whole, pence] = d.abs().toFixed(2).split(".");
  return `${d.isNegative() ? "-" : ""}£${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${pence}`;
}

// ---------- Validation (same rules as the server, for instant feedback) ----------
const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isoValid = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

// Returns { "fieldPath": "message" }. Paths match the server's, e.g. "travellers.0.firstName".
export function validate(v: BookingFormValues): Record<string, string> {
  const e: Record<string, string> = {};
  const today = todayISO();

  if (v.customerName.trim().length < 2) e.customerName = "Customer name is required";
  if (!PHONE_RE.test(v.phone.trim())) e.phone = "Enter a valid phone number";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address";
  if (!v.bookingType) e.bookingType = "Select a booking type";
  if (!v.journeyType) e.journeyType = "Select a journey type";
  if (!v.cabinClass) e.cabinClass = "Select a cabin class";

  if (totalTravellers(v.counts) < 1) e.travellers = "Add at least one traveller";
  v.travellers.forEach((t, i) => {
    const p = `travellers.${i}`;
    if (!t.title) e[`${p}.title`] = "Select a title";
    if (!t.firstName.trim()) e[`${p}.firstName`] = "First name is required";
    if (!t.lastName.trim()) e[`${p}.lastName`] = "Last name is required";
    if (!isoValid(t.dateOfBirth)) e[`${p}.dateOfBirth`] = "Enter a valid date of birth";
    else if (t.dateOfBirth > today) e[`${p}.dateOfBirth`] = "Date of birth cannot be in the future";
  });

  if (v.airline.trim().length < 2) e.airline = "Airline is required";

  if (v.journeyType === "MULTI_CITY") {
    if (v.segments.length < 2) e.segments = "Multi-city needs at least two flight segments";
    v.segments.forEach((s, i) => {
      const p = `segments.${i}`;
      if (!s.departureAirport) e[`${p}.departureAirport`] = "Choose an airport";
      if (!s.destinationAirport) e[`${p}.destinationAirport`] = "Choose an airport";
      else if (s.departureAirport === s.destinationAirport)
        e[`${p}.destinationAirport`] = "Departure and destination must be different";
      if (!isoValid(s.departureDate)) e[`${p}.departureDate`] = "Enter a valid date";
      else if (i > 0 && isoValid(v.segments[i - 1].departureDate) && s.departureDate < v.segments[i - 1].departureDate)
        e[`${p}.departureDate`] = "Segment dates must be in order";
    });
  } else if (v.journeyType) {
    if (!v.departureAirport) e.departureAirport = "Departure airport is required";
    if (!v.destinationAirport) e.destinationAirport = "Destination airport is required";
    else if (v.departureAirport === v.destinationAirport)
      e.destinationAirport = "Departure and destination must be different";
    if (!isoValid(v.departureDate)) e.departureDate = "Departure date is required";

    if (v.journeyType === "RETURN") {
      if (!isoValid(v.returnDate)) e.returnDate = "Return date is required for return journeys";
      else if (isoValid(v.departureDate) && v.returnDate < v.departureDate)
        e.returnDate = "Return date cannot be before the departure date";
    }
  }

  if (!MONEY_RE.test(v.totalSold)) e.totalSold = "Enter an amount in pounds (up to 2 decimals)";
  if (!MONEY_RE.test(v.ticketCost)) e.ticketCost = "Enter an amount in pounds (up to 2 decimals)";
  if (!v.paymentMethod) e.paymentMethod = "Select a payment method";

  return e;
}

// ---------- What we send to the API ----------
export function buildPayload(v: BookingFormValues, idempotencyKey?: string) {
  const multi = v.journeyType === "MULTI_CITY";
  return {
    ...(idempotencyKey ? { idempotencyKey } : {}),
    customerName: v.customerName.trim(),
    phone: v.phone.trim(),
    email: v.email.trim(),
    bookingType: v.bookingType,
    journeyType: v.journeyType,
    cabinClass: v.cabinClass,
    airline: v.airline.trim(),
    ...(multi
      ? {
          segments: v.segments.map((s) => ({
            departureAirport: s.departureAirport,
            destinationAirport: s.destinationAirport,
            departureDate: s.departureDate,
          })),
        }
      : {
          departureAirport: v.departureAirport,
          destinationAirport: v.destinationAirport,
          departureDate: v.departureDate,
          returnDate: v.journeyType === "RETURN" ? v.returnDate : null,
        }),
    travellers: v.travellers.map((t) => ({
      passengerType: t.passengerType,
      title: t.title,
      firstName: t.firstName.trim(),
      middleName: t.middleName.trim() || null,
      lastName: t.lastName.trim(),
      dateOfBirth: t.dateOfBirth,
    })),
    totalSold: v.totalSold,
    ticketCost: v.ticketCost,
    paymentMethod: v.paymentMethod,
    notes: v.notes.trim() || null,
  };
}