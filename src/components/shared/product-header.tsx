import Link from "next/link";
import type { ReactNode } from "react";

export function ProductHeader({
  breadcrumb,
  actions,
}: {
  breadcrumb?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-[var(--mf-border)] bg-white/95 backdrop-blur">
      <div className="mf-container flex h-16 items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="mf-focus flex items-center gap-2 rounded-md font-semibold tracking-[-0.02em] text-[var(--mf-text)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--mf-graphite)] text-xs font-bold text-white">
              MF
            </span>
            <span className="hidden sm:inline">Migration Factory</span>
          </Link>
          {breadcrumb ? (
            <>
              <span className="text-[var(--mf-border-strong)]">/</span>
              <span className="truncate text-sm font-medium text-[var(--mf-text-muted)]">
                {breadcrumb}
              </span>
            </>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
