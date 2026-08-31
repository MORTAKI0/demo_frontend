"use client";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  active,
  onChange,
  ariaLabel,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      role="tablist"
      className="flex min-w-0 gap-1 overflow-x-auto border-b border-[var(--mf-border)]"
    >
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={`mf-focus relative flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-semibold transition-colors ${
              selected
                ? "text-[var(--mf-primary)]"
                : "text-[var(--mf-text-muted)] hover:text-[var(--mf-text)]"
            }`}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="rounded-md bg-[var(--mf-surface-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--mf-text-muted)]">
                {item.count}
              </span>
            ) : null}
            {selected ? (
              <span className="absolute inset-x-2 bottom-[-1px] h-0.5 rounded-full bg-[var(--mf-primary)]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
