import type { ReactNode } from "react";

export const inputClass = (error?: string) =>
  [
    "block w-full rounded-md border bg-white px-3 py-2 text-sm leading-5 text-ink outline-none transition-shadow",
    "placeholder:text-subtle disabled:bg-sunken disabled:text-muted",
    error
      ? "border-danger focus:ring-[3px] focus:ring-danger/15"
      : "border-line-strong focus:border-accent focus:ring-[3px] focus:ring-accent/15",
  ].join(" ");

export function Field({
  label, htmlFor, required, error, hint, children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
        {required && <span aria-hidden className="text-danger"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

// One block of a long form. The title stays in view on the left while you scroll the fields.
// Place several inside a <div className="panel divide-y divide-line">.
export function Section({
  title, description, children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-x-12 gap-y-5 px-6 py-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
