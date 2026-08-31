import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AngularRunModel } from "../domain/run-types";

export function AngularRepairWorkspace({ run }: { run: AngularRunModel }) {
  const stage = run.stageExecution;
  if (!stage || stage.repairAttempts.length === 0) return null;

  return (
    <Panel>
      <PanelHeader
        eyebrow="Governed repair"
        title={`Repair history · Angular ${stage.source} → ${stage.target}`}
        description="Every proposal is bound to frozen failure evidence, causal policy, independent review, and a governed human decision."
      />
      <div className="mt-5 space-y-4">
        {stage.repairAttempts.map((attempt) => (
          <article key={attempt.id} className="rounded-xl border border-[var(--mf-border)] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--mf-text-soft)]">Attempt {attempt.attempt}</p>
                <h3 className="mt-1 text-sm font-semibold">{attempt.rationale}</h3>
              </div>
              <StatusBadge
                label={attempt.status}
                tone={attempt.causalResult === "REPAIR_CAUSAL_KIND_MISMATCH" ? "danger" : attempt.reviewerVerdict === "ACCEPT" ? "success" : "warning"}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <Fact label="Failure" value={attempt.failureCategory} />
              <Fact label="Proposal kind" value={attempt.proposalKind} />
              <Fact label="Causal policy" value={attempt.causalResult} />
              <Fact label="Reviewer" value={attempt.reviewerVerdict} />
            </div>
            <div className="mt-4 rounded-lg bg-[var(--mf-graphite)] p-4 text-xs text-[#dbe3ee]">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8390a4]">
                {attempt.changedFiles.join(", ")}
              </p>
              <pre className="whitespace-pre-wrap font-mono leading-5">{attempt.diff}</pre>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function Fact({label,value}:{label:string;value:string}) {
  return (
    <div className="rounded-md bg-[var(--mf-surface-subtle)] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">{label}</p>
      <p className="mt-1 break-words text-xs font-semibold">{value.replaceAll("_"," ")}</p>
    </div>
  );
}
