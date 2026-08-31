import { DetailRow } from "@/components/shared/detail-row";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AngularRunModel } from "../domain/run-types";
import { AngularAssistantPanel } from "./angular-assistant-panel";

export function AngularDiagnosticsWorkspace({
  run,
  onPartialDelivery,
  onRollback,
  onResume,
  onRestart,
}: {
  run: AngularRunModel;
  onPartialDelivery: () => void;
  onRollback: () => void;
  onResume: () => void;
  onRestart: () => void;
}) {
  const sealed = run.route.filter((stage) => stage.status === "SEALED").at(-1);
  const active = run.stageExecution && run.stageExecution.status !== "SEALED";
  const lastDelivery = run.operations.partialDeliveries.at(-1);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel>
        <PanelHeader eyebrow="Diagnostics" title="Current blockers" />
        <div className="mt-5">
          {run.diagnostics.length === 0 ? (
            <div className="rounded-lg border border-[#bfe9d1] bg-[var(--mf-success-soft)] p-4">
              <StatusBadge label="NO BLOCKERS" tone="success" />
              <p className="mt-2 text-sm text-[var(--mf-success)]">
                No terminal diagnostic blocker is recorded for the current workflow state.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {run.diagnostics.map((diagnostic, index) => (
                <li
                  key={`${diagnostic}-${index}`}
                  className="rounded-lg border border-[#f1d69d] bg-[var(--mf-warning-soft)] p-3 text-sm text-[var(--mf-warning)]"
                >
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
          <p
            key={failure}
            className="mt-3 rounded-md bg-[var(--mf-surface-subtle)] p-3 text-xs leading-5 text-[var(--mf-text-muted)]"
          >
            {failure}
          </p>
        ))}
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow="Governed commands"
          title="Execution evidence"
          description="Authorization, exit status, log evidence, and checksums are preserved with each command projection."
        />
        <div className="mt-5 space-y-3">
          {run.operations.commands.length === 0 ? (
            <p className="rounded-lg bg-[var(--mf-surface-subtle)] p-4 text-sm text-[var(--mf-text-muted)]">
              Command evidence appears after governed execution begins.
            </p>
          ) : (
            run.operations.commands.slice(-6).toReversed().map((command) => (
              <article key={command.id} className="rounded-lg border border-[var(--mf-border)] bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-semibold">{command.command}</p>
                    <p className="mt-1 text-[11px] text-[var(--mf-text-soft)]">
                      {command.authorization} · exit {command.exitCode} · {command.timestamp}
                    </p>
                  </div>
                  <StatusBadge label={command.status} />
                </div>
                <pre className="mt-3 whitespace-pre-wrap rounded-md bg-[var(--mf-graphite)] p-3 font-mono text-[10px] leading-5 text-[#c7d0dd]">
                  {command.logs.join("\n")}
                </pre>
              </article>
            ))
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow="Recovery"
          title="Sealed-checkpoint controls"
          description="Only sealed output may authorize rollback, resume, or partial delivery. Restart archives the active unsealed execution before rematerialization."
        />
        <dl className="mt-4">
          <DetailRow
            label="Furthest sealed"
            value={sealed ? `Angular ${sealed.source} → ${sealed.target}` : "None yet"}
          />
          <DetailRow
            label="Active stage"
            value={run.stageExecution ? `Angular ${run.stageExecution.source} → ${run.stageExecution.target}` : "No active stage"}
          />
          <DetailRow label="Rollback history" value={run.operations.rollbacks.length} />
          <DetailRow label="Execution history" value={run.operations.stageHistory.length} />
        </dl>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" disabled={!sealed} onClick={onPartialDelivery}>
            Prepare partial delivery
          </Button>
          <Button variant="secondary" disabled={!sealed || !active} onClick={onRollback}>
            Roll back to sealed
          </Button>
          <Button variant="secondary" disabled={!sealed || Boolean(run.stageExecution)} onClick={onResume}>
            Resume from sealed
          </Button>
          <Button variant="secondary" disabled={!active} onClick={onRestart}>
            Restart active stage
          </Button>
        </div>

        {lastDelivery ? (
          <div className="mt-5 rounded-lg border border-[#bfe9d1] bg-[var(--mf-success-soft)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--mf-success)]">
              Delivery ready
            </p>
            <p className="mt-2 font-mono text-xs text-[var(--mf-success)]">{lastDelivery.artifactPath}</p>
          </div>
        ) : null}
      </Panel>

      <AngularAssistantPanel run={run} />
    </div>
  );
}
