"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { buttonClass, PageHeader, Status } from "@/components/ui";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "AGENT";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
};

const th = "whitespace-nowrap border-b border-rule bg-wash px-4 py-3 text-left text-xs font-semibold text-muted";
const td = "px-4 py-3 align-middle";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    if (res.ok) setUsers((await res.json()).users);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(u: User) {
    const next = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (next === "INACTIVE" && !confirm(`Deactivate ${u.fullName}? They will lose access immediately.`)) return;

    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) toast.success(`${u.fullName} is now ${next === "ACTIVE" ? "active" : "inactive"}`);
    else toast.error(data.error ?? "Could not update the user");
    load();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PageHeader
        title="User Management"
        subtitle="Create accounts, assign roles and control access."
        action={<Link href="/admin/users/new" className={buttonClass("primary")}>Add New User</Link>}
      />

      <div className="overflow-x-auto border border-rule bg-white">
        <table className="w-full min-w-[48rem] text-sm">
          <thead>
            <tr>
              <th scope="col" className={th}>User Name</th>
              <th scope="col" className={th}>Email Address</th>
              <th scope="col" className={th}>Role</th>
              <th scope="col" className={th}>Account Status</th>
              <th scope="col" className={th}>Created Date</th>
              <th scope="col" className={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">Loading users...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">No users yet. Add the first one.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-t border-rule hover:bg-wash">
                <td className={`${td} font-medium`}>{u.fullName}</td>
                <td className={td}>{u.email}</td>
                <td className={td}>{u.role === "ADMIN" ? "Admin" : "Agent"}</td>
                <td className={td}>
                  <Status tone={u.status === "ACTIVE" ? "ok" : "off"}>{u.status === "ACTIVE" ? "Active" : "Inactive"}</Status>
                </td>
                <td className={`${td} tabular-nums`}>{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                <td className={td}>
                  <div className="flex gap-4 whitespace-nowrap">
                    <Link href={`/admin/users/${u.id}/edit`} className="text-action hover:underline">Edit</Link>
                    <button type="button" onClick={() => toggleStatus(u)} className="text-muted hover:text-ink hover:underline">
                      {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}