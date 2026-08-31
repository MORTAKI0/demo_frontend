import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AngularRunModel } from "../domain/run-types";

export function AngularProvenExecution({ run }: { run: AngularRunModel }) {
  const stage = run.stageExecution;
  if (!stage) return null;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          eyebrow="PROVEN stage"
          title={`Angular ${stage.source} → ${stage.target}`}
          description="Runtime certification is bound before G07. Execution is grouped for readability while retaining the underlying restart-safe technical steps."
          action={<StatusBadge label={stage.status} />}
        />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Metric label="Runtime" value={stage.runtime.profile} />
          <Metric label="Certification" value={stage.runtime.certification} />
          <Metric label="Validation" value={stage.validation} />
        </div>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Execution groups" title="Source proof → validation" />
        <div className="mt-5 space-y-3">
          {stage.groups.map((group) => (
            <details key={group.id} className="group rounded-lg border border-[var(--mf-border)] bg-white" open={group.status === "FAILED"}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-semibold">{group.label}</span>
                <StatusBadge label={group.status} />
              </summary>
              <div className="border-t border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] px-4 py-3">
                <div className="grid gap-2 md:grid-cols-2">
                  {group.steps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2">
                      <span className="text-xs font-medium">{step.label}</span>
                      <StatusBadge label={step.status} />
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader eyebrow="Stage gates" title="Applicable modern gate sequence" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(["G07","G09","G10","G11","G12"] as const).map((id) => (
            <div key={id} className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{id}</p>
                  <p className="mt-1 text-[11px] text-[var(--mf-text-muted)]">{stage.gates[id].label}</p>
                </div>
                <StatusBadge label={stage.gates[id].status} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Metric({label,value}:{label:string;value:string}) {
  return (
    <div className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}
