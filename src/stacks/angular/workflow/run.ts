import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import type { AngularRunSeed } from "../domain/types.ts";
import { prepareProvenStage } from "./proven.ts";
import { createAngularLiveExecution } from "./live-definitions.ts";
import type {
  AngularAnalysisModel,
  AngularBaselineModel,
  AngularFeasibilityModel,
  AngularGateState,
  AngularGovernanceDecision,
  AngularPlanningRevision,
  AngularPreTransformGateId,
  AngularLlmProvenance,
  AngularRunModel,
  AngularCommandRecord,
} from "../domain/run-types.ts";

function llmProvenance(
  role: AngularLlmProvenance["role"],
  status: AngularLlmProvenance["status"],
  durationMs = 0,
  inputTokens = 0,
  outputTokens = 0,
): AngularLlmProvenance {
  return {
    provider: "azure_openai",
    deployment: "gpt-5-mini",
    role,
    promptVersion:
      role === "phase_proposer"
        ? "prompt-phase-proposer-v2.3"
        : "prompt-phase-reviewer-v2.3",
    status,
    durationMs,
    inputTokens,
    outputTokens,
  };
}

function baselineCommand(
  runId: string,
  action: AngularCommandRecord["action"],
  command: string,
  timestamp: string,
  logs: string[],
): AngularCommandRecord {
  return {
    id: `${runId}-command-${action.toLowerCase()}`,
    action,
    command,
    authorization: "GOVERNED",
    status: "SUCCEEDED",
    exitCode: 0,
    logs,
    timestamp,
    checksum: stableDisplayChecksum(`${runId}:${action}:${command}:${timestamp}`),
  };
}

const GATE_LABELS: Record<AngularPreTransformGateId, string> = {
  G02: "Source Snapshot",
  G03: "Baseline Acceptance",
  G04: "Analysis Review",
  G05: "Migration Readiness",
  G06: "Migration Plan",
};

function gate(seed: AngularRunSeed, id: AngularPreTransformGateId, status: AngularGateState["status"]): AngularGateState {
  return {
    id,
    label: GATE_LABELS[id],
    status,
    revision: 1,
    checksum: stableDisplayChecksum(`${seed.id}:${id}:1`),
    decisions: [],
  };
}

function initialBaseline(): AngularBaselineModel {
  return {
    outcome: "PENDING",
    knownFailures: [],
    steps: [
      { id: "workspace", label: "Create baseline workspace", status: "PENDING", detail: "Read-only source copied into isolated baseline authority." },
      { id: "prequalify", label: "Prequalify baseline", status: "PENDING", detail: "Project and environment eligibility checked before install." },
      { id: "authorize-install", label: "Authorize installation", status: "PENDING", detail: "Install command bound to the baseline workspace." },
      { id: "install", label: "Clean install", status: "PENDING", detail: "Lockfile-governed npm install." },
      { id: "build", label: "Build matrix", status: "PENDING", detail: "Existing application build is proven before migration." },
      { id: "tests", label: "Test matrix", status: "PENDING", detail: "Known test behavior is captured as baseline evidence." },
      { id: "lint", label: "Lint", status: "PENDING", detail: "Executed when configured." },
      { id: "parity", label: "Parity evidence", status: "PENDING", detail: "Baseline output compared with source expectations." },
      { id: "qualification", label: "Qualification", status: "PENDING", detail: "Baseline classified for G03 review." },
    ],
  };
}

const initialAnalysis: AngularAnalysisModel = {
  revision: 1,
  status: "WAITING",
  facts: [],
  risks: [],
  unknowns: [],
  reviewerVerdict: "WAITING",
  summary: "Analysis has not started.",
  confidence: "WAITING",
  proposer: llmProvenance("phase_proposer", "WAITING"),
  reviewer: llmProvenance("phase_reviewer", "WAITING"),
};

const initialFeasibility: AngularFeasibilityModel = {
  status: "WAITING",
  coreCompatibility: "SUPPORTED",
  runtimeCompatibility: "SUPPORTED",
  thirdPartySummary: "42 packages will be checked against each adjacent target.",
  lockfileAuthority: "package-lock.json",
  warnings: [],
};

