import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiUser(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  });
  return NextResponse.json({ ok: true });
}