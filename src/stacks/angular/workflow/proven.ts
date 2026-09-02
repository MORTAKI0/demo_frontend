import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import { createAngularLiveExecution } from "./live-definitions.ts";
import type { AngularRouteStep } from "../domain/types.ts";
import type {
  AngularProvenGroup,
  AngularRepairAttempt,
  AngularRunModel,
  AngularStageExecution,
  AngularStageGateDecision,
  AngularStageGateId,
  AngularStageGateState,
} from "../domain/run-types.ts";

const GATE_LABELS: Record<AngularStageGateId, string> = {
  G07: "Stage Start",
  G09: "Validation Acceptance",
  G10: "Repair Authorization",
  G11: "Repair Validation",
  G12: "Stage Completion",
};

const GROUP_DEFINITIONS: Array<{
  id: AngularProvenGroup["id"];
  label: string;
  steps: string[];
}> = [
  {
    id: "SOURCE_PROOF",
    label: "Source Proof",
    steps: [
      "Fresh source baseline",
      "Source lock authority",
      "Source install",
      "Source dependency tree",
      "Source version proof",
      "Source build",
      "Source tests",
      "Freeze source baseline",
    ],
  },
  {
    id: "DISCOVERY",
    label: "Discovery",
    steps: [
      "Disposable discovery generation",
      "Discovery toolchain",
      "Angular CLI authority proof",
      "Migration discovery",
      "Freeze discovery evidence",
    ],
  },
  {
    id: "DEPENDENCY_RESOLUTION",
    label: "Dependency Resolution",
    steps: [
      "Target intent",
      "Dependency plan",
      "Target lock authority",
      "Preserve-first lock resolution",
    ],
  },
  {
    id: "MIGRATION",
    label: "Migration",
    steps: [
      "Target materialization",
      "Target install",
      "Migration metadata",
      "Migration ledger",
      "Migration owner commands",
      "Freeze target authority",
    ],
  },
  {
    id: "TARGET_PROOF",
    label: "Target Proof",
    steps: [
      "Target dependency tree",
      "Target version proof",
      "Dependency authority comparison",
      "Candidate identity",
    ],
  },
  {
    id: "VALIDATION",
    label: "Validation",
    steps: [
      "Clean validation generation",
      "Validation install",
      "Validation dependency tree",
      "Validation version proof",
      "Build",
      "Tests",
      "Diagnostic delta",
      "Validation aggregation",
    ],
  },
];

function stageGate(
  run: AngularRunModel,
  id: AngularStageGateId,
  status: AngularStageGateState["status"],
): AngularStageGateState {
  const stage = run.route.find((step) => step.status !== "SEALED");
  const identity = stage ? `${stage.source}-${stage.target}` : "terminal";
  return {
    id,
    label: GATE_LABELS[id],
    status,
    checksum: stableDisplayChecksum(`${run.id}:${identity}:${id}`),
    decisions: [],
  };
}

function pendingGroups(): AngularProvenGroup[] {
  return GROUP_DEFINITIONS.map((group) => ({
    id: group.id,
    label: group.label,
    status: "PENDING",
    steps: group.steps.map((label, index) => ({
      id: `${group.id.toLowerCase()}-${index + 1}`,
      label,
      status: "PENDING",
    })),
  }));
}

function completedGroups(validation: "PASS" | "FAILED"): AngularProvenGroup[] {
  return pendingGroups().map((group) => ({
    ...group,
    status: group.id === "VALIDATION" && validation === "FAILED" ? "FAILED" : "PASS",
    steps: group.steps.map((step) => ({
      ...step,
      status:
        group.id === "VALIDATION" &&
        validation === "FAILED" &&
        (step.label === "Build" || step.label === "Tests")
          ? "FAILED"
          : "PASS",
    })),
  }));
}

function nextUnsealedStage(route: AngularRouteStep[]): AngularRouteStep | undefined {
  return route.find((step) => step.status !== "SEALED");
}

