import { DetailRow } from "@/components/shared/detail-row";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { JavaJobModel } from "../domain/run-types";
import { JavaRouteBoard } from "./java-route-board";

export function JavaOverview({ job }: { job: JavaJobModel }) {
  const included = job.route.filter((stage) => stage.disposition === "INCLUDED");
  const completedStages = job.stageResults.filter((result) => result.status === "PASS");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
      <Panel>
        <PanelHeader
          eyebrow="Migration route"
          title="Spring Boot profile progression"
          description="Route projection is independent from the execution phase pipeline and remains stable until an explicit source-profile override creates a new route authority."
        />
        <div className="mt-5">
          <JavaRouteBoard route={job.route} compact />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">Included</p>
            <p className="mt-2 text-xl font-semibold">{included.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">Completed</p>
            <p className="mt-2 text-xl font-semibold">{completedStages.length}</p>
          </div>
          <div className="rounded-lg border border-[#cbd7ff] bg-[var(--mf-info-soft)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-info)]">Current stage</p>
            <p className="mt-2 text-xl font-semibold">{job.currentStage ?? "—"}</p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Job authority" title="Configuration" />
        <dl className="mt-4">
          <DetailRow label="Job ID" value={job.id} mono />
          <DetailRow label="State" value={<StatusBadge label={job.status} />} />
          <DetailRow label="Current phase" value={job.currentPhase.replaceAll("_", " ")} />
          <DetailRow label="Current gate" value={job.currentGate?.replaceAll("_", " ") ?? "—"} />
          <DetailRow label="Continuation" value={job.configuration.continuationPolicy.replaceAll("_", " ")} />
          <DetailRow label="Proof level" value={job.configuration.proofLevel} />
          <DetailRow label="Max repair attempts" value={job.configuration.maxRepairAttempts} />
          <DetailRow label="Pre-transform approval" value="Human required" />
        </dl>
      </Panel>
    </div>
  );
}
