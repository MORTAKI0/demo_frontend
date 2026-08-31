import { StatusBadge } from "@/components/ui/status-badge";
import type { JavaJobModel } from "../domain/run-types";

export function JavaCurrentAction({ job }: { job: JavaJobModel }) {
  const activeGate = job.currentGate
    ? job.phaseGates.find((gate) => gate.type === job.currentGate && gate.status === "PENDING")
    : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#202633] bg-[var(--mf-graphite)] text-white shadow-xl">
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8f9bae]">
              Current execution
            </span>
            <StatusBadge label={job.status} />
          </div>
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-[-0.035em]">
            {job.currentAction}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#aeb8c8]">
            {job.currentStage === 4
              ? "Terminal Stage 4 is active. Normal Java PhaseGates are intentionally unavailable."
              : activeGate
                ? activeGate.type.replaceAll("_", " ") + " is the active reviewed phase boundary."
                : "The current Java pipeline phase may advance until the next source-backed PhaseGate."}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">Route stage</dt>
            <dd className="mt-1 text-sm font-semibold">{job.currentStage ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">Pipeline phase</dt>
            <dd className="mt-1 text-sm font-semibold">{job.currentPhase.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">PhaseGate</dt>
            <dd className="mt-1 text-sm font-semibold">{job.currentGate?.replaceAll("_", " ") ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">Continuation</dt>
            <dd className="mt-1 text-sm font-semibold">{job.configuration.continuationPolicy.replaceAll("_", " ")}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
