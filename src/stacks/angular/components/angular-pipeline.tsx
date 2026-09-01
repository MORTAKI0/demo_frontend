import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { Timeline } from "@/components/ui/timeline";
import type { AngularRunModel } from "../domain/run-types";

export function AngularPipeline({ run }: { run: AngularRunModel }) {
  const gateOrder = ["G02", "G03", "G04", "G05", "G06"] as const;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,.8fr)]">
      <div className="space-y-6">
        <Panel>
          <PanelHeader
            eyebrow="Governed lifecycle"
            title="Pre-transformation reviews"
            description="Source snapshot, baseline, analysis, feasibility, and planning remain independent review boundaries."
          />
          <div className="mt-5 space-y-3">
            {gateOrder.map((gateId) => {
              const gate = run.gates[gateId];
              return (
                <div key={gate.id} className="rounded-lg border border-[var(--mf-border)] bg-white p-4">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-sm font-semibold">{gate.id} · {gate.label}</p>
                      <p className="mt-1 text-xs text-[var(--mf-text-muted)]">
                        Revision #{gate.revision} · {gate.decisions.length} decision{gate.decisions.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <StatusBadge label={gate.status} />
                  </div>
                  {gateId === "G03" && run.baseline.outcome !== "PENDING" ? (
                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                      {run.baseline.steps.map((step) => (
                        <div key={step.id} className="rounded-md bg-[var(--mf-surface-subtle)] px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold">{step.label}</span>
                            <StatusBadge label={step.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Panel>

        {run.analysis.status !== "WAITING" ? (
          <Panel>
            <PanelHeader
              eyebrow="G04"
              title="Analysis Proposer + Independent Reviewer"
              action={<StatusBadge label={run.analysis.reviewerVerdict} />}
            />
            <div className="mt-5 rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
              <p className="text-sm font-semibold">{run.analysis.summary}</p>
              <p className="mt-1 text-xs text-[var(--mf-text-muted)]">
                Evidence confidence: {run.analysis.confidence}
              </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ModelCard
                label="Analysis Proposer"
                provider={run.analysis.proposer.provider}
                deployment={run.analysis.proposer.deployment}
                role={run.analysis.proposer.role}
                durationMs={run.analysis.proposer.durationMs}
                inputTokens={run.analysis.proposer.inputTokens}
                outputTokens={run.analysis.proposer.outputTokens}
              />
              <ModelCard
                label="Independent Reviewer"
                provider={run.analysis.reviewer.provider}
                deployment={run.analysis.reviewer.deployment}
                role={run.analysis.reviewer.role}
                durationMs={run.analysis.reviewer.durationMs}
                inputTokens={run.analysis.reviewer.inputTokens}
                outputTokens={run.analysis.reviewer.outputTokens}
              />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">Facts</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {run.analysis.facts.map((fact) => <li key={fact}>• {fact}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">Risks</p>
                <ul className="mt-2 space-y-2 text-sm text-[var(--mf-text-muted)]">
                  {run.analysis.risks.map((risk) => <li key={risk}>• {risk}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">Unknowns</p>
                <p className="mt-2 text-sm text-[var(--mf-text-muted)]">{run.analysis.unknowns.length || "No blocking unknowns"}</p>
              </div>
            </div>
          </Panel>
        ) : null}

        {run.feasibility.status !== "WAITING" ? (
          <Panel>
            <PanelHeader eyebrow="G05" title="Migration readiness" action={<StatusBadge label={run.feasibility.status} />} />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Fact label="Core compatibility" value={run.feasibility.coreCompatibility} />
              <Fact label="Runtime compatibility" value={run.feasibility.runtimeCompatibility} />
              <Fact label="Third-party compatibility" value={run.feasibility.thirdPartySummary} />
              <Fact label="Lockfile authority" value={run.feasibility.lockfileAuthority} />
            </div>
          </Panel>
        ) : null}

        {run.planning.length > 0 ? (
          <Panel>
            <PanelHeader eyebrow="G06" title="Migration plan revisions" />
            <div className="mt-5 space-y-3">
              {run.planning.map((revision) => (
                <div key={revision.revision} className="flex items-start justify-between gap-4 rounded-lg border border-[var(--mf-border)] p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Plan revision #{revision.revision}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--mf-text-muted)]">{revision.summary}</p>
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
                    <p className="mt-3 max-w-lg truncate font-mono text-[10px] text-[var(--mf-text-soft)]">{revision.checksum}</p>
                  </div>
                  <StatusBadge label={revision.status} />
                </div>
              ))}
            </div>
          </Panel>
        ) : null}
      </div>

      <Panel className="h-fit">
        <PanelHeader eyebrow="Migration route" title="Adjacent-major stages" />
        <div className="mt-5">
          <Timeline
            items={run.route.map((step) => ({
              id: step.id,
              title: `Angular ${step.source} → ${step.target}`,
              subtitle: step.status === "PENDING" ? "Awaiting upstream governance" : "Stage authority created",
              status: step.status,
            }))}
          />
        </div>
      </Panel>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
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
    <div className="rounded-lg border border-[var(--mf-border)] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold">{label}</p>
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
