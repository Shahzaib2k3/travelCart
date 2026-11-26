import { PrismaClient, type BookingType, type CabinClass, type JourneyType, type PaymentMethod } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;

const TYPES: BookingType[] = ["PAYMENT_PLAN", "PAYMENT_AWAITING", "FULL_PAYMENT", "DATE_CHANGE"];
const JOURNEYS: JourneyType[] = ["RETURN", "ONE_WAY", "RETURN", "MULTI_CITY", "RETURN"];
const PAYMENTS: PaymentMethod[] = ["CARD", "BANK_PAYMENT", "PAYPAL", "KLARNA", "INTERNATIONAL_CARD", "CLEARPAY"];
const CABINS: CabinClass[] = ["ECONOMY", "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "ECONOMY", "FIRST"];
const ROUTES = [
  ["LHR", "DXB", "Emirates"], ["MAN", "ISB", "Pakistan International Airlines"], ["BHX", "LHE", "Qatar Airways"],
  ["LGW", "DOH", "Qatar Airways"], ["LHR", "JED", "Saudia"], ["MAN", "DXB", "Etihad Airways"],
  ["LHR", "IST", "Turkish Airlines"], ["BHX", "JFK", "British Airways"],
];
const NAMES = [
  ["Ayesha", "Malik"], ["Daniel", "Hughes"], ["Fatima", "Raza"], ["Oliver", "Bennett"], ["Zainab", "Ahmed"],
  ["Harriet", "Cole"], ["Usman", "Sheikh"], ["Priya", "Patel"], ["Callum", "Reid"], ["Maryam", "Iqbal"],
];

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN", status: "ACTIVE" } });
  const agent = (await prisma.user.findFirst({ where: { role: "AGENT", status: "ACTIVE" } })) ?? admin;
  const year = new Date().getUTCFullYear();

  for (let i = 0; i < 30; i++) {
    const [from, to, airline] = ROUTES[i % ROUTES.length];
    const [first, last] = NAMES[i % NAMES.length];
    const journeyType = JOURNEYS[i % JOURNEYS.length];
    const creator = i % 3 === 0 ? admin : agent;

    const departure = new Date(Date.UTC(year + 1, 0, 10 + i * 3)); // spread over the next few months
    const back = new Date(departure.getTime() + 14 * DAY);

    // Exact decimal maths, same principle as the real app
    const sold = new Decimal(450 + ((i * 137) % 1500)).plus(i % 2 ? "0.50" : "0.00");
    const cost = sold.minus(35 + ((i * 53) % 240));
    const profit = sold.minus(cost);

    const counter = await prisma.bookingCounter.upsert({
      where: { year },
      create: { year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });

    const multi = journeyType === "MULTI_CITY";

    await prisma.booking.create({
      data: {
        reference: `TC-${year}-${String(counter.lastNumber).padStart(6, "0")}`,
        customerName: `${first} ${last}`,
        phone: `+44 7700 900${String(100 + i).padStart(3, "0")}`,
        email: `${first}.${last}${i}@example.com`.toLowerCase(),
        bookingType: TYPES[i % TYPES.length],
        journeyType,
        cabinClass: CABINS[i % CABINS.length],
        airline,
        departureAirport: from,
        destinationAirport: multi ? "BKK" : to,
        departureDate: departure,
        returnDate: journeyType === "RETURN" ? back : null,
        totalSold: sold.toFixed(2),
        ticketCost: cost.toFixed(2),
        profit: profit.toFixed(2),
        paymentMethod: PAYMENTS[i % PAYMENTS.length],
        notes: "Sample data",
        createdById: creator.id,
        updatedById: creator.id,
        createdAt: new Date(Date.now() - (30 - i) * DAY),
        travellers: {
          create: [
            { passengerType: "ADULT", title: "MR", firstName: first, lastName: last, dateOfBirth: new Date("1988-04-12"), sortOrder: 0 },
            ...(i % 3 === 1
              ? [{ passengerType: "CHILD" as const, title: "MSTR" as const, firstName: "Sam", lastName: last, dateOfBirth: new Date("2017-03-14"), sortOrder: 1 }]
              : []),
          ],
        },
        segments: multi
          ? {
              create: [
                { segmentOrder: 0, airline, departureAirport: from, destinationAirport: to, departureDate: departure },
                { segmentOrder: 1, airline, departureAirport: to, destinationAirport: "BKK", departureDate: new Date(departure.getTime() + 7 * DAY) },
              ],
            }
          : undefined,
      },
    });
  }
  console.log("Created 30 sample bookings (notes say 'Sample data')");
}

main().finally(() => prisma.$disconnect());