"use client";

import { useEffect, type ReactNode } from "react";

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center px-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#08101d]/35"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--mf-border)] bg-white shadow-2xl"
      >
        <div className="border-b border-[var(--mf-border)] px-6 py-5">
          <h2 className="font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--mf-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-[var(--mf-border)] px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
