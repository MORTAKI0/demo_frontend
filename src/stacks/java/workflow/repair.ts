import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import type {
  JavaGateDecision,
  JavaJobModel,
  JavaPhaseGate,
  JavaRepairAttempt,
} from "../domain/run-types.ts";

const REPAIR_TEST_PATH = "src/test/java/com/acme/OrderServiceTest.java";

function renderJavaRepairDiff(): string {
  return [
    `diff --git a/${REPAIR_TEST_PATH} b/${REPAIR_TEST_PATH}`,
    `--- a/${REPAIR_TEST_PATH}`,
    `+++ b/${REPAIR_TEST_PATH}`,
    "@@ -42,3 +42,3 @@",
    "     assertThat(result).isNotNull();",
    '-    assertThat(result.getLegacyStatus()).isEqualTo("READY");',
    '+    assertThat(result.getStatus()).isEqualTo("READY");',
    "     assertThat(result.isValid()).isTrue();",
  ].join("\n");
}

function currentRepairGate(job: JavaJobModel): JavaPhaseGate {
  const gate = job.phaseGates.at(-1);
  if (!gate || gate.type !== "repair_review" || gate.status !== "PENDING") {
    throw new Error("No pending Java repair_review PhaseGate is available.");
  }
  return gate;
}

function repairGate(job: JavaJobModel, revision: number): JavaPhaseGate {
  if (job.currentStage !== 1 && job.currentStage !== 2 && job.currentStage !== 3) {
    throw new Error("Java Stage 4 cannot own repair_review.");
  }
  return {
    id:
      job.id +
      "-repair_review-s" +
      job.currentStage +
      "-r" +
      revision,
    type: "repair_review",
    stage: job.currentStage,
    status: "PENDING",
    revision,
    checksum: stableDisplayChecksum(
      job.id +
        ":repair_review:" +
        job.currentStage +
        ":" +
        revision,
    ),
    decisions: [],
  };
}

function buildAttempt(
  job: JavaJobModel,
  attempt: number,
  reason: "INITIAL" | "REANALYZE" | "REVISE",
  now: string,
): JavaRepairAttempt {
  const suffix =
    reason === "INITIAL"
      ? "Fix the failing compatibility assertion without changing unrelated dependencies."
      : reason === "REANALYZE"
        ? "Reanalyzed failure evidence and narrowed the repair to the directly failing source surface."
        : "Revised the reviewed source patch according to repair gate feedback.";

  if (job.currentStage !== 1 && job.currentStage !== 2 && job.currentStage !== 3) {
    throw new Error("Java Stage 4 cannot own a normal repair attempt.");
  }

  return {
    id: job.id + "-repair-s" + job.currentStage + "-attempt-" + attempt,
    stage: job.currentStage,
    attempt,
    status: "REVIEWED",
    failureKind: "BUILD_OR_TEST_FAILURE",
    diagnosis:
      "Test validation failed after transformation; Maven build remains structurally valid.",
    proposerSummary: suffix,
    reviewerVerdict: "ACCEPT",
    changedFiles: [REPAIR_TEST_PATH],
    diff: renderJavaRepairDiff(),
    checksum: stableDisplayChecksum(
      job.id +
        ":repair-attempt:" +
        job.currentStage +
        ":" +
        attempt +
        ":" +
        reason,
    ),
    createdAt: now,
  };
}

