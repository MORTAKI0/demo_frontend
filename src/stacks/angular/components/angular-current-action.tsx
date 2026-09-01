import { StatusBadge } from "@/components/ui/status-badge";
import type { AngularRunModel } from "../domain/run-types";

export function AngularCurrentAction({ run }: { run: AngularRunModel }) {
  const approved = Object.values(run.gates).filter((gate) => gate.status === "APPROVED").length;
  const preTransformGate =
    run.currentGate && ["G02","G03","G04","G05","G06"].includes(run.currentGate)
      ? run.gates[run.currentGate as keyof typeof run.gates]
      : null;
  const stageGate =
    run.currentGate && run.stageExecution && ["G07","G09","G10","G11","G12"].includes(run.currentGate)
      ? run.stageExecution.gates[run.currentGate as keyof typeof run.stageExecution.gates]
      : null;
  const currentGate = preTransformGate ?? stageGate;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#202633] bg-[var(--mf-graphite)] text-white shadow-xl">
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8f9bae]">Current execution</span>
            <StatusBadge label={run.state} tone={run.state === "COMPLETED" ? "success" : "info"} />
          </div>
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-[-0.035em]">
            {run.currentAction}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#aeb8c8]">
            {currentGate
              ? `${currentGate.id} · ${currentGate.label} is the active governed review boundary.`
              : run.liveExecution
                ? "Execution is active. The next governed review boundary remains unavailable until the running evidence package is finalized."
                : run.phase === "STAGE_PREPARATION"
                  ? "Pre-transform governance is complete. Stage runtime resolution is the next authority boundary."
                  : run.state === "COMPLETED"
                    ? "The requested Angular target has been achieved."
                    : "The workflow is progressing between governed review boundaries."}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">Route</dt>
            <dd className="mt-1 text-sm font-semibold">Angular {run.sourceMajor} → {run.targetMajor}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">Phase</dt>
            <dd className="mt-1 text-sm font-semibold">{run.phase.replaceAll("_", " ")}</dd>
          </div>
          {run.stageExecution ? (
            <>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">Stage</dt>
                <dd className="mt-1 text-sm font-semibold">Angular {run.stageExecution.source} → {run.stageExecution.target}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">Validation</dt>
                <dd className="mt-1 text-sm font-semibold">{run.stageExecution.validation}</dd>
              </div>
            </>
          ) : null}
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">Governance</dt>
            <dd className="mt-1 text-sm font-semibold">{approved} / 5 approved</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">Current gate</dt>
            <dd className="mt-1 text-sm font-semibold">{run.currentGate ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
