import type {
  ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes,
} from "react";
import { inputClass } from "@/components/form-ui";

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

export type Variant = "primary" | "secondary" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-action text-white hover:bg-action-dark",
  secondary: "border border-ink/25 bg-white text-ink hover:bg-wash",
  danger: "border border-bad/40 bg-white text-bad hover:bg-bad/5",
};

// Use on a <Link> when a link should look like a button
export const buttonClass = (variant: Variant = "primary", extra?: string) => cx(base, variants[variant], extra);

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClass(), className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(inputClass(), className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx("mb-1 block text-sm font-medium", className)} {...props} />;
}

// Flat message with a coloured edge, not a tinted rounded box
export function Alert({ tone, children }: { tone: "ok" | "err"; children: ReactNode }) {
  return (
    <div
      role={tone === "err" ? "alert" : "status"}
      className={cx("border-l-4 bg-white px-4 py-3 text-sm", tone === "err" ? "border-bad text-bad" : "border-ok text-ok")}
    >
      {children}
    </div>
  );
}

// A coloured dot plus text instead of a pill badge
export function Status({ tone, children }: { tone: "ok" | "off" | "warn" | "bad"; children: ReactNode }) {
  const dot = { ok: "bg-ok", off: "bg-muted", warn: "bg-warn", bad: "bg-bad" }[tone];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}