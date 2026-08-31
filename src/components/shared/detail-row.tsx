import type { ReactNode } from "react";

export function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(130px,0.7fr)_minmax(0,1fr)] gap-4 border-b border-[var(--mf-border)] py-3 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--mf-text-soft)]">
        {label}
      </dt>
      <dd className={`min-w-0 text-sm text-[var(--mf-text)] ${mono ? "font-mono text-[12px]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
