import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireApiUser();
  if (error) return error;
  return NextResponse.json({ user });
}