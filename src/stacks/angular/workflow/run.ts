import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import type { AngularRunSeed } from "../domain/types.ts";
import type {
  AngularAnalysisModel,
  AngularBaselineModel,
  AngularFeasibilityModel,
  AngularGateState,
  AngularGovernanceDecision,
  AngularPlanningRevision,
  AngularPreTransformGateId,
  AngularRunModel,
} from "../domain/run-types.ts";

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
      ? [{ revision: 1, status: "ACCEPTED", summary: "Adjacent-major execution plan accepted.", checksum: stableDisplayChecksum(`${seed.id}:plan:1`) }]
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
    route: seed.state === "COMPLETED"
      ? seed.route.map((step) => ({ ...step, status: "SEALED" as const }))
      : seed.route,
  };
}

function completedBaseline(): AngularBaselineModel {
  return {
    outcome: "QUALIFIED_WITH_KNOWN_FAILURES",
    knownFailures: ["1 legacy test warning accepted as source baseline evidence."],
    steps: initialBaseline().steps.map((step) => ({
      ...step,
      status: step.id === "tests" ? "KNOWN_FAILURES" as const : "PASS" as const,
    })),
  };
}

function completedAnalysis(): AngularAnalysisModel {
  return {
    revision: 1,
    status: "APPROVED",
    facts: ["3 Angular projects", "package-lock authority", "standard Angular CLI builder"],
    risks: ["One third-party test package requires transition at a later stage."],
    unknowns: [],
    reviewerVerdict: "ACCEPT",
  };
}

function completedFeasibility(): AngularFeasibilityModel {
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
  );
}

function progressApprovedGate(
  run: AngularRunModel,
  gateId: AngularPreTransformGateId,
): AngularRunModel {
  if (gateId === "G02") {
    return {
      ...run,
      phase: "BASELINE",
      currentGate: "G03",
      currentAction: "Review qualified baseline and known source failures",
      gates: unlock(run.gates, "G03"),
      baseline: completedBaseline(),
      evidence: [
        ...run.evidence,
        {
          id: `${run.id}-baseline-qualified`,
          category: "BASELINE",
          title: "Baseline qualification recorded",
          summary: "Install, build, tests, lint, parity, and qualification completed before migration.",
          timestamp: "2026-08-31T19:46:00+01:00",
          checksum: stableDisplayChecksum(`${run.id}:baseline:qualified`),
        },
      ],
    };
  }

  if (gateId === "G03") {
    return {
      ...run,
      phase: "ANALYSIS",
      currentGate: "G04",
      currentAction: "Review Analysis Agent output and independent reviewer verdict",
      gates: unlock(run.gates, "G04"),
      analysis: { ...completedAnalysis(), status: "READY_FOR_REVIEW" },
    };
  }

  if (gateId === "G04") {
    return {
      ...run,
      phase: "FEASIBILITY",
      currentGate: "G05",
      currentAction: "Review migration readiness and compatibility evidence",
      gates: unlock(run.gates, "G05"),
      analysis: { ...run.analysis, status: "APPROVED" },
      feasibility: { ...completedFeasibility(), status: "READY_FOR_REVIEW" },
    };
  }

  if (gateId === "G05") {
    const revision: AngularPlanningRevision = {
      revision: 1,
      status: "READY_FOR_REVIEW",
      summary: "Adjacent-major migration plan with bounded validation and stage sealing.",
      checksum: stableDisplayChecksum(`${run.id}:plan:1`),
    };
    return {
      ...run,
      phase: "PLANNING",
      currentGate: "G06",
      currentAction: "Review migration plan and execution contract",
      gates: unlock(run.gates, "G06"),
      feasibility: { ...run.feasibility, status: "APPROVED" },
      planning: [revision],
    };
  }

  const acceptedPlanning = run.planning.map((revision, index, revisions) =>
    index === revisions.length - 1
      ? { ...revision, status: "ACCEPTED" as const }
      : revision,
  );

  return {
    ...run,
    phase: "STAGE_PREPARATION",
    currentGate: null,
    currentAction: `Resolve and certify runtime for Angular ${run.route[0]?.source} → ${run.route[0]?.target}`,
    planning: acceptedPlanning,
    state: "RUNNING",
  };
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
