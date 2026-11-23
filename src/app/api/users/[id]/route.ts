import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const publicFields = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

export async function GET(_req: Request, { params }: Ctx) {
  const { error } = await requireApiUser(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: publicFields });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { error } = await requireApiUser(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const parsed = updateUserSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data = parsed.data;

  // Last-admin protection: never demote or deactivate the last active Admin
  const losingAdminPower =
    target.role === "ADMIN" &&
    target.status === "ACTIVE" &&
    ((data.role && data.role !== "ADMIN") || data.status === "INACTIVE");

  if (losingAdminPower) {
    const otherActiveAdmins = await prisma.user.count({
      where: { role: "ADMIN", status: "ACTIVE", id: { not: id } },
    });
    if (otherActiveAdmins === 0) {
      return NextResponse.json(
        { error: "You cannot deactivate or demote the last active Admin account" },
        { status: 400 }
      );
    }
  }

  try {
    const user = await prisma.user.update({ where: { id }, data, select: publicFields });
    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    throw e;
  }
}