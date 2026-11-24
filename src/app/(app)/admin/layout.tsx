import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth";

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await connection(); // opt into request-time rendering

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading...</div>}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}