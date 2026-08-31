import Link from "next/link";
import type { ReactNode } from "react";

export function TechnologyCard({
  eyebrow,
  title,
  description,
  meta,
  href,
  action,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  meta: string[];
  href: string;
  action: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mf-focus group flex min-h-[330px] flex-col rounded-2xl border border-[var(--mf-border)] bg-white p-7 shadow-[var(--mf-shadow)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#b8c6f3] hover:shadow-[0_18px_45px_rgba(19,31,52,0.09)]"
    >
      <div className="flex items-start justify-between gap-5">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] text-[var(--mf-text)]">
          {icon}
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--mf-text-soft)]">
          {eyebrow}
        </span>
      </div>
      <div className="mt-10">
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[var(--mf-text)]">
          {title}
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--mf-text-muted)]">
          {description}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {meta.map((item) => (
          <span
            key={item}
            className="rounded-md border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--mf-text-muted)]"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-[var(--mf-border)] pt-5 text-sm font-semibold text-[var(--mf-primary)]">
        <span>{action}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5 transition-transform group-hover:translate-x-1"
          fill="none"
        >
          <path
            d="M4 10h11M11 6l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  );
}
