"use client";

import { useEffect, type ReactNode } from "react";

export function Drawer({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
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
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-[#08101d]/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-[min(720px,94vw)] flex-col border-l border-white/10 bg-[var(--mf-graphite)] text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-5 border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-[#aeb8c8]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mf-focus rounded-md px-2 py-1 text-sm font-medium text-[#b9c2d0] hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="mf-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
