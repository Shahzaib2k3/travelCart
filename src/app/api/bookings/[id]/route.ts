import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { validationError } from "@/lib/api";
import { bookingSchema } from "@/lib/booking-schema";
import {
  bookingInclude, buildBookingData, buildTravellers, buildSegments, serializeBooking,
} from "@/lib/bookings";

type Ctx = { params: Promise<{ id: string }> };

const findBooking = (idOrRef: string) =>
  prisma.booking.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrRef }, { reference: idOrRef }] },
    include: bookingInclude,
  });

const notFound = () => NextResponse.json({ error: "Booking not found" }, { status: 404 });

export async function GET(_req: Request, { params }: Ctx) {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const booking = await findBooking((await params).id);
  if (!booking) return notFound();
  return NextResponse.json({ booking: serializeBooking(booking, user.role) });
}

// Full update. The edit form sends the whole booking, same shape as create.
// The reference is never read from the request, so it cannot change.
export async function PUT(req: Request, { params }: Ctx) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  if (!can(user.role, "editBooking")) {
    return NextResponse.json({ error: "You do not have permission to edit bookings" }, { status: 403 });
  }

  const existing = await findBooking((await params).id);
  if (!existing) return notFound();

  const parsed = bookingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const booking = await prisma.$transaction(async (tx) => {
    // Replace travellers and segments with what the form sent
    await tx.traveller.deleteMany({ where: { bookingId: existing.id } });
    await tx.flightSegment.deleteMany({ where: { bookingId: existing.id } });

    return tx.booking.update({
      where: { id: existing.id },
      data: {
        ...buildBookingData(input), // profit is recalculated here every time
        updatedById: user.id,
        travellers: { create: buildTravellers(input) },
        segments: { create: buildSegments(input) },
      },
      include: bookingInclude,
    });
  });

  return NextResponse.json({ booking: serializeBooking(booking, user.role) });
}

// Soft delete: the row stays in the database (so references are never reused
// and records can be recovered), but it disappears from every query.
export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, error } = await requireApiUser();
  if (error) return error;
  if (!can(user.role, "deleteBooking")) {
    return NextResponse.json({ error: "Only admins can delete bookings" }, { status: 403 });
  }

  const existing = await findBooking((await params).id);
  if (!existing) return notFound();

  await prisma.booking.update({
    where: { id: existing.id },
    data: { deletedAt: new Date(), updatedById: user.id },
  });
  return NextResponse.json({ ok: true });
}