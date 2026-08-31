import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { JavaJobModel } from "../domain/run-types";
import { JavaRouteBoard } from "./java-route-board";

export function JavaPipeline({ job }: { job: JavaJobModel }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
      <div className="space-y-6">
        <Panel>
          <PanelHeader
            eyebrow="Execution phases"
            title="Java phase pipeline"
            description="Execution phases describe what the agents and validators are doing. They are intentionally independent from the Spring Boot route stages."
          />
          <div className="mt-5 space-y-2">
            {job.pipeline.map((phase) => (
              <div
                key={phase.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-[var(--mf-border)] bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{phase.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--mf-text-muted)]">{phase.detail}</p>
                </div>
                <StatusBadge label={phase.status} />
              </div>
            ))}
          </div>
        </Panel>

        {job.analysis.length > 0 ? (
          <Panel>
            <PanelHeader eyebrow="Analysis Agent" title="Analysis revisions" />
            <div className="mt-5 space-y-3">
              {job.analysis.map((revision) => (
                <div key={revision.revision} className="rounded-lg border border-[var(--mf-border)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Analysis revision #{revision.revision}</p>
                      <p className="mt-1 text-xs text-[var(--mf-text-muted)]">
                        Source profile: {revision.sourceProfile.replaceAll("_", " ")}
                      </p>
                    </div>
                    <StatusBadge label={revision.status} />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">Facts</p>
                      <ul className="mt-2 space-y-1 text-xs text-[var(--mf-text)]">
                        {revision.facts.map((fact) => <li key={fact}>• {fact}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">Risks</p>
                      <ul className="mt-2 space-y-1 text-xs text-[var(--mf-text-muted)]">
                        {revision.risks.map((risk) => <li key={risk}>• {risk}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        {job.planning.length > 0 ? (
          <Panel>
            <PanelHeader eyebrow="Planning Agent" title="Plan revisions" />
            <div className="mt-5 space-y-3">
              {job.planning.map((revision) => (
                <div key={revision.revision} className="flex items-start justify-between gap-4 rounded-lg border border-[var(--mf-border)] p-4">
                  <div>
                    <p className="text-sm font-semibold">Plan revision #{revision.revision}</p>
                    <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--mf-text-muted)]">{revision.summary}</p>
                  </div>
                  <StatusBadge label={revision.status} />
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        {job.assessment.status !== "WAITING" ? (
          <Panel>
            <PanelHeader
              eyebrow="Assessment Agent"
              title="Assessment"
              action={<StatusBadge label={job.assessment.status} />}
            />
            <p className="mt-4 text-sm leading-6 text-[var(--mf-text-muted)]">{job.assessment.summary}</p>
            <p className="mt-3 text-xs font-semibold text-[var(--mf-text-soft)]">
              Assessment is an execution phase. No assessment_review PhaseGate exists.
            </p>
          </Panel>
        ) : null}
      </div>

      <div className="space-y-6">
        <Panel>
          <PanelHeader
            eyebrow="Route"
            title="Spring Boot stages"
            description="Included, skipped, and excluded route stages do not change when the pipeline advances."
          />
          <div className="mt-5">
            <JavaRouteBoard route={job.route} compact />
          </div>
        </Panel>

        <Panel>
          <PanelHeader eyebrow="PhaseGates" title="Review history" />
          <div className="mt-5 space-y-3">
            {job.phaseGates.length === 0 ? (
              <p className="text-sm text-[var(--mf-text-muted)]">No reviewed phase boundary has been created yet.</p>
            ) : (
              job.phaseGates.toReversed().map((gate) => (
                <div key={gate.id} className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold">{gate.type.replaceAll("_", " ")}</p>
                      <p className="mt-1 text-[10px] text-[var(--mf-text-soft)]">
                        Stage {gate.stage} · revision #{gate.revision}
                      </p>
                    </div>
                    <StatusBadge label={gate.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