export function createAngularRunModel(seed: AngularRunSeed): AngularRunModel {
  return {
    ...seed,
    state: seed.state === "COMPLETED" ? "COMPLETED" : "RUNNING",
    phase: seed.state === "COMPLETED" ? "COMPLETE" : "SOURCE_SNAPSHOT",
    currentGate: seed.state === "COMPLETED" ? null : "G02",
    currentAction: seed.state === "COMPLETED" ? "Requested target achieved" : "Review immutable source snapshot",
    gates: {
      G02: gate(seed, "G02", seed.state === "COMPLETED" ? "APPROVED" : "PENDING"),
      G03: gate(seed, "G03", seed.state === "COMPLETED" ? "APPROVED" : "LOCKED"),
      G04: gate(seed, "G04", seed.state === "COMPLETED" ? "APPROVED" : "LOCKED"),
      G05: gate(seed, "G05", seed.state === "COMPLETED" ? "APPROVED" : "LOCKED"),
      G06: gate(seed, "G06", seed.state === "COMPLETED" ? "APPROVED" : "LOCKED"),
    },
    baseline: seed.state === "COMPLETED" ? completedBaseline() : initialBaseline(),
    analysis: seed.state === "COMPLETED" ? completedAnalysis() : initialAnalysis,
    feasibility: seed.state === "COMPLETED" ? { ...completedFeasibility() } : initialFeasibility,
    planning: seed.state === "COMPLETED"
      ? [{
          revision: 1,
          status: "ACCEPTED",
          summary: "Adjacent-major execution plan accepted.",
          checksum: stableDisplayChecksum(`${seed.id}:plan:1`),
          proposer: llmProvenance("phase_proposer", "SUCCEEDED", 1800, 2216, 512),
          reviewer: llmProvenance("phase_reviewer", "SUCCEEDED", 1600, 1260, 246),
        }]
      : [],
    evidence: [
      {
        id: `${seed.id}-g01`,
        category: "DECISION",
        title: "G01 Production Readiness approved",
        summary: "Authoritative run created from the accepted readiness package.",
        timestamp: seed.createdAt,
        checksum: stableDisplayChecksum(`${seed.id}:g01:${seed.g01DecisionId}`),
      },
      {
        id: `${seed.id}-source-snapshot`,
        category: "SOURCE",
        title: "Source snapshot prepared",
        summary: `Angular ${seed.sourceMajor} source identity is ready for G02 review.`,
        timestamp: seed.createdAt,
        checksum: stableDisplayChecksum(`${seed.id}:source-snapshot`),
      },
    ],
    diagnostics: [],
    operations: {
      commands: seed.state === "COMPLETED"
        ? [
            baselineCommand(seed.id, "BASELINE_INSTALL", "npm ci", seed.createdAt, ["Lockfile authority accepted.", "Install completed."]),
            baselineCommand(seed.id, "BASELINE_BUILD", "npm run build", seed.createdAt, ["Baseline build completed."]),
            baselineCommand(seed.id, "BASELINE_TEST", "npm test", seed.createdAt, ["Known source warning preserved.", "Baseline test matrix completed."]),
          ]
        : [],
      partialDeliveries: [],
      rollbacks: [],
      stageHistory: [],
    },
    route: seed.state === "COMPLETED"
      ? seed.route.map((step) => ({ ...step, status: "SEALED" as const }))
      : seed.route,
  };
}

export function completedBaseline(): AngularBaselineModel {
  return {
    outcome: "QUALIFIED_WITH_KNOWN_FAILURES",
    knownFailures: ["1 legacy test warning accepted as source baseline evidence."],
    steps: initialBaseline().steps.map((step) => ({
      ...step,
      status: step.id === "tests" ? "KNOWN_FAILURES" as const : "PASS" as const,
    })),
  };
}

export function completedAnalysis(
  status: AngularAnalysisModel["status"] = "APPROVED",
): AngularAnalysisModel {
  return {
    revision: 1,
    status,
    facts: ["3 Angular projects", "package-lock authority", "standard Angular CLI builder"],
    risks: ["One third-party test package requires transition at a later stage."],
    unknowns: [],
    reviewerVerdict: "ACCEPT",
    summary:
      "The application is a standard Angular CLI workspace with three projects, lockfile authority, and one bounded third-party migration risk.",
    confidence: "HIGH",
    proposer: llmProvenance("phase_proposer", "SUCCEEDED", 1800, 1842, 436),
    reviewer: llmProvenance("phase_reviewer", "SUCCEEDED", 1600, 1028, 214),
  };
}

