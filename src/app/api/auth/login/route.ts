import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Same message for every failure, so attackers can't tell which emails exist
  const invalid = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (!user) return invalid;
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return invalid;

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "This account has been deactivated" }, { status: 403 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  return NextResponse.json({ ok: true, role: user.role });
}