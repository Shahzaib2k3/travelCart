"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title, children, confirmLabel, busy, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  // Keep the real dialog in step with the `open` prop
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      // Escape fires "cancel". Our own state decides whether to close.
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-full max-w-md rounded-lg border border-line bg-white p-0 text-ink shadow-[0_16px_48px_rgba(15,27,45,0.2)] backdrop:bg-ink/50"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="font-serif text-xl font-semibold">{title}</h2>
        <div className="mt-2 text-sm leading-6 text-muted">{children}</div>

        <div className="mt-6 flex justify-end gap-3">
          {/* Cancel is focused first, so pressing Enter cannot delete by accident */}
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-line-strong bg-white px-3.5 py-2 text-sm font-medium text-ink hover:bg-sunken disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md border border-transparent bg-danger px-3.5 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50"
          >
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
