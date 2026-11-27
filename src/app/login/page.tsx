"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Sign in failed. Please try again.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network problem. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel: desktop only */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <div className="text-lg font-semibold tracking-tight">
          Travel Cart <span className="font-normal text-white/60">UK</span>
        </div>

        <div>
          <svg viewBox="0 0 520 240" role="img" aria-label="A flight path from London to Dubai" className="w-full max-w-lg">
            <path d="M 50 190 Q 260 -20 470 60" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" />
            <circle cx="50" cy="190" r="7" fill="#ffffff" />
            <circle cx="470" cy="60" r="7" fill="#ffffff" />
            <circle cx="470" cy="60" r="14" fill="none" stroke="#ffffff" strokeOpacity="0.4" />
            <text x="50" y="222" fill="#ffffff" fontFamily="var(--font-plex-mono), monospace" fontSize="20" fontWeight="500">LHR</text>
            <text x="470" y="38" fill="#ffffff" fontFamily="var(--font-plex-mono), monospace" fontSize="20" fontWeight="500" textAnchor="end">DXB</text>
          </svg>

          <h2 className="mt-10 max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Bookings, travellers and margins, kept in order.
          </h2>
          <p className="mt-3 max-w-md text-white/70">
            The internal dashboard for the Travel Cart booking team.
          </p>
        </div>

        <p className="text-sm text-white/60">Staff access only</p>
      </section>

      {/* Sign-in form */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-12 text-lg font-semibold tracking-tight lg:hidden">
            Travel Cart <span className="font-normal text-muted">UK</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-muted">Use the email and password your admin set up for you.</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5" noValidate>
            {error && <Alert tone="err">{error}</Alert>}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                className="py-2.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  autoComplete="current-password"
                  required
                  className="py-2.5 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-action hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {capsLock && <p className="mt-1 text-xs text-warn">Caps Lock is on.</p>}
            </div>

            <Button disabled={loading} className="mt-1 w-full py-2.5">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-10 text-xs text-muted">
            Forgotten your password? Ask an admin to reset it for you.
          </p>
        </div>
      </section>
    </main>
  );
}