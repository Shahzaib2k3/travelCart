"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, Button, buttonClass, Input, Label, PageHeader, Select } from "@/components/ui";

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "", role: "AGENT" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not create the user");
        setSaving(false);
        return;
      }
      toast.success(`${form.fullName} can now sign in`);
      router.push("/admin/users");
    } catch {
      setError("Network problem. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <PageHeader title="Add New User" subtitle="They can sign in straight away with these details." />

      <form onSubmit={submit} className="grid gap-5 border border-rule bg-white p-6">
        {error && <Alert tone="err">{error}</Alert>}

        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={form.fullName} onChange={set("fullName")} required />
        </div>
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" value={form.email} onChange={set("email")} autoComplete="off" required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={set("password")} autoComplete="new-password" required />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" required />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>

        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" value={form.role} onChange={set("role")}>
            <option value="AGENT">Agent</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>

        <div className="flex gap-3 border-t border-rule pt-5">
          <Button disabled={saving}>{saving ? "Creating..." : "Create User"}</Button>
          <Link href="/admin/users" className={buttonClass("secondary")}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}