"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, Breadcrumb, Button, buttonClass, EmptyState, Input, Label, Page, PageHeader, Select, Spinner } from "@/components/ui";

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

  if (loading) {
    return (
      <Page size="narrow">
        <div role="status" aria-label="Loading user" className="space-y-4">
          <div className="h-4 w-40 animate-pulse rounded bg-line" />
          <div className="h-8 w-48 animate-pulse rounded bg-line" />
          <div className="panel mt-8 h-80 animate-pulse bg-sunken" />
        </div>
      </Page>
    );
  }

  if (notFound) {
    return (
      <Page size="narrow">
        <div className="panel">
          <EmptyState
            title="User not found"
            action={<Link href="/admin/users" className={buttonClass("secondary")}>Back to User Management</Link>}
          />
        </div>
      </Page>
    );
  }

  return (
    <Page size="narrow">
      <Breadcrumb items={[{ label: "User Management", href: "/admin/users" }, { label: "Edit User" }]} />
      <PageHeader title="Edit User" subtitle={form.email} />

      <form onSubmit={save} className="panel grid gap-5 p-6">
        {error && <Alert tone="err">{error}</Alert>}

        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="role">User Role</Label>
            <Select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Account Status</Label>
            <Select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 border-t border-line pt-5">
          <Button disabled={saving}>
            {saving && <Spinner />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Link href="/admin/users" className={buttonClass("secondary")}>Back</Link>
        </div>
      </form>

      <form onSubmit={resetPassword} className="panel mt-6 grid gap-5 p-6">
        <div>
          <h2 className="text-base font-semibold">Reset password</h2>
          <p className="mt-1 text-sm text-muted">Set a new password for this user. Existing passwords can never be viewed.</p>
        </div>
        {pwError && <Alert tone="err">{pwError}</Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} autoComplete="new-password" required />
          </div>
          <div>
            <Label htmlFor="confirmNew">Confirm New Password</Label>
            <Input id="confirmNew" type="password" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} autoComplete="new-password" required />
          </div>
        </div>
        <div className="border-t border-line pt-5">
          <Button disabled={resetting}>
            {resetting && <Spinner />}
            {resetting ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </form>
    </Page>
  );
}
