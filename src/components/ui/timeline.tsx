import type { ReactNode } from "react";
import { StatusBadge } from "./status-badge";

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  detail?: ReactNode;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-0">
      {items.map((item, index) => (
        <li key={item.id} className="grid grid-cols-[22px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                item.status === "RUNNING" || item.status === "ACTION_REQUIRED"
                  ? "bg-[var(--mf-primary)] ring-4 ring-[#e6ebff]"
                  : item.status === "SEALED" || item.status === "PASSED"
                    ? "bg-[var(--mf-success)]"
                    : "bg-[#c6ced8]"
              }`}
            />
            {index < items.length - 1 ? (
              <span className="my-1 min-h-8 w-px flex-1 bg-[var(--mf-border)]" />
            ) : null}
          </div>
          <div className="pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--mf-text)]">{item.title}</p>
                {item.subtitle ? (
                  <p className="mt-0.5 text-xs text-[var(--mf-text-muted)]">{item.subtitle}</p>
                ) : null}
              </div>
              <StatusBadge label={item.status} />
            </div>
            {item.detail ? <div className="mt-3">{item.detail}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