export function completedFeasibility(): AngularFeasibilityModel {
  return {
    status: "APPROVED",
    coreCompatibility: "SUPPORTED",
    runtimeCompatibility: "SUPPORTED",
    thirdPartySummary: "39 compatible · 2 migration-required · 1 review-required",
    lockfileAuthority: "package-lock.json",
    warnings: ["Third-party transition will be governed inside the affected stage."],
  };
}

export function getAllowedPreTransformDecisions(
  gateId: AngularPreTransformGateId,
): AngularGovernanceDecision[] {
  if (gateId === "G03") {
    return ["APPROVE", "REQUEST_MODIFICATION", "REJECT"];
  }
  return ["APPROVE", "APPROVE_WITH_COMMENT", "REQUEST_MODIFICATION", "REJECT"];
}

function evidenceForDecision(
  run: AngularRunModel,
  gateId: AngularPreTransformGateId,
  decision: AngularGovernanceDecision,
  timestamp: string,
  checksum: string,
) {
  return {
    id: `${run.id}-${gateId.toLowerCase()}-decision-${run.gates[gateId].decisions.length + 1}`,
    category: "DECISION" as const,
    title: `${gateId} ${GATE_LABELS[gateId]} decision`,
    summary: decision.replaceAll("_", " "),
    timestamp,
    checksum: stableDisplayChecksum(`${checksum}:${decision}`),
  };
}

function unlock(
  gates: AngularRunModel["gates"],
  id: AngularPreTransformGateId,
): AngularRunModel["gates"] {
  return { ...gates, [id]: { ...gates[id], status: "PENDING" } };
}

export function applyAngularGateDecision(
  run: AngularRunModel,
  gateId: AngularPreTransformGateId,
  decision: AngularGovernanceDecision,
  comment = "",
  now = "2026-08-31T19:45:00+01:00",
  runtimeStartedAtMs = Date.parse(now),
): AngularRunModel {
  if (run.currentGate !== gateId) {
    throw new Error(`${gateId} is not the current review boundary.`);
  }
  const gateState = run.gates[gateId];
  if (!["PENDING", "MODIFICATION_REQUESTED"].includes(gateState.status)) {
    throw new Error(`${gateId} cannot accept a decision while ${gateState.status}.`);
  }
  if (!getAllowedPreTransformDecisions(gateId).includes(decision)) {
    throw new Error(`${decision} is not valid for ${gateId}.`);
  }
  if (decision === "APPROVE_WITH_COMMENT" && comment.trim().length === 0) {
    throw new Error("Approve with comment requires a comment.");
  }

  const record = {
    id: `${run.id}-${gateId.toLowerCase()}-${gateState.decisions.length + 1}`,
    gate: gateId,
    decision,
    comment: comment.trim() || undefined,
    timestamp: now,
    checksum: gateState.checksum,
    revision: gateState.revision,
  };
  const withHistory: AngularRunModel = {
    ...run,
    gates: {
      ...run.gates,
      [gateId]: { ...gateState, decisions: [...gateState.decisions, record] },
    },
    evidence: [...run.evidence, evidenceForDecision(run, gateId, decision, now, gateState.checksum)],
  };

  if (decision === "REJECT") {
    return {
      ...withHistory,
      state: "BLOCKED",
      phase: "BLOCKED",
      currentAction: `Migration blocked by ${gateId} rejection`,
      gates: { ...withHistory.gates, [gateId]: { ...withHistory.gates[gateId], status: "REJECTED" } },
    };
  }

  if (decision === "REQUEST_MODIFICATION") {
    const nextRevision = gateState.revision + 1;
    const refreshedGate = {
      ...withHistory.gates[gateId],
      status: "PENDING" as const,
      revision: nextRevision,
      checksum: stableDisplayChecksum(`${run.id}:${gateId}:${nextRevision}`),
    };
    const planning = gateId === "G06"
      ? [
          ...withHistory.planning.map((revision) =>
            revision.status === "READY_FOR_REVIEW" ? { ...revision, status: "SUPERSEDED" as const } : revision,
          ),
          {
            revision: nextRevision,
            status: "READY_FOR_REVIEW" as const,
            summary: comment.trim() || "Migration plan revised against reviewer feedback.",
            checksum: stableDisplayChecksum(`${run.id}:plan:${nextRevision}`),
            proposer: llmProvenance("phase_proposer", "SUCCEEDED", 1800, 2140, 498),
            reviewer: llmProvenance("phase_reviewer", "SUCCEEDED", 1600, 1190, 238),
          },
        ]
      : withHistory.planning;
    return {
      ...withHistory,
      gates: { ...withHistory.gates, [gateId]: refreshedGate },
      planning,
      currentAction: `Review revised ${GATE_LABELS[gateId].toLowerCase()} evidence`,
    };
  }

  return progressApprovedGate(
    {
      ...withHistory,
      gates: { ...withHistory.gates, [gateId]: { ...withHistory.gates[gateId], status: "APPROVED" } },
    },
    gateId,
    runtimeStartedAtMs,
  );
}

