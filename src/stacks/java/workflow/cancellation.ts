import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import type { JavaJobModel } from "../domain/run-types.ts";

export function cancelJavaMigration(
  job: JavaJobModel,
  now = "2026-08-31T20:53:00+01:00",
): JavaJobModel {
  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    throw new Error("This Java migration cannot be cancelled from its current terminal state.");
  }

  return {
    ...job,
    status: "CANCELLED",
    cancellationRequested: true,
    currentGate: null,
    currentPhase: "CANCELLATION",
    currentAction: "Migration cancelled; active work has been stopped",
    liveExecution: undefined,
    pipeline: job.pipeline.map((phase) =>
      phase.id === "CANCELLATION"
        ? { ...phase, status: "PASS" as const }
        : phase.status === "RUNNING" || phase.status === "ACTION_REQUIRED"
          ? { ...phase, status: "SKIPPED" as const }
          : phase,
    ),
    evidence: [
      ...job.evidence,
      {
        id: job.id + "-cancellation-" + (job.evidence.length + 1),
        category: "CANCELLATION",
        title: "Migration cancellation accepted",
        summary:
          "Cancellation stopped the active Java workflow and cleared any pending PhaseGate action.",
        timestamp: now,
        checksum: stableDisplayChecksum(job.id + ":cancellation:" + now),
      },
    ],
  };
}
