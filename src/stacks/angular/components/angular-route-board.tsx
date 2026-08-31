import type { AngularRouteStep } from "../domain/types";

export function AngularRouteBoard({
  route,
  compact = false,
}: {
  route: AngularRouteStep[];
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {route.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <div
            className={`rounded-lg border border-[var(--mf-border)] bg-white font-semibold text-[var(--mf-text)] ${
              compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2.5 text-sm"
            }`}
          >
            Angular {step.source} → {step.target}
          </div>
          {index < route.length - 1 ? (
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 text-[var(--mf-text-soft)]">
              <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </div>
      ))}
    </div>
  );
}
