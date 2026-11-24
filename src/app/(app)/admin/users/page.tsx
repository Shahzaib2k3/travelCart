"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "AGENT";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
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
    const data = await res.json();
    setMessage(
      res.ok
        ? { type: "ok", text: `${u.fullName} is now ${next.toLowerCase()}` }
        : { type: "err", text: data.error }
    );
    load();
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">User Management</h1>
        <Link href="/admin/users/new" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Add New User
        </Link>
      </div>

      {message && (
        <div className={`mb-4 rounded p-3 text-sm ${message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">User Name</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">Role</th>
              <th className="p-3">Account Status</th>
              <th className="p-3">Created Date</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">Loading...</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3 font-medium">{u.fullName}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role === "ADMIN" ? "Admin" : "Agent"}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                    {u.status === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="space-x-3 p-3">
                  <Link href={`/admin/users/${u.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                  <button onClick={() => toggleStatus(u)} className="text-slate-600 hover:underline">
                    {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}