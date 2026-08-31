import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
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

function repairAttempts(run: AngularRunModel): AngularRepairAttempt[] {
  const stage = run.stageExecution;
  if (!stage) return [];
  const failureCategory = "TEST_OR_BUILD_REGRESSION";
  return [
    {
      id: `${stage.stageId}-repair-1`,
      attempt: 1,
      status: "REJECTED_BY_CAUSAL_POLICY",
      failureCategory,
      proposalKind: "DEPENDENCY_MUTATION",
      rationale: "First proposal attempted to mutate an unrelated dependency after a test/build regression.",
      changedFiles: ["package.json"],
      diff: '- "jest-preset-angular": "12.2.6"\n+ "jest-preset-angular": "16.1.3"',
      reviewerVerdict: "NOT_REVIEWED",
      causalResult: "REPAIR_CAUSAL_KIND_MISMATCH",
      risk: "HIGH",
    },
    {
      id: `${stage.stageId}-repair-2`,
      attempt: 2,
      status: "READY_FOR_G10",
      failureCategory,
      proposalKind: "SOURCE_PATCH",
      rationale: "Patch the failing test compatibility surface directly and re-run the full validation generation.",
      changedFiles: ["src/app/order.service.spec.ts"],
      diff:
        "- expect(service.legacyValue).toBe(true);\n+ expect(service.currentValue).toBe(true);",
      reviewerVerdict: "ACCEPT",
      causalResult: "PASS",
      risk: "MEDIUM",
    },
  ];
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
        diagnostics: [...run.diagnostics, "G07 revision requested; runtime binding remains unchanged until refreshed evidence is reviewed."],
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
        diagnostics: [...run.diagnostics, "Maximum governed repair attempts reached."],
      };
    }

    const attempt = attempts.length + 1;
    attempts.push({
      id: `${stage.stageId}-repair-${attempt}`,
      attempt,
      status: "READY_FOR_G10",
      failureCategory: current?.failureCategory ?? "TEST_OR_BUILD_REGRESSION",
      proposalKind: "SOURCE_PATCH",
      rationale: comment.trim() || "Revised source patch incorporates reviewer feedback.",
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

  const decidedStage = approveGate(stage, gateId, decision, comment, now);
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
    const shouldFail = stage.source === 13 && stage.target === 14;
    const validation = shouldFail ? "FAILED" as const : "PASS" as const;
    let executed: AngularStageExecution = {
      ...decidedStage,
      status: shouldFail ? "ACTION_REQUIRED" : "WAITING_COMPLETION",
      groups: completedGroups(validation),
      validation,
    };

    if (shouldFail) {
      executed = unlockGate(
        { ...executed, repairAttempts: repairAttempts({ ...run, stageExecution: executed }) },
        "G10",
      );
      return {
        ...run,
        state: "RUNNING",
        phase: "REPAIR",
        currentGate: "G10",
        currentAction: "Review causally valid repair proposal",
        route: run.route.map((step) =>
          step.id === stage.stageId ? { ...step, status: "ACTION_REQUIRED" as const } : step,
        ),
        stageExecution: executed,
        evidence: [
          ...run.evidence,
          {
            id: `${run.id}-${stage.stageId}-validation-failure`,
            category: "FAILURE",
            title: "Validation regression detected",
            summary: "Build/test validation failed after the governed transformation.",
            timestamp: now,
            checksum: stableDisplayChecksum(`${run.id}:${stage.stageId}:failure`),
          },
          {
            id: `${run.id}-${stage.stageId}-causal-reject`,
            category: "REPAIR",
            title: "Unrelated dependency mutation rejected",
            summary: "REPAIR_CAUSAL_KIND_MISMATCH prevented a dependency change that was not authorized by the observed failure.",
            timestamp: now,
            checksum: stableDisplayChecksum(`${run.id}:${stage.stageId}:causal-reject`),
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
      stageExecution: executed,
      evidence: [
        ...run.evidence,
        {
          id: `${run.id}-${stage.stageId}-validation-pass`,
          category: "VALIDATION",
          title: "PROVEN validation passed",
          summary: "Clean validation generation completed install, dependency proof, build, tests, and diagnostic aggregation.",
          timestamp: now,
          checksum: stableDisplayChecksum(`${run.id}:${stage.stageId}:validation-pass`),
        },
      ],
    };
  }

  if (gateId === "G10") {
    const attempts = decidedStage.repairAttempts.map((attempt, index, all) =>
      index === all.length - 1 ? { ...attempt, status: "VALIDATED" as const } : attempt,
    );
    let repaired: AngularStageExecution = {
      ...decidedStage,
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
      stageExecution: repaired,
      evidence: [
        ...run.evidence,
        {
          id: `${run.id}-${stage.stageId}-repair-validation`,
          category: "REPAIR",
          title: "Bounded repair applied and revalidated",
          summary: "The approved source patch passed a clean full validation generation.",
          timestamp: now,
          checksum: stableDisplayChecksum(`${run.id}:${stage.stageId}:repair-valid`),
        },
      ],
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

  return sealAndAdvance(run, decidedStage, now);
}

function sealAndAdvance(
  run: AngularRunModel,
  stage: AngularStageExecution,
  now: string,
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

  return prepareProvenStage({
    ...base,
    phase: "STAGE_PREPARATION",
    stageExecution: undefined,
    currentAction: `Materialize next adjacent stage Angular ${next.source} → ${next.target}`,
  });
}
