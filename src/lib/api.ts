import { NextResponse } from "next/server";
import type { ZodError } from "zod";

// Turns a Zod failure into a 400 with a readable message and per-field details
export function validationError(err: ZodError) {
  const issues = err.issues.map((i) => ({
    path: i.path.map(String).join("."),
    message: i.message,
  }));
  return NextResponse.json({ error: issues[0]?.message ?? "Invalid data", issues }, { status: 400 });
}