import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "./db";
import { getSession } from "./session";

// Loads the user from the DB on EVERY request, so a deactivated
// user loses access immediately.
export async function getSessionUser() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, fullName: true, email: true, role: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

// Use at the top of every protected API route.
export async function requireApiUser(allowedRoles?: Role[]) {
  const user = await getSessionUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // Refresh the cookie so the inactivity timer restarts
  const session = await getSession();
  await session.save();

  return { user };
}