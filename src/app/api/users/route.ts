import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { createUserSchema } from "@/lib/validation";

const publicFields = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

export async function GET() {
  const { error } = await requireApiUser(["ADMIN"]);
  if (error) return error;

  const users = await prisma.user.findMany({
    select: publicFields,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const { error } = await requireApiUser(["ADMIN"]);
  if (error) return error;

  const parsed = createUserSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message, issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { fullName, email, password, role } = parsed.data;

  try {
    const user = await prisma.user.create({
      data: { fullName, email, role, passwordHash: await bcrypt.hash(password, 12) },
      select: publicFields,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    throw e;
  }
}