function progressApprovedGate(
  run: AngularRunModel,
  gateId: AngularPreTransformGateId,
  runtimeStartedAtMs: number,
): AngularRunModel {
  if (gateId === "G02") {
    return {
      ...run,
      phase: "BASELINE",
      currentGate: null,
      currentAction: "Baseline execution running",
      liveExecution: createAngularLiveExecution("BASELINE", runtimeStartedAtMs),
    };
  }

  if (gateId === "G03") {
    return {
      ...run,
      phase: "ANALYSIS",
      currentGate: null,
      currentAction: "Analysis Proposer and independent Reviewer are running",
      liveExecution: createAngularLiveExecution("ANALYSIS", runtimeStartedAtMs),
    };
  }

  if (gateId === "G04") {
    return {
      ...run,
      phase: "FEASIBILITY",
      currentGate: null,
      currentAction: "Compatibility and migration readiness analysis running",
      analysis: { ...run.analysis, status: "APPROVED" },
      liveExecution: createAngularLiveExecution("FEASIBILITY", runtimeStartedAtMs),
    };
  }

  if (gateId === "G05") {
    return {
      ...run,
      phase: "PLANNING",
      currentGate: null,
      currentAction: "Planning Proposer and independent Reviewer are running",
      feasibility: { ...run.feasibility, status: "APPROVED" },
      liveExecution: createAngularLiveExecution("PLANNING", runtimeStartedAtMs),
    };
  }

  const acceptedPlanning = run.planning.map((revision, index, revisions) =>
    index === revisions.length - 1
      ? { ...revision, status: "ACCEPTED" as const }
      : revision,
  );

  const nextStage = run.route.find((step) => step.status !== "SEALED");
  return {
    ...run,
    phase: "STAGE_PREPARATION",
    currentGate: null,
    currentAction: nextStage
      ? `Resolving and certifying runtime for Angular ${nextStage.source} → ${nextStage.target}`
      : "Preparing requested target completion",
    planning: acceptedPlanning,
    state: "RUNNING",
    liveExecution: createAngularLiveExecution(
      "STAGE_PREPARATION",
      runtimeStartedAtMs,
      nextStage
        ? { source: nextStage.source, target: nextStage.target }
        : {},
    ),
  };
}

export function completeAngularBaselineExecution(
  run: AngularRunModel,
  now: string,
): AngularRunModel {
  return {
    ...run,
    phase: "BASELINE",
    currentGate: "G03",
    currentAction: "Review qualified baseline and known source failures",
    gates: unlock(run.gates, "G03"),
    baseline: completedBaseline(),
    liveExecution: undefined,
    operations: {
      ...run.operations,
      commands: [
        ...run.operations.commands,
        baselineCommand(run.id, "BASELINE_INSTALL", "npm ci --include=optional", now, [
          "Lockfile authority accepted.",
          "Install completed.",
        ]),
        baselineCommand(run.id, "BASELINE_BUILD", "npm run build", now, [
          "Baseline build completed with exit code 0.",
        ]),
        baselineCommand(run.id, "BASELINE_TEST", "npm test -- --watch=false", now, [
          "Known source warning classified.",
          "Baseline tests completed.",
        ]),
      ],
    },
    evidence: [
      ...run.evidence,
      {
        id: `${run.id}-baseline-qualified`,
        category: "BASELINE",
        title: "Baseline qualification recorded",
        summary:
          "Install, build, tests, lint, parity, and qualification completed before migration.",
        timestamp: now,
        checksum: stableDisplayChecksum(`${run.id}:baseline:qualified`),
      },
    ],
  };
}