export function prepareProvenStage(run: AngularRunModel): AngularRunModel {
  if (run.state === "COMPLETED") return run;
  if (run.stageExecution && run.stageExecution.status !== "SEALED") return run;

  const next = nextUnsealedStage(run.route);
  if (!next) {
    return {
      ...run,
      state: "COMPLETED",
      phase: "COMPLETE",
      currentGate: null,
      currentAction: "Requested Angular target achieved",
    };
  }

  const route = run.route.map((step) =>
    step.id === next.id ? { ...step, status: "RUNNING" as const } : step,
  );

  const stageExecution: AngularStageExecution = {
    stageId: next.id,
    source: next.source,
    target: next.target,
    status: "WAITING_G07",
    runtime: {
      profile: `factory-runtime-certified-${next.source}-${next.target}`,
      resolution: "PASS",
      certification: "CERTIFIED",
      dependencyPreflight: "PASS",
    },
    gates: {
      G07: stageGate({ ...run, route }, "G07", "PENDING"),
      G09: stageGate({ ...run, route }, "G09", "LOCKED"),
      G10: stageGate({ ...run, route }, "G10", "LOCKED"),
      G11: stageGate({ ...run, route }, "G11", "LOCKED"),
      G12: stageGate({ ...run, route }, "G12", "LOCKED"),
    },
    groups: pendingGroups(),
    validation: "PENDING",
    repairAttempts: [],
    candidatePromotion: "PENDING",
    seal: "PENDING",
  };

  return {
    ...run,
    route,
    stageExecution,
    phase: "STAGE_PREPARATION",
    currentGate: "G07",
    currentAction: `Review certified runtime and stage plan for Angular ${next.source} → ${next.target}`,
    evidence: [
      ...run.evidence,
      {
        id: `${run.id}-${next.id}-runtime`,
        category: "STAGE",
        title: `Runtime certified for Angular ${next.source} → ${next.target}`,
        summary: "Runtime resolution, certification, dependency preflight, and known decisions are bound before G07.",
        timestamp: "2026-08-31T20:00:00+01:00",
        checksum: stableDisplayChecksum(`${run.id}:${next.id}:runtime`),
      },
    ],
  };
}

export function getAllowedStageDecisions(
  gateId: AngularStageGateId,
): AngularStageGateDecision[] {
  if (gateId === "G07" || gateId === "G10") {
    return ["APPROVE", "REQUEST_MODIFICATION", "REJECT"];
  }
  return ["APPROVE", "REJECT"];
}

