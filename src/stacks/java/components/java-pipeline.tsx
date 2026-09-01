import type React from "react";
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
          <PhaseDisclosure
            title="Analysis Agent · reviewed revisions"
            status={job.analysis.at(-1)?.status ?? "READY_FOR_REVIEW"}
            active={job.currentGate === "analysis_review"}
            summary={job.analysis.at(-1)?.summary ?? "Reviewed analysis"}
          >
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
                  <p className="mt-3 text-xs leading-5 text-[var(--mf-text-muted)]">
                    {revision.summary}
                  </p>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    <ModelCard
                      label="Analysis Proposer"
                      provider={revision.proposer.provider}
                      deployment={revision.proposer.deployment}
                      role={revision.proposer.role}
                      durationMs={revision.proposer.durationMs}
                      inputTokens={revision.proposer.inputTokens}
                      outputTokens={revision.proposer.outputTokens}
                    />
                    <ModelCard
                      label="Independent Reviewer"
                      provider={revision.reviewer.provider}
                      deployment={revision.reviewer.deployment}
                      role={revision.reviewer.role}
                      durationMs={revision.reviewer.durationMs}
                      inputTokens={revision.reviewer.inputTokens}
                      outputTokens={revision.reviewer.outputTokens}
                    />
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
          </PhaseDisclosure>
        ) : null}

        {job.planning.length > 0 ? (
          <PhaseDisclosure
            title="Planning Agent · reviewed route plan"
            status={job.planning.at(-1)?.status ?? "READY_FOR_REVIEW"}
            active={job.currentGate === "planning_review"}
            summary={job.planning.at(-1)?.summary ?? "Reviewed planning revision"}
          >
            <Panel>
            <PanelHeader eyebrow="Planning Agent" title="Plan revisions" />
            <div className="mt-5 space-y-3">
              {job.planning.map((revision) => (
                <div key={revision.revision} className="flex items-start justify-between gap-4 rounded-lg border border-[var(--mf-border)] p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Plan revision #{revision.revision}</p>
                    <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--mf-text-muted)]">{revision.summary}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <ModelCard
                        label="Planning Proposer"
                        provider={revision.proposer.provider}
                        deployment={revision.proposer.deployment}
                        role={revision.proposer.role}
                        durationMs={revision.proposer.durationMs}
                        inputTokens={revision.proposer.inputTokens}
                        outputTokens={revision.proposer.outputTokens}
                      />
                      <ModelCard
                        label="Planning Reviewer"
                        provider={revision.reviewer.provider}
                        deployment={revision.reviewer.deployment}
                        role={revision.reviewer.role}
                        durationMs={revision.reviewer.durationMs}
                        inputTokens={revision.reviewer.inputTokens}
                        outputTokens={revision.reviewer.outputTokens}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <PlanList title="Route plan" items={revision.routePlan} />
                      <PlanList title="Execution units" items={revision.executionUnits} />
                      <PlanList title="Validation targets" items={revision.validationTargets} mono />
                      <PlanList title="Governance constraints" items={revision.constraints} />
                      <PlanList title="Planning rationale" items={revision.rationale} />
                      <PlanList title="Reviewer conclusions" items={revision.reviewerNotes} />
                    </div>
                  </div>
                  <StatusBadge label={revision.status} />
                </div>
              ))}
            </div>
            </Panel>
          </PhaseDisclosure>
        ) : null}

        {job.assessment.status !== "WAITING" ? (
          <PhaseDisclosure
            title="Assessment Agent · execution readiness"
            status={job.assessment.status}
            active={job.currentPhase === "ASSESSMENT_AGENT"}
            summary={job.assessment.summary}
          >
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
          </PhaseDisclosure>
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


function PhaseDisclosure({
  title,
  status,
  active,
  summary,
  children,
}: {
  title: string;
  status: string;
  active: boolean;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <details
      key={title + ":" + String(active)}
      open={active}
      className="rounded-xl border border-[var(--mf-border)] bg-white shadow-sm"
    >
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--mf-text-muted)]">{summary}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">
              {active ? "Current phase detail" : "Completed phase detail · click to reopen"}
            </p>
          </div>
          <StatusBadge label={status} />
        </div>
      </summary>
      <div className="border-t border-[var(--mf-border)] p-4">{children}</div>
    </details>
  );
}

function PlanList({ title, items, mono = false }: { title: string; items: string[]; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">{title}</p>
      <ul className={"mt-2 space-y-1 text-xs leading-5 text-[var(--mf-text-muted)] " + (mono ? "font-mono text-[10px]" : "")}>
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}


function ModelCard({
  label,
  provider,
  deployment,
  role,
  durationMs,
  inputTokens,
  outputTokens,
}: {
  label: string;
  provider: string;
  deployment: string;
  role: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
}) {
  return (
    <div className="rounded-md border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold">{label}</p>
        <StatusBadge label="SUCCEEDED" />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
        <div>
          <dt className="font-bold uppercase tracking-[0.06em] text-[var(--mf-text-soft)]">Provider</dt>
          <dd className="mt-0.5 font-medium">{provider.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase tracking-[0.06em] text-[var(--mf-text-soft)]">Model</dt>
          <dd className="mt-0.5 font-mono">{deployment}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase tracking-[0.06em] text-[var(--mf-text-soft)]">Role</dt>
          <dd className="mt-0.5">{role.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt className="font-bold uppercase tracking-[0.06em] text-[var(--mf-text-soft)]">Duration</dt>
          <dd className="mt-0.5">{(durationMs / 1000).toFixed(1)}s</dd>
        </div>
        <div>
          <dt className="font-bold uppercase tracking-[0.06em] text-[var(--mf-text-soft)]">Input</dt>
          <dd className="mt-0.5">{inputTokens.toLocaleString()} tokens</dd>
        </div>
        <div>
          <dt className="font-bold uppercase tracking-[0.06em] text-[var(--mf-text-soft)]">Output</dt>
          <dd className="mt-0.5">{outputTokens.toLocaleString()} tokens</dd>
        </div>
      </dl>
    </div>
  );
}
