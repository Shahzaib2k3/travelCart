import type { ReactNode } from "react";

export const inputClass = (error?: string) =>
  `w-full rounded border p-2.5 ${error ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"}`;

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
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export function Section({
  title, description, children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      {description ? (
        <p className="mb-4 mt-0.5 text-sm text-slate-500">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}