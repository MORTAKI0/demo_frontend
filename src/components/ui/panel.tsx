import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-[var(--mf-radius-md)] border border-[var(--mf-border)] bg-[var(--mf-surface)] shadow-[var(--mf-shadow)] ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--mf-text-soft)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-base font-semibold tracking-[-0.01em] text-[var(--mf-text)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--mf-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
