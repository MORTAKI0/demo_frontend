import { DetailRow } from "@/components/shared/detail-row";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AngularRunModel } from "../domain/run-types";
import { AngularRouteBoard } from "./angular-route-board";

export function AngularOverview({ run }: { run: AngularRunModel }) {
  const approved = Object.values(run.gates).filter((gate) => gate.status === "APPROVED");
  const nextGate = Object.values(run.gates).find((gate) => gate.status === "LOCKED");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
      <Panel>
        <PanelHeader eyebrow="Migration route" title={`Angular ${run.sourceMajor} → Angular ${run.targetMajor}`} />
        <div className="mt-5">
          <AngularRouteBoard route={run.route} />
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--mf-text-soft)]">Completed</p>
            <p className="mt-2 text-sm font-semibold">{approved.length > 0 ? `${approved.length} governed reviews` : "G01 readiness"}</p>
          </div>
          <div className="rounded-lg border border-[#cbd7ff] bg-[var(--mf-info-soft)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--mf-info)]">Now</p>
            <p className="mt-2 text-sm font-semibold">{run.currentAction}</p>
          </div>
          <div className="rounded-lg border border-[var(--mf-border)] bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--mf-text-soft)]">Next</p>
            <p className="mt-2 text-sm font-semibold">
              {nextGate ? `${nextGate.id} · ${nextGate.label}` : run.phase === "STAGE_PREPARATION" ? "Stage runtime certification" : "Requested target proof"}
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Run facts" title="Authority" />
        <dl className="mt-4">
          <DetailRow label="Run ID" value={run.id} mono />
          <DetailRow label="State" value={<StatusBadge label={run.state} />} />
          <DetailRow label="Current phase" value={run.phase.replaceAll("_", " ")} />
          <DetailRow label="Baseline" value={run.baseline.outcome.replaceAll("_", " ")} />
          <DetailRow label="Plan revisions" value={run.planning.length || "—"} />
          <DetailRow label="Evidence" value={run.evidence.length} />
        </dl>
      </Panel>
    </div>
  );
}
