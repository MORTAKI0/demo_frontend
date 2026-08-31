import type { ReactNode } from "react";

export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--mf-text)]">{label}</span>
      {hint ? <span className="ml-2 text-xs font-normal text-[var(--mf-text-soft)]">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export const fieldClassName =
  "mf-focus h-10 w-full rounded-[9px] border border-[var(--mf-border-strong)] bg-white px-3 text-sm text-[var(--mf-text)] outline-none transition-colors placeholder:text-[var(--mf-text-soft)] hover:border-[#aeb9c7] focus:border-[var(--mf-primary)]";

export const textareaClassName =
  "mf-focus min-h-24 w-full resize-y rounded-[9px] border border-[var(--mf-border-strong)] bg-white px-3 py-2.5 text-sm text-[var(--mf-text)] outline-none transition-colors placeholder:text-[var(--mf-text-soft)] hover:border-[#aeb9c7] focus:border-[var(--mf-primary)]";
