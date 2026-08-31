import { DetailRow } from "@/components/shared/detail-row";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AngularRunModel } from "../domain/run-types";

export function AngularDiagnosticsWorkspace({ run }: { run: AngularRunModel }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel>
        <PanelHeader eyebrow="Diagnostics" title="Current blockers" />
        <div className="mt-5">
          {run.diagnostics.length === 0 ? (
            <div className="rounded-lg border border-[#bfe9d1] bg-[var(--mf-success-soft)] p-4">
              <StatusBadge label="NO BLOCKERS" tone="success" />
              <p className="mt-2 text-sm text-[var(--mf-success)]">No active diagnostic blocker is recorded for the current governance phase.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {run.diagnostics.map((diagnostic) => (
                <li key={diagnostic} className="rounded-lg border border-[#f1d69d] bg-[var(--mf-warning-soft)] p-3 text-sm text-[var(--mf-warning)]">
                  {diagnostic}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Baseline intelligence" title="Known source behavior" />
        <dl className="mt-4">
          <DetailRow label="Outcome" value={run.baseline.outcome.replaceAll("_", " ")} />
          <DetailRow label="Known failures" value={run.baseline.knownFailures.length} />
          <DetailRow label="Analysis revision" value={`#${run.analysis.revision}`} />
          <DetailRow label="Reviewer" value={run.analysis.reviewerVerdict} />
        </dl>
        {run.baseline.knownFailures.map((failure) => (
          <p key={failure} className="mt-3 rounded-md bg-[var(--mf-surface-subtle)] p-3 text-xs leading-5 text-[var(--mf-text-muted)]">
            {failure}
          </p>
        ))}
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Runtime" title="Stage preparation" />
        <dl className="mt-4">
          <DetailRow label="Execution profiles" value="Available" />
          <DetailRow label="Certification" value={run.phase === "STAGE_PREPARATION" ? "Next action" : "Not required yet"} />
          <DetailRow label="Catalogue" value="Certified" />
          <DetailRow label="Source protection" value="Read-only" />
        </dl>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Recovery" title="Operational controls" />
        <p className="mt-4 text-sm leading-6 text-[var(--mf-text-muted)]">
          Rollback, resume-from-sealed, partial delivery, governed commands, and terminal recovery become available only when the run reaches the corresponding source-backed states.
        </p>
      </Panel>
    </div>
  );
}