function sourceBackedRepairAttempts20To21(
  run: AngularRunModel,
): AngularRepairAttempt[] {
  const stage = run.stageExecution;
  if (!stage || stage.source !== 20 || stage.target !== 21) return [];

  const attemptId = (attempt: number) => `${stage.stageId}-repair-${attempt}`;
  const checksum = (scope: string) =>
    stableDisplayChecksum(`${run.id}:${stage.stageId}:${scope}`);

  return [
    {
      id: attemptId(1),
      attempt: 1,
      status: "MIGRATION_RETRIED",
      failureCategory: "PEER_DEPENDENCY_CONFLICT",
      failurePhase: "DEPENDENCY",
      failureOwner: "COMPATIBILITY_PLANNER",
      proposalKind: "DEPENDENCY_TRANSITION",
      operation: "dependency_transition",
      rationale:
        "Angular 21 peer resolution required a governed detach/update/reattach dependency transition before migration retry.",
      changedFiles: ["package.json", "package-lock.json"],
      diff:
        "Governed dependency transition: detach the blocking compatibility package, retry the Angular transition, normalize lock authority, then reattach the compatible bundle.",
      reviewerVerdict: "NOT_REVIEWED",
      causalResult: "PASS",
      risk: "MEDIUM",
      validationTargets: ["dependency_closure", "version_proof"],
      failureEvidenceChecksum: checksum("repair-1:failure"),
    },
    {
      id: attemptId(2),
      attempt: 2,
      status: "SUPERSEDED",
      failureCategory: "MISSING_TEST_ENVIRONMENT",
      failurePhase: "DEPENDENCY",
      failureOwner: "COMPATIBILITY_PLANNER",
      proposalKind: "DEPENDENCY_ADD",
      operation: "dependency_add",
      rationale:
        "The validation environment was missing jest-environment-jsdom; the governed manifest intent added it before npm regenerated lock authority and materialized node_modules.",
      changedFiles: ["package.json"],
      diff:
        '  "devDependencies": {\n+   "jest-environment-jsdom": "^30.0.0"\n  }',
      reviewerVerdict: "ACCEPT",
      causalResult: "PASS",
      risk: "LOW",
      validationTargets: ["test", "build"],
      failureEvidenceChecksum: checksum("repair-2:failure"),
      proposalChecksum: checksum("repair-2:proposal"),
      reviewChecksum: checksum("repair-2:review"),
    },
    {
      id: attemptId(3),
      attempt: 3,
      status: "SUPERSEDED",
      failureCategory: "LEGACY_JEST_SETUP_IMPORT",
      failurePhase: "MAIN_REPAIR",
      failureOwner: "MAIN_REPAIR_LLM",
      proposalKind: "DEPENDENCY_CHANGE",
      operation: "dependency_change",
      rationale:
        "A dependency-version change to jest-preset-angular ^17.0.0 was proposed for the remaining Jest setup failure, but the Reviewer requested changes because the failure was in source setup code.",
      changedFiles: ["package.json"],
      diff:
        '-   "jest-preset-angular": "16.1.3"\n+   "jest-preset-angular": "^17.0.0"',
      reviewerVerdict: "REQUEST_CHANGES",
      causalResult: "PASS",
      risk: "MEDIUM",
      proposer: {
        role: "repair_proposer",
        task: "repair_diagnosis",
        status: "SUCCEEDED",
      },
      reviewer: {
        role: "repair_reviewer",
        task: "repair_review",
        status: "SUCCEEDED",
        decision: "REQUEST_CHANGES",
      },
      validationTargets: ["test", "build"],
      failureEvidenceChecksum: checksum("repair-3:failure"),
      proposalChecksum: checksum("repair-3:proposal"),
      reviewChecksum: checksum("repair-3:review"),
    },
    {
      id: attemptId(4),
      attempt: 4,
      parentAttemptId: attemptId(3),
      status: "READY_FOR_G10",
      failureCategory: "LEGACY_JEST_SETUP_IMPORT",
      failurePhase: "MAIN_REPAIR",
      failureOwner: "MAIN_REPAIR_LLM",
      proposalKind: "SOURCE_PATCH",
      operation: "replace_text",
      rationale:
        "Human revision kept the current dependency closure and redirected the repair to the exact legacy Jest setup import identified by the failed test evidence.",
      changedFiles: ["setup-jest.ts"],
      diff:
        "- import 'jest-preset-angular/setup-jest';\n+ import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';\n+\n+ setupZoneTestEnv();",
      reviewerVerdict: "ACCEPT",
      causalResult: "PASS",
      risk: "LOW",
      proposer: {
        role: "repair_proposer",
        task: "repair_diagnosis",
        status: "SUCCEEDED",
      },
      reviewer: {
        role: "repair_reviewer",
        task: "repair_review",
        status: "SUCCEEDED",
        decision: "ACCEPT",
      },
      validationTargets: ["test", "build"],
      failureEvidenceChecksum: checksum("repair-4:failure"),
      proposalChecksum: checksum("repair-4:proposal"),
      reviewChecksum: checksum("repair-4:review"),
    },
  ];
}

function reviewingRepairAttempts20To21(
  run: AngularRunModel,
): AngularRepairAttempt[] {
  const attempts = sourceBackedRepairAttempts20To21(run);
  return attempts.map((attempt, index, all) =>
    index === all.length - 1
      ? {
          ...attempt,
          status: "REVIEWING" as const,
          proposer: undefined,
          reviewer: undefined,
          proposalChecksum: undefined,
          reviewChecksum: undefined,
        }
      : attempt,
  );
}

function approveGate(
  stage: AngularStageExecution,
  gateId: AngularStageGateId,
  decision: AngularStageGateDecision,
  comment: string,
  now: string,
): AngularStageExecution {
  const current = stage.gates[gateId];
  return {
    ...stage,
    gates: {
      ...stage.gates,
      [gateId]: {
        ...current,
        status: decision === "REJECT" ? "REJECTED" : "APPROVED",
        decisions: [
          ...current.decisions,
          {
            id: `${stage.stageId}-${gateId.toLowerCase()}-${current.decisions.length + 1}`,
            decision,
            timestamp: now,
            checksum: current.checksum,
            comment: comment.trim() || undefined,
          },
        ],
      },
    },
  };
}

