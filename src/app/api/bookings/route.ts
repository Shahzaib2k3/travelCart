import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { validationError } from "@/lib/api";
import { bookingSchema } from "@/lib/booking-schema";
import {
  bookingInclude, listInclude, buildBookingData, buildTravellers, buildSegments,
  nextReference, serializeBooking, serializeListItem, toDate,
} from "@/lib/bookings";

// ---------- Create a booking ----------
export async function POST(req: Request) {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const parsed = bookingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const findExisting = () =>
    prisma.booking.findUnique({ where: { idempotencyKey: input.idempotencyKey! }, include: bookingInclude });

  // Same key sent twice (double click, retry) → return the booking we already saved
  if (input.idempotencyKey) {
    const existing = await findExisting();
    if (existing) return NextResponse.json({ booking: serializeBooking(existing, user.role), duplicate: true });
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const reference = await nextReference(tx);
      return tx.booking.create({
        data: {
          reference,
          ...buildBookingData(input),
          idempotencyKey: input.idempotencyKey ?? null,
          createdById: user.id,
          updatedById: user.id,
          travellers: { create: buildTravellers(input) },
          segments: { create: buildSegments(input) },
        },
        include: bookingInclude,
      });
    });
    return NextResponse.json({ booking: serializeBooking(booking, user.role) }, { status: 201 });
  } catch (e) {
    // Two identical requests raced each other: the database's unique key stopped the second
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && input.idempotencyKey) {
      const existing = await findExisting();
      if (existing) return NextResponse.json({ booking: serializeBooking(existing, user.role), duplicate: true });
    }
    throw e;
  }
}

// ---------- List, search, filter, sort, paginate ----------
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optional = <T extends z.ZodTypeAny>(s: T) => z.preprocess(emptyToUndefined, s.optional());
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const querySchema = z.object({
  q: optional(z.string().trim().max(100)),
  bookingType: optional(z.enum(["PAYMENT_PLAN", "PAYMENT_AWAITING", "FULL_PAYMENT", "DATE_CHANGE"])),
  journeyType: optional(z.enum(["ONE_WAY", "RETURN", "MULTI_CITY"])),
  airline: optional(z.string().trim().max(80)),
  departureFrom: optional(day),
  departureTo: optional(day),
  createdFrom: optional(day),
  createdTo: optional(day),
  createdBy: optional(z.string().max(50)),
  sort: z.preprocess(emptyToUndefined, z.enum(["createdAt", "departureDate", "totalSold", "profit", "customerName", "reference"]).default("createdAt")),
  dir: z.preprocess(emptyToUndefined, z.enum(["asc", "desc"]).default("desc")),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  pageSize: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(10)),
});

export async function GET(req: Request) {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const f = parsed.data;

  if (f.createdBy && !can(user.role, "filterByCreator")) {
    return NextResponse.json({ error: "Only admins can filter by creator" }, { status: 403 });
  }

  const where: Prisma.BookingWhereInput = { deletedAt: null };

  if (f.q) {
    where.OR = [
      { reference: { contains: f.q, mode: "insensitive" } },
      { customerName: { contains: f.q, mode: "insensitive" } },
      { phone: { contains: f.q } },
      { email: { contains: f.q, mode: "insensitive" } },
    ];
  }
  if (f.bookingType) where.bookingType = f.bookingType;
  if (f.journeyType) where.journeyType = f.journeyType;
  if (f.airline) where.airline = { contains: f.airline, mode: "insensitive" };
  if (f.createdBy) where.createdById = f.createdBy;

  if (f.departureFrom || f.departureTo) {
    where.departureDate = {
      ...(f.departureFrom && { gte: toDate(f.departureFrom) }),
      ...(f.departureTo && { lte: toDate(f.departureTo) }),
    };
  }
  if (f.createdFrom || f.createdTo) {
    where.createdAt = {
      ...(f.createdFrom && { gte: toDate(f.createdFrom) }),
      // "to" is inclusive, so go up to (but not including) the next day
      ...(f.createdTo && { lt: new Date(toDate(f.createdTo).getTime() + 24 * 60 * 60 * 1000) }),
    };
  }

  // Don't let hidden financial columns be used to infer values by sorting
  const financialSort = f.sort === "totalSold" || f.sort === "profit";
  const sort = financialSort && !can(user.role, "viewFinancials") ? "createdAt" : f.sort;

  const [total, rows] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: listInclude,
      orderBy: [{ [sort]: f.dir } as Prisma.BookingOrderByWithRelationInput, { id: "asc" }],
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
  ]);

  return NextResponse.json({
    bookings: rows.map((r) => serializeListItem(r, user.role)),
    page: f.page,
    pageSize: f.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
  });
}