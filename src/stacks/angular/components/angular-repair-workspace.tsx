import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  AngularRepairAttempt,
  AngularRunModel,
} from "../domain/run-types";

const GOVERNED_OPERATION_KINDS: ReadonlySet<
  AngularRepairAttempt["proposalKind"]
> = new Set([
  "DEPENDENCY_TRANSITION",
  "DEPENDENCY_ADD",
  "DEPENDENCY_CHANGE",
  "TOOLING_TRANSITION",
]);

export function AngularRepairWorkspace({ run }: { run: AngularRunModel }) {
  const stage = run.stageExecution;
  if (!stage || stage.repairAttempts.length === 0) return null;

  return (
    <Panel>
      <PanelHeader
        eyebrow="Governed repair"
        title={`Repair history · Angular ${stage.source} → ${stage.target}`}
        description="Failure evidence is frozen before ownership. The Main Repair LLM may author a bounded candidate only on the governed repair route; the Independent Reviewer critiques it, and G10 human approval is required before the backend can apply the exact persisted operation."
      />

      <div className="mt-5 space-y-3">
        {stage.repairAttempts.map((attempt) => {
          const active = attempt.status === "READY_FOR_G10";
          const governedOperation = GOVERNED_OPERATION_KINDS.has(
            attempt.proposalKind,
          );
          const toolingTransition =
            attempt.proposalKind === "TOOLING_TRANSITION";
          const sourcePatch = attempt.proposalKind === "SOURCE_PATCH";

          return (
            <details
              key={attempt.id}
              open={active}
              className="rounded-xl border border-[var(--mf-border)] bg-white"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4 px-4 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--mf-text-soft)]">
                    Attempt {attempt.attempt}
                    {attempt.parentAttemptId ? " · request-changes child" : ""}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">{attempt.rationale}</h3>
                </div>
                <StatusBadge
                  label={attempt.status}
                  tone={
                    attempt.causalResult === "REPAIR_CAUSAL_KIND_MISMATCH"
                      ? "danger"
                      : active || attempt.reviewerVerdict === "ACCEPT"
                        ? "success"
                        : "warning"
                  }
                />
              </summary>

              <div className="border-t border-[var(--mf-border)] px-4 py-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <Fact label="Failure" value={attempt.failureCategory} />
                  <Fact
                    label="Failure phase"
                    value={attempt.failurePhase ?? "RECORDED"}
                  />
                  <Fact
                    label="Failure owner"
                    value={attempt.failureOwner ?? "DETERMINISTIC"}
                  />
                  <Fact label="Proposal kind" value={attempt.proposalKind} />
                  <Fact label="Operation" value={attempt.operation ?? "BOUND"} />
                </div>

                {attempt.parentAttemptId ? (
                  <div className="mt-3">
                    <Fact label="Parent attempt" value={attempt.parentAttemptId} />
                  </div>
                ) : null}

                {attempt.proposer || attempt.reviewer ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {attempt.proposer ? (
                      <ActorCard
                        title="Main Repair LLM"
                        role={attempt.proposer.role}
                        task={attempt.proposer.task}
                        status={attempt.proposer.status}
                        note="Authors the bounded candidate from frozen failure context. It cannot execute commands, mutate the workspace, or approve a gate."
                      />
                    ) : null}
                    {attempt.reviewer ? (
                      <ActorCard
                        title="Independent Reviewer"
                        role={attempt.reviewer.role}
                        task={attempt.reviewer.task}
                        status={
                          attempt.reviewer.decision
                            ? `${attempt.reviewer.status} · ${attempt.reviewer.decision}`
                            : attempt.reviewer.status
                        }
                        note="Checks causal fit, policy, risk, and validation targets. The Reviewer cannot apply or replace the candidate."
                      />
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 rounded-lg bg-[var(--mf-graphite)] p-4 text-xs text-[#dbe3ee]">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8390a4]">
                    {sourcePatch
                      ? "Candidate diff"
                      : toolingTransition
                        ? "Governed tooling transition"
                        : governedOperation
                          ? "Governed operation"
                          : "Bound repair evidence"}
                  </p>
                  <p className="mb-3 font-mono text-[10px] text-[#aeb8c8]">
                    {attempt.changedFiles.join(", ")}
                  </p>
                  <pre className="whitespace-pre-wrap font-mono leading-5">
                    {attempt.diff}
                  </pre>
                </div>

                {attempt.validationTargets?.length ? (
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">
                      Required validation
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attempt.validationTargets.map((target) => (
                        <span
                          key={target}
                          className="rounded-full border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] px-2.5 py-1 text-[10px] font-semibold"
                        >
                          {target.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {active ? (
                  <div className="mt-4 rounded-lg border border-[#c9d4f7] bg-[#f5f7ff] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#475ca8]">
                          G10 · Waiting for human approval
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[var(--mf-text-muted)]">
                          Approve authorizes only this exact reviewed repair package.
                          The backend applies the persisted typed operation, verifies
                          the post-state, then runs affected validation before the
                          full validation replay.
                        </p>
                      </div>
                      <StatusBadge label="ACTION REQUIRED" tone="warning" />
                    </div>
                  </div>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </Panel>
  );
}

function ActorCard({
  title,
  role,
  task,
  status,
  note,
}: {
  title: string;
  role: string;
  task: string;
  status: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 font-mono text-[10px] text-[var(--mf-text-soft)]">
            {role} · {task}
          </p>
        </div>
        <StatusBadge label={status} />
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--mf-text-muted)]">{note}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--mf-surface-subtle)] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-semibold">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}