function unlockGate(
  stage: AngularStageExecution,
  gateId: AngularStageGateId,
): AngularStageExecution {
  return {
    ...stage,
    gates: {
      ...stage.gates,
      [gateId]: { ...stage.gates[gateId], status: "PENDING" },
    },
  };
}

export function applyAngularStageGateDecision(
  run: AngularRunModel,
  gateId: AngularStageGateId,
  decision: AngularStageGateDecision,
  comment = "",
  now = "2026-08-31T20:05:00+01:00",
  runtimeStartedAtMs = Date.parse(now),
): AngularRunModel {
  const stage = run.stageExecution;
  if (!stage) throw new Error("No active Angular stage execution is available.");
  if (run.currentGate !== gateId) throw new Error(`${gateId} is not the current stage gate.`);
  if (stage.gates[gateId].status !== "PENDING") {
    throw new Error(`${gateId} cannot accept a decision while ${stage.gates[gateId].status}.`);
  }
  if (!getAllowedStageDecisions(gateId).includes(decision)) {
    throw new Error(`${decision} is not valid for ${gateId}.`);
  }

  if (decision === "REQUEST_MODIFICATION") {
    if (gateId === "G07") {
      return {
        ...run,
        currentAction: "Review revised stage-start evidence",
        diagnostics: [
          ...run.diagnostics,
          "G07 revision requested; runtime binding remains unchanged until refreshed evidence is reviewed.",
        ],
      };
    }

    const current = stage.repairAttempts.at(-1);
    const attempts = stage.repairAttempts.map((attempt, index, all) =>
      index === all.length - 1
        ? { ...attempt, status: "REVIEWER_REQUESTED_CHANGES" as const }
        : attempt,
    );

    if (attempts.length >= 3) {
      return {
        ...run,
        state: "BLOCKED",
        phase: "BLOCKED",
        currentAction: "Repair attempt policy exhausted",
        diagnostics: [
          ...run.diagnostics,
          "Maximum governed repair attempts reached.",
        ],
      };
    }

    const attempt = attempts.length + 1;
    attempts.push({
      id: `${stage.stageId}-repair-${attempt}`,
      attempt,
      status: "READY_FOR_G10",
      failureCategory:
        current?.failureCategory ?? "TEST_OR_BUILD_REGRESSION",
      proposalKind: "SOURCE_PATCH",
      rationale:
        comment.trim() ||
        "Revised source patch incorporates reviewer feedback.",
      changedFiles: ["src/app/order.service.spec.ts"],
      diff: "- legacy expectation\n+ reviewed compatibility expectation",
      reviewerVerdict: "ACCEPT",
      causalResult: "PASS",
      risk: "MEDIUM",
    });

    return {
      ...run,
      currentAction: "Review revised repair proposal",
      stageExecution: { ...stage, repairAttempts: attempts },
    };
  }

  const decidedStage = approveGate(
    stage,
    gateId,
    decision,
    comment,
    now,
  );

  if (decision === "REJECT") {
    return {
      ...run,
      state: "BLOCKED",
      phase: "BLOCKED",
      currentAction: `Migration blocked by ${gateId} rejection`,
      stageExecution: decidedStage,
    };
  }

  if (gateId === "G07") {
    const executing: AngularStageExecution = {
      ...decidedStage,
      status: "EXECUTING",
      groups: pendingGroups(),
      validation: "PENDING",
    };
    return {
      ...run,
      state: "RUNNING",
      phase: "TRANSFORMATION",
      currentGate: null,
      currentAction:
        `Executing PROVEN Angular ${stage.source} → ${stage.target} migration`,
      route: run.route.map((step) =>
        step.id === stage.stageId
          ? { ...step, status: "RUNNING" as const }
          : step,
      ),
      stageExecution: executing,
      liveExecution: createAngularLiveExecution(
        "STAGE_EXECUTION",
        runtimeStartedAtMs,
        { source: stage.source, target: stage.target },
      ),
    };
  }

  if (gateId === "G10") {
    const attempts = decidedStage.repairAttempts.map(
      (attempt, index, all) =>
        index === all.length - 1
          ? { ...attempt, status: "APPLIED" as const }
          : attempt,
    );
    return {
      ...run,
      phase: "REPAIR",
      currentGate: null,
      currentAction:
        "Applying reviewed repair and running clean validation",
      stageExecution: {
        ...decidedStage,
        status: "EXECUTING",
        repairAttempts: attempts,
      },
      liveExecution: createAngularLiveExecution(
        "REPAIR_VALIDATION",
        runtimeStartedAtMs,
        { source: stage.source, target: stage.target },
      ),
    };
  }

  if (gateId === "G11") {
    const next = unlockGate(decidedStage, "G09");
    return {
      ...run,
      currentGate: "G09",
      currentAction: "Accept repaired validation result",
      stageExecution: next,
    };
  }

  if (gateId === "G09") {
    const next = unlockGate(decidedStage, "G12");
    return {
      ...run,
      currentGate: "G12",
      currentAction: "Review repaired stage completion evidence",
      stageExecution: next,
    };
  }

  return sealAndAdvance(
    run,
    decidedStage,
    now,
    runtimeStartedAtMs,
  );
}

