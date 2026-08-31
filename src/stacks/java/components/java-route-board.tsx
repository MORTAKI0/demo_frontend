import { StatusBadge } from "@/components/ui/status-badge";
import type { JavaRouteStage } from "../domain/types";

export function JavaRouteBoard({
  route,
  compact = false,
}: {
  route: JavaRouteStage[];
  compact?: boolean;
}) {
  const rowClass = compact
    ? "grid grid-cols-[54px_1fr_auto] items-center gap-3 rounded-lg border border-[var(--mf-border)] bg-white p-2.5"
    : "grid grid-cols-[68px_1fr_auto] items-center gap-3 rounded-lg border border-[var(--mf-border)] bg-white p-3.5";
  const titleClass = compact
    ? "text-xs font-semibold text-[var(--mf-text)]"
    : "text-sm font-semibold text-[var(--mf-text)]";

  return (
    <div className="space-y-2">
      {route.map((stage) => (
        <div key={stage.stage} className={rowClass}>
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.09em] text-[var(--mf-text-soft)]">
              Stage
            </p>
            <p className="mt-0.5 text-sm font-semibold">{stage.stage}</p>
          </div>
          <div className="min-w-0">
            <p className={titleClass}>{stage.label}</p>
            {stage.terminal ? (
              <p className="mt-1 text-[11px] text-[var(--mf-text-muted)]">
                Terminal-special route stage
              </p>
            ) : null}
          </div>
          <StatusBadge
            label={stage.disposition}
            tone={
              stage.disposition === "INCLUDED"
                ? "info"
                : stage.disposition === "SKIPPED"
                  ? "neutral"
                  : "warning"
            }
          />
        </div>
      ))}
    </div>
  );
}
