import Link from "next/link";
import type {
  ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes,
} from "react";
import { inputClass } from "@/components/form-ui";

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

export type Variant = "primary" | "secondary" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-ink text-white hover:bg-ink-soft",
  secondary: "border-line-strong bg-white text-ink hover:bg-sunken",
  danger: "border-danger/30 bg-white text-danger hover:bg-danger-soft",
};

// Use on a <Link> when a link should look like a button
export const buttonClass = (variant: Variant = "primary", extra?: string) => cx(base, variants[variant], extra);

export function Button({
  variant = "primary", className, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClass(), className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(inputClass(), className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx("mb-1.5 block text-[13px] font-medium text-ink", className)} {...props} />;
}

export function Alert({ tone, children }: { tone: "ok" | "err"; children: ReactNode }) {
  return (
    <div
      role={tone === "err" ? "alert" : "status"}
      className={cx(
        "rounded-md border px-3.5 py-2.5 text-sm",
        tone === "err" ? "border-danger/25 bg-danger-soft text-danger" : "border-success/25 bg-success-soft text-success",
      )}
    >
      {children}
    </div>
  );
}

// A small coloured dot plus text, instead of a pill badge
export function Status({ tone, children }: { tone: "ok" | "off" | "warn" | "bad"; children: ReactNode }) {
  const dot = { ok: "bg-success", off: "bg-subtle", warn: "bg-warn", bad: "bg-danger" }[tone];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`${className} animate-spin`} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Consistent page width and padding
export function Page({ size = "wide", children }: { size?: "wide" | "form" | "narrow"; children: ReactNode }) {
  const width = { wide: "max-w-6xl", form: "max-w-5xl", narrow: "max-w-2xl" }[size];
  return <div className={`mx-auto w-full ${width} px-5 py-8 sm:px-8 lg:py-10`}>{children}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-serif text-[26px] font-semibold leading-8 tracking-[-0.01em]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string; mono?: boolean }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="text-line-strong">/</span>}
            {item.href ? (
              <Link href={item.href} className={`hover:text-ink hover:underline ${item.mono ? "font-mono text-[13px]" : ""}`}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={`text-ink ${item.mono ? "font-mono text-[13px]" : ""}`}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      {children && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