export function completeAngularApprovedStageExecution(
  run: AngularRunModel,
  now: string,
): AngularRunModel {
  const stage = run.stageExecution;
  if (!stage) {
    throw new Error("No active Angular stage execution is available.");
  }
  if (stage.gates.G07.status !== "APPROVED") {
    throw new Error("G07 must be approved before PROVEN stage execution can complete.");
  }

  const shouldFail = stage.source === 20 && stage.target === 21;
  const validation = shouldFail ? "FAILED" as const : "PASS" as const;
  let executed: AngularStageExecution = {
    ...stage,
    status: shouldFail ? "ACTION_REQUIRED" : "WAITING_COMPLETION",
    groups: completedGroups(validation),
    validation,
  };

  if (shouldFail) {
    executed = {
      ...executed,
      repairAttempts: reviewingRepairAttempts20To21({
        ...run,
        stageExecution: executed,
      }),
    };
    return {
      ...run,
      state: "RUNNING",
      phase: "REPAIR",
      currentGate: null,
      currentAction:
        "Main Repair LLM and Independent Reviewer are preparing the bounded source repair",
      liveExecution: createAngularLiveExecution(
        "REPAIR_REVIEW",
        Date.parse(now),
        { source: stage.source, target: stage.target },
      ),
      route: run.route.map((step) =>
        step.id === stage.stageId
          ? { ...step, status: "ACTION_REQUIRED" as const }
          : step,
      ),
      stageExecution: executed,
      evidence: [
        ...run.evidence,
        {
          id: `${run.id}-${stage.stageId}-validation-failure`,
          category: "FAILURE",
          title: "Angular 20 → 21 validation failure preserved",
          summary:
            "The source-backed reference path retains the missing Jest environment and legacy setup import failures before governed repair.",
          timestamp: now,
          checksum: stableDisplayChecksum(
            `${run.id}:${stage.stageId}:failure`,
          ),
        },
      ],
    };
  }

  executed = unlockGate(executed, "G12");
  return {
    ...run,
    phase: "TRANSFORMATION",
    currentGate: "G12",
    currentAction: `Review validated completion evidence for Angular ${stage.source} → ${stage.target}`,
    liveExecution: undefined,
    stageExecution: executed,
    evidence: [
      ...run.evidence,
      {
        id: `${run.id}-${stage.stageId}-validation-pass`,
        category: "VALIDATION",
        title: "PROVEN validation passed",
        summary:
          "Source proof, discovery, dependency resolution, migration, target proof, and clean validation completed before G12.",
        timestamp: now,
        checksum: stableDisplayChecksum(
          `${run.id}:${stage.stageId}:validation-pass`,
        ),
      },
    ],
  };
}

