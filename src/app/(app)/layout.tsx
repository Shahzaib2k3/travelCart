import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

async function Shell({ children }: { children: React.ReactNode }) {
  await connection(); // render at request time (avoids the Date.now() error)

  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <Sidebar user={user}>{children}</Sidebar>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading...</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}