export function completeAngularAnalysisExecution(
  run: AngularRunModel,
  now: string,
): AngularRunModel {
  return {
    ...run,
    phase: "ANALYSIS",
    currentGate: "G04",
    currentAction: "Review Analysis Proposer output and independent Reviewer verdict",
    gates: unlock(run.gates, "G04"),
    analysis: completedAnalysis("READY_FOR_REVIEW"),
    liveExecution: undefined,
    evidence: [
      ...run.evidence,
      {
        id: `${run.id}-analysis-completed`,
        category: "ANALYSIS",
        title: "Analysis Proposer + independent Reviewer completed",
        summary:
          "Azure OpenAI proposer and reviewer outputs were schema-validated and bound to the G04 evidence package.",
        timestamp: now,
        checksum: stableDisplayChecksum(`${run.id}:analysis:completed`),
      },
    ],
  };
}

export function completeAngularFeasibilityExecution(
  run: AngularRunModel,
  now: string,
): AngularRunModel {
  return {
    ...run,
    phase: "FEASIBILITY",
    currentGate: "G05",
    currentAction: "Review migration readiness and compatibility evidence",
    gates: unlock(run.gates, "G05"),
    feasibility: { ...completedFeasibility(), status: "READY_FOR_REVIEW" },
    liveExecution: undefined,
    evidence: [
      ...run.evidence,
      {
        id: `${run.id}-feasibility-completed`,
        category: "FEASIBILITY",
        title: "Compatibility and feasibility analysis completed",
        summary:
          "Core, runtime, third-party, and lockfile evidence are ready for G05 review.",
        timestamp: now,
        checksum: stableDisplayChecksum(`${run.id}:feasibility:completed`),
      },
    ],
  };
}

export function completeAngularPlanningExecution(
  run: AngularRunModel,
  now: string,
): AngularRunModel {
  const revision: AngularPlanningRevision = {
    revision: run.planning.length + 1,
    status: "READY_FOR_REVIEW",
    summary:
      "Adjacent-major migration plan with bounded validation, runtime binding, independent review, and stage sealing.",
    checksum: stableDisplayChecksum(
      `${run.id}:plan:${run.planning.length + 1}`,
    ),
    proposer: llmProvenance("phase_proposer", "SUCCEEDED", 1800, 2216, 512),
    reviewer: llmProvenance("phase_reviewer", "SUCCEEDED", 1600, 1260, 246),
  };
  return {
    ...run,
    phase: "PLANNING",
    currentGate: "G06",
    currentAction: "Review migration plan and execution contract",
    gates: unlock(run.gates, "G06"),
    planning: [...run.planning, revision],
    liveExecution: undefined,
    evidence: [
      ...run.evidence,
      {
        id: `${run.id}-planning-${revision.revision}-completed`,
        category: "PLANNING",
        title: `Planning revision #${revision.revision} reviewed`,
        summary:
          "Planning Proposer and independent Reviewer completed before G06 was opened.",
        timestamp: now,
        checksum: revision.checksum,
      },
    ],
  };
}

export function completeAngularStagePreparationExecution(
  run: AngularRunModel,
): AngularRunModel {
  return prepareProvenStage({
    ...run,
    liveExecution: undefined,
    phase: "STAGE_PREPARATION",
  });
}

export function markG02Stale(
  run: AngularRunModel,
): AngularRunModel {
  return {
    ...run,
    phase: "SOURCE_SNAPSHOT",
    currentGate: "G02",
    currentAction: "Regenerate source snapshot evidence before review",
    gates: {
      ...run.gates,
      G02: {
        ...run.gates.G02,
        status: "STALE",
        revision: run.gates.G02.revision + 1,
        checksum: stableDisplayChecksum(`${run.id}:G02:stale:${run.gates.G02.revision + 1}`),
      },
    },
    diagnostics: [...run.diagnostics, "G02 source evidence became stale after a source-binding change."],
  };
}
