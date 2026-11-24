"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState({ fullName: "", email: "", role: "AGENT", status: "ACTIVE" });
  const [pw, setPw] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setForm({ fullName: d.user.fullName, email: d.user.email, role: d.user.role, status: d.user.status });
        setLoading(false);
      });
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: "ok", text: "User updated" } : { type: "err", text: data.error });
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    const res = await fetch(`/api/users/${id}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pw),
    });
    const data = await res.json();
    if (res.ok) setPw({ password: "", confirmPassword: "" });
    setPwMsg(res.ok ? { type: "ok", text: "Password reset" } : { type: "err", text: data.error });
  }

  const input = "w-full rounded border border-slate-300 p-2.5";
  const banner = (m: typeof msg) =>
    m && (
      <div className={`rounded p-3 text-sm ${m.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
        {m.text}
      </div>
    );

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-slate-800">Edit User</h1>

      <form onSubmit={save} className="space-y-4 rounded-xl bg-white p-6 shadow">
        {banner(msg)}
        <input className={input} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        <input className={input} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="AGENT">Agent</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <div className="flex gap-3">
          <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save Changes</button>
          <Link href="/admin/users" className="rounded border px-4 py-2 text-slate-600">Back</Link>
        </div>
      </form>

      <form onSubmit={resetPassword} className="space-y-4 rounded-xl bg-white p-6 shadow">
        <h2 className="font-semibold text-slate-800">Reset Password</h2>
        {banner(pwMsg)}
        <input className={input} type="password" placeholder="New password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} required />
        <input className={input} type="password" placeholder="Confirm new password" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} required />
        <button className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-900">Reset Password</button>
      </form>
    </div>
  );
}