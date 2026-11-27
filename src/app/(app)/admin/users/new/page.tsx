"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, Breadcrumb, Button, buttonClass, Input, Label, Page, PageHeader, Select, Spinner } from "@/components/ui";

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
    <Page size="narrow">
      <Breadcrumb items={[{ label: "User Management", href: "/admin/users" }, { label: "Add New User" }]} />
      <PageHeader title="Add New User" subtitle="They can sign in straight away with these details." />

      <form onSubmit={submit} className="panel grid gap-5 p-6">
        {error && <Alert tone="err">{error}</Alert>}

        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={form.fullName} onChange={set("fullName")} required />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" value={form.email} onChange={set("email")} autoComplete="off" required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={set("password")} autoComplete="new-password" required />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" required />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>

        <div className="sm:max-w-xs">
          <Label htmlFor="role">User Role</Label>
          <Select id="role" value={form.role} onChange={set("role")}>
            <option value="AGENT">Agent</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>

        <div className="flex gap-3 border-t border-line pt-5">
          <Button disabled={saving}>
            {saving && <Spinner />}
            {saving ? "Creating..." : "Create User"}
          </Button>
          <Link href="/admin/users" className={buttonClass("secondary")}>Cancel</Link>
        </div>
      </form>
    </Page>
  );
}
