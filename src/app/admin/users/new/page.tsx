"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "", role: "AGENT" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not create user");
      setSaving(false);
      return;
    }
    router.push("/admin/users");
  }

  const input = "w-full rounded border border-slate-300 p-2.5";

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Add New User</h1>
      <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow">
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <input className={input} placeholder="Full Name" value={form.fullName} onChange={set("fullName")} required />
        <input className={input} type="email" placeholder="Email Address" value={form.email} onChange={set("email")} required />
        <input className={input} type="password" placeholder="Password" value={form.password} onChange={set("password")} required />
        <input className={input} type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={set("confirmPassword")} required />
        <select className={input} value={form.role} onChange={set("role")}>
          <option value="AGENT">Agent</option>
          <option value="ADMIN">Admin</option>
        </select>
        <p className="text-xs text-slate-500">Password: at least 8 characters with an uppercase letter, a lowercase letter and a number.</p>
        <div className="flex gap-3">
          <button disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Create User"}
          </button>
          <Link href="/admin/users" className="rounded border px-4 py-2 text-slate-600">Cancel</Link>
        </div>
      </form>
    </div>
  );
}