export function completeAngularRepairReviewExecution(
  run: AngularRunModel,
  now: string,
): AngularRunModel {
  const stage = run.stageExecution;
  if (!stage || stage.source !== 20 || stage.target !== 21) {
    throw new Error("No source-backed Angular 20 → 21 repair review is active.");
  }

  let reviewed: AngularStageExecution = {
    ...stage,
    status: "ACTION_REQUIRED",
    repairAttempts: sourceBackedRepairAttempts20To21(run),
  };
  reviewed = unlockGate(reviewed, "G10");

  return {
    ...run,
    phase: "REPAIR",
    currentGate: "G10",
    currentAction:
      "Review Main Repair LLM proposal, Independent Reviewer verdict, and candidate diff",
    liveExecution: undefined,
    stageExecution: reviewed,
    evidence: [
      ...run.evidence,
      {
        id: `${run.id}-${stage.stageId}-repair-proposal`,
        category: "REPAIR",
        title: "Main Repair LLM proposal reviewed",
        summary:
          "The request-changes child repair targets setup-jest.ts with a preimage-bound replace_text operation; the Independent Reviewer accepted it and G10 now requires human approval before apply.",
        timestamp: now,
        checksum: stableDisplayChecksum(
          `${run.id}:${stage.stageId}:repair-proposal`,
        ),
      },
    ],
  };
}

export function completeAngularRepairValidationExecution(
  run: AngularRunModel,
  now: string,
): AngularRunModel {
  const stage = run.stageExecution;
  if (!stage) {
    throw new Error("No active Angular stage execution is available.");
  }
  const attempts = stage.repairAttempts.map((attempt, index, all) =>
    index === all.length - 1
      ? { ...attempt, status: "VALIDATED" as const }
      : attempt,
  );
  let repaired: AngularStageExecution = {
    ...stage,
    status: "ACTION_REQUIRED",
    validation: "PASS",
    groups: completedGroups("PASS"),
    repairAttempts: attempts,
  };
  repaired = unlockGate(repaired, "G11");
  return {
    ...run,
    phase: "REPAIR",
    currentGate: "G11",
    currentAction: "Review repaired candidate validation evidence",
    liveExecution: undefined,
    stageExecution: repaired,
    evidence: [
      ...run.evidence,
      {
        id: `${run.id}-${stage.stageId}-repair-validation`,
        category: "REPAIR",
        title: "Bounded repair applied and revalidated",
        summary:
          "The approved source patch passed clean build/test validation before G11.",
        timestamp: now,
        checksum: stableDisplayChecksum(
          `${run.id}:${stage.stageId}:repair-valid`,
        ),
      },
    ],
  };
}

function sealAndAdvance(
  run: AngularRunModel,
  stage: AngularStageExecution,
  now: string,
  runtimeStartedAtMs: number,
): AngularRunModel {
  const sealedStage: AngularStageExecution = {
    ...stage,
    status: "SEALED",
    candidatePromotion: "PASS",
    seal: "SEALED",
  };
  const route = run.route.map((step) =>
    step.id === stage.stageId ? { ...step, status: "SEALED" as const } : step,
  );
  const base: AngularRunModel = {
    ...run,
    route,
    stageExecution: sealedStage,
    currentGate: null,
    operations: {
      ...run.operations,
      stageHistory: [...run.operations.stageHistory, sealedStage],
    },
    evidence: [
      ...run.evidence,
      {
        id: `${run.id}-${stage.stageId}-promotion`,
        category: "STAGE",
        title: `Angular ${stage.source} → ${stage.target} candidate promoted`,
        summary: "Validated candidate promotion completed before immutable stage sealing.",
        timestamp: now,
        checksum: stableDisplayChecksum(`${run.id}:${stage.stageId}:promotion`),
      },
      {
        id: `${run.id}-${stage.stageId}-seal`,
        category: "SEAL",
        title: `Angular ${stage.source} → ${stage.target} sealed`,
        summary: "Validated candidate promoted, fingerprint bound, and immutable stage checkpoint sealed.",
        timestamp: now,
        checksum: stableDisplayChecksum(`${run.id}:${stage.stageId}:seal`),
      },
    ],
  };

  const next = nextUnsealedStage(route);
  if (!next) {
    return {
      ...base,
      state: "COMPLETED",
      phase: "COMPLETE",
      currentAction: `Requested Angular ${run.targetMajor} target achieved`,
    };
  }

  return {
    ...base,
    phase: "STAGE_PREPARATION",
    stageExecution: undefined,
    currentGate: null,
    currentAction: `Preparing next adjacent stage Angular ${next.source} → ${next.target}`,
    liveExecution: createAngularLiveExecution(
      "STAGE_PREPARATION",
      runtimeStartedAtMs,
      { source: next.source, target: next.target },
    ),
  };
}
