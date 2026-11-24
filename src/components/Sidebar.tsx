"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  user: { fullName: string; email: string; role: "ADMIN" | "AGENT" };
  children: React.ReactNode;
};

const links = [
  { href: "/dashboard", label: "Dashboard", adminOnly: false },
  { href: "/bookings", label: "All Bookings", adminOnly: false },
  { href: "/bookings/new", label: "Upload New Booking", adminOnly: false },
  { href: "/admin/users", label: "User Management", adminOnly: true },
];

export default function Sidebar({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const visible = links.filter((l) => !l.adminOnly || user.role === "ADMIN");

  // Highlight the most specific matching link only
  const active = visible
    .filter((l) => pathname === l.href || pathname.startsWith(l.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-slate-900 p-4 text-white md:hidden">
        <span className="font-semibold">Travel Cart UK</span>
        <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="rounded border border-slate-600 px-3 py-1">
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        className={`${open ? "block" : "hidden"} w-full flex-shrink-0 bg-slate-900 text-slate-200 md:block md:min-h-screen md:w-64`}
      >
        <div className="hidden p-6 text-xl font-semibold text-white md:block">Travel Cart UK</div>

        <nav className="space-y-1 px-3 pb-4">
          {visible.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded px-3 py-2.5 text-sm ${
                active === l.href ? "bg-blue-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-700 p-4 text-sm md:mt-auto">
          <div className="font-medium text-white">{user.fullName}</div>
          <div className="text-xs text-slate-400">{user.email}</div>
          <div className="mt-1 inline-block rounded bg-slate-700 px-2 py-0.5 text-xs">
            {user.role === "ADMIN" ? "Admin" : "Agent"}
          </div>
          <button onClick={logout} className="mt-3 block w-full rounded border border-slate-600 py-2 hover:bg-slate-800">
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}