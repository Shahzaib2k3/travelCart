"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  user: { fullName: string; email: string; role: "ADMIN" | "AGENT" };
  children: React.ReactNode;
};

type NavGroup = { label?: string; adminOnly?: boolean; items: { href: string; label: string }[] };

const groups: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Dashboard" }] },
  {
    label: "Bookings",
    items: [
      { href: "/bookings", label: "All Bookings" },
      { href: "/bookings/new", label: "Upload New Booking" },
    ],
  },
  { label: "Administration", adminOnly: true, items: [{ href: "/admin/users", label: "User Management" }] },
];

export default function Sidebar({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const visible = groups.filter((g) => !g.adminOnly || user.role === "ADMIN");

  // Highlight only the most specific matching link
  const active = visible
    .flatMap((g) => g.items)
    .filter((l) => pathname === l.href || pathname.startsWith(l.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-ink px-5 py-3 md:hidden">
        <span className="font-serif text-lg font-semibold text-white">Travel Cart</span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation"
          className="rounded-md border border-white/25 px-3 py-1.5 text-sm text-white"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <aside
        className={`${open ? "flex" : "hidden"} w-full shrink-0 flex-col bg-ink text-white md:sticky md:top-0 md:flex md:h-screen md:w-60`}
      >
        <div className="hidden px-6 pb-8 pt-8 md:block">
          <Link href="/dashboard" className="font-serif text-xl font-semibold leading-none text-white">
            Travel Cart <span className="font-sans text-xs font-normal text-white/60">UK</span>
          </Link>
          <p className="mt-2 text-xs text-white/55">Booking dashboard</p>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4 pt-2 md:pt-0">
          {visible.map((g, gi) => (
            <div key={gi} className={gi > 0 ? "mt-6" : ""}>
              {g.label && <p className="mb-1.5 px-3 text-xs text-white/55">{g.label}</p>}
              <ul className="space-y-0.5">
                {g.items.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active === l.href ? "page" : undefined}
                      className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                        active === l.href
                          ? "bg-white/10 font-medium text-white shadow-[inset_2px_0_0_0_#ffffff]"
                          : "text-white/75 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-sm">
          <div className="font-medium">{user.fullName}</div>
          <div className="truncate text-xs text-white/60">{user.email}</div>
          <div className="mt-0.5 text-xs text-white/60">{user.role === "ADMIN" ? "Admin" : "Agent"}</div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-md border border-white/20 py-2 text-white transition-colors hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
