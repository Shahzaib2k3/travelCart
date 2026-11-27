"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, Button, buttonClass, Input, Label, PageHeader, Select } from "@/components/ui";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState({ fullName: "", email: "", role: "AGENT", status: "ACTIVE" });
  const [pw, setPw] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch(`/api/users/${id}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return setNotFound(true);
        const d = await r.json();
        setForm({ fullName: d.user.fullName, email: d.user.email, role: d.user.role, status: d.user.status });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) toast.success("User updated");
    else setError(data.error ?? "Could not update the user");
    setSaving(false);
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (resetting) return;
    setResetting(true);
    setPwError("");

    const res = await fetch(`/api/users/${id}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pw),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      toast.success("Password reset");
      setPw({ password: "", confirmPassword: "" });
    } else {
      setPwError(data.error ?? "Could not reset the password");
    }
    setResetting(false);
  }

  if (loading) return <div className="p-6 text-muted">Loading user...</div>;

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-6 py-8">
        <div className="border border-rule bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">User not found</h1>
          <Link href="/admin/users" className="mt-4 inline-block text-action hover:underline">Back to User Management</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <PageHeader title="Edit User" subtitle={form.email} />

      <form onSubmit={save} className="grid gap-5 border border-rule bg-white p-6">
        {error && <Alert tone="err">{error}</Alert>}

        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Account status</Label>
            <Select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 border-t border-rule pt-5">
          <Button disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          <Link href="/admin/users" className={buttonClass("secondary")}>Back</Link>
        </div>
      </form>

      <form onSubmit={resetPassword} className="mt-6 grid gap-5 border border-rule bg-white p-6">
        <div>
          <h2 className="text-base font-semibold">Reset password</h2>
          <p className="mt-1 text-sm text-muted">Set a new password for this user. Existing passwords can never be viewed.</p>
        </div>
        {pwError && <Alert tone="err">{pwError}</Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} autoComplete="new-password" required />
          </div>
          <div>
            <Label htmlFor="confirmNew">Confirm new password</Label>
            <Input id="confirmNew" type="password" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} autoComplete="new-password" required />
          </div>
        </div>
        <div className="border-t border-rule pt-5">
          <Button disabled={resetting}>{resetting ? "Resetting..." : "Reset Password"}</Button>
        </div>
      </form>
    </div>
  );
}