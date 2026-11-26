import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listInclude, serializeListItem } from "@/lib/bookings";

const TYPES = ["PAYMENT_PLAN", "PAYMENT_AWAITING", "FULL_PAYMENT", "DATE_CHANGE"] as const;

export async function GET() {
  const { user, error } = await requireApiUser();
  if (error) return error;

  const where = { deletedAt: null }; // deleted bookings never count

  // Three questions asked of the database at the same time
  const [grouped, sums, recent] = await Promise.all([
    prisma.booking.groupBy({ by: ["bookingType"], where, _count: { _all: true } }),
    prisma.booking.aggregate({
      where,
      _count: { _all: true },
      _sum: { totalSold: true, ticketCost: true, profit: true },
    }),
    prisma.booking.findMany({ where, include: listInclude, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  // Types with no bookings don't appear in groupBy, so start every type at zero
  const byType: Record<string, number> = Object.fromEntries(TYPES.map((t) => [t, 0]));
  for (const g of grouped) byType[g.bookingType] = g._count._all;

  const fixed = (d: { toFixed: (n: number) => string } | null) => (d ? d.toFixed(2) : "0.00");

  return NextResponse.json({
    counts: { total: sums._count._all, byType },
    // Financial totals are only sent to roles allowed to see them
    ...(can(user.role, "viewFinancials") && {
      financials: {
        totalSold: fixed(sums._sum.totalSold),
        ticketCost: fixed(sums._sum.ticketCost),
        profit: fixed(sums._sum.profit),
      },
    }),
    recent: recent.map((r) => serializeListItem(r, user.role)),
  });
}