export function enterJavaRepair(
  job: JavaJobModel,
  now = "2026-08-31T20:50:00+01:00",
): JavaJobModel {
  if (job.currentStage !== 1 && job.currentStage !== 2 && job.currentStage !== 3) {
    throw new Error("Normal Java repair is available only for route stages 1–3.");
  }
  if (job.currentPhase !== "TEST_VALIDATION" || job.currentGate !== null) {
    throw new Error(
      "Java repair can begin only from failed test validation with no unresolved PhaseGate.",
    );
  }

  const stageAttempts = job.repair.attempts.filter(
    (attempt) => attempt.stage === job.currentStage,
  );
  if (stageAttempts.length >= job.repair.maxAttempts) {
    throw new Error(
      "Maximum governed repair attempts reached for Java Stage " +
        job.currentStage +
        ".",
    );
  }

  const attemptNumber = stageAttempts.length + 1;
  const gateRevision =
    job.phaseGates.filter(
      (gate) =>
        gate.type === "repair_review" && gate.stage === job.currentStage,
    ).length + 1;
  const attempt = buildAttempt(job, attemptNumber, "INITIAL", now);
  const gate = repairGate(job, gateRevision);

  return {
    ...job,
    status: "ACTION_REQUIRED",
    currentPhase: "REPAIR_FAILURE",
    currentGate: "repair_review",
    currentAction: "Review proposed repair after build/test failure",
    repair: {
      ...job.repair,
      attempts: [...job.repair.attempts, attempt],
    },
    phaseGates: [...job.phaseGates, gate],
    stageResults: [
      ...job.stageResults,
      {
        stage: job.currentStage,
        status: "FAILED",
        build: "PASS",
        tests: "FAILED",
        completedAt: now,
      },
    ],
    pipeline: job.pipeline.map((phase) =>
      phase.id === "TEST_VALIDATION"
        ? { ...phase, status: "FAILED" as const }
        : phase.id === "REPAIR_FAILURE"
          ? { ...phase, status: "ACTION_REQUIRED" as const }
          : phase,
    ),
    evidence: [
      ...job.evidence,
      {
        id: job.id + "-failure-s" + job.currentStage,
        category: "FAILURE",
        title: "Java test validation failed",
        summary:
          "Failure evidence and diagnosis were frozen before repair proposal generation.",
        timestamp: now,
        checksum: stableDisplayChecksum(
          job.id + ":failure:" + job.currentStage,
        ),
      },
      {
        id: attempt.id,
        category: "REPAIR",
        title: "Repair Proposer + Reviewer",
        summary:
          "Repair attempt " +
          attempt.attempt +
          " for Java Stage " +
          attempt.stage +
          " was proposed, independently reviewed, and is ready for repair_review.",
        timestamp: now,
        checksum: attempt.checksum,
      },
    ],
  };
}

function latestStageAttemptIndex(job: JavaJobModel): number {
  for (let index = job.repair.attempts.length - 1; index >= 0; index -= 1) {
    if (job.repair.attempts[index]?.stage === job.currentStage) {
      return index;
    }
  }
  return -1;
}

function updateLatestStageAttempt(
  job: JavaJobModel,
  status: JavaRepairAttempt["status"],
): JavaRepairAttempt[] {
  const target = latestStageAttemptIndex(job);
  if (target < 0) {
    throw new Error(
      "No Java repair attempt exists for the current route stage.",
    );
  }

  return job.repair.attempts.map((attempt, index) =>
    index === target ? { ...attempt, status } : attempt,
  );
}

function currentStageAttempts(job: JavaJobModel): JavaRepairAttempt[] {
  return job.repair.attempts.filter(
    (attempt) => attempt.stage === job.currentStage,
  );
}

function updateGate(
  job: JavaJobModel,
  gate: JavaPhaseGate,
): JavaPhaseGate[] {
  return job.phaseGates.map((candidate) =>
    candidate.id === gate.id ? gate : candidate,
  );
}

export function applyJavaRepairDecision(
  job: JavaJobModel,
  decision: Extract<
    JavaGateDecision,
    "CONTINUE" | "REANALYZE" | "REVISE" | "REJECT"
  >,
  comment = "",
  now = "2026-08-31T20:51:00+01:00",
): JavaJobModel {
  if (job.currentGate !== "repair_review") {
    throw new Error("repair_review is not the active Java PhaseGate.");
  }
  const gate = currentRepairGate(job);
  const record = {
    id: gate.id + "-decision-" + (gate.decisions.length + 1),
    decision,
    timestamp: now,
    checksum: gate.checksum,
    comment: comment.trim() || undefined,
  };
  const decidedGate: JavaPhaseGate = {
    ...gate,
    status: decision === "REJECT" ? "REJECTED" : "APPROVED",
    decisions: [...gate.decisions, record],
  };
  const base: JavaJobModel = {
    ...job,
    phaseGates: updateGate(job, decidedGate),
    evidence: [
      ...job.evidence,
      {
        id: record.id,
        category: "DECISION",
        title: "repair_review decision",
        summary: decision.replaceAll("_", " "),
        timestamp: now,
        checksum: stableDisplayChecksum(gate.checksum + ":" + decision),
      },
    ],
  };

  if (decision === "REJECT") {
    return {
      ...base,
      status: "ACTION_REQUIRED",
      currentGate: null,
      currentAction: "Repair rejected; migration remains stopped at failed validation",
      repair: {
        ...base.repair,
        attempts: updateLatestStageAttempt(base, "REJECTED"),
      },
    };
  }

  if (decision === "CONTINUE") {
    return {
      ...base,
      status: "RUNNING",
      currentGate: null,
      currentPhase: "TEST_VALIDATION",
      currentAction: "Revalidate applied repair with Maven build and tests",
      repair: {
        ...base.repair,
        attempts: updateLatestStageAttempt(base, "APPLIED"),
      },
      pipeline: base.pipeline.map((phase) =>
        phase.id === "REPAIR_FAILURE"
          ? { ...phase, status: "PASS" as const }
          : phase.id === "TEST_VALIDATION"
            ? { ...phase, status: "RUNNING" as const }
            : phase,
      ),
      evidence: [
        ...base.evidence,
        {
          id:
            base.id +
            "-repair-applied-s" +
            base.currentStage +
            "-" +
            currentStageAttempts(base).length,
          category: "REPAIR",
          title: "Reviewed repair applied",
          summary:
            "The persisted reviewed diff was applied; full build/test revalidation is required before stage progression.",
          timestamp: now,
          checksum: stableDisplayChecksum(
            base.id +
              ":repair-applied:" +
              base.currentStage +
              ":" +
              currentStageAttempts(base).length,
          ),
        },
      ],
    };
  }

  const superseded = updateLatestStageAttempt(base, "SUPERSEDED");
  const stageAttempts = superseded.filter(
    (attempt) => attempt.stage === base.currentStage,
  );

  if (stageAttempts.length >= base.repair.maxAttempts) {
    return {
      ...base,
      status: "ACTION_REQUIRED",
      currentGate: null,
      currentAction:
        "Maximum governed repair attempts reached; operator intervention required",
      repair: {
        ...base.repair,
        attempts: superseded,
      },
    };
  }

  const nextNumber = stageAttempts.length + 1;
  const nextAttempt = buildAttempt(
    base,
    nextNumber,
    decision === "REANALYZE" ? "REANALYZE" : "REVISE",
    now,
  );
  const nextGate = repairGate(base, gate.revision + 1);

  return {
    ...base,
    status: "ACTION_REQUIRED",
    currentGate: "repair_review",
    currentPhase: "REPAIR_FAILURE",
    currentAction:
      decision === "REANALYZE"
        ? "Review reanalyzed repair proposal"
        : "Review revised repair proposal",
    repair: {
      ...base.repair,
      attempts: [...superseded, nextAttempt],
    },
    phaseGates: [...base.phaseGates, nextGate],
    evidence: [
      ...base.evidence,
      {
        id: nextAttempt.id,
        category: "REPAIR",
        title:
          decision === "REANALYZE"
            ? "Repair evidence reanalyzed"
            : "Repair proposal revised",
        summary:
          "A new reviewed repair revision was created without deleting prior attempts.",
        timestamp: now,
        checksum: nextAttempt.checksum,
      },
    ],
  };
}

export function markJavaRepairValidated(
  job: JavaJobModel,
  now = "2026-08-31T20:52:00+01:00",
): JavaJobModel {
  const latestIndex = latestStageAttemptIndex(job);
  const latest =
    latestIndex >= 0 ? job.repair.attempts[latestIndex] : undefined;
  if (!latest || latest.status !== "APPLIED") {
    throw new Error("A Java repair must be applied before repaired validation can pass.");
  }

  return {
    ...job,
    repair: {
      ...job.repair,
      attempts: updateLatestStageAttempt(job, "VALIDATED"),
    },
    evidence: [
      ...job.evidence,
      {
        id: latest.id + "-validated",
        category: "REPAIR",
        title: "Repair validation passed",
        summary:
          "Maven build and test validation passed after the approved repair.",
        timestamp: now,
        checksum: stableDisplayChecksum(latest.checksum + ":validated"),
      },
    ],
  };
}
