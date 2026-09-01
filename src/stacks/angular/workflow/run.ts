import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import { ANGULAR11_CRUD_SOURCE } from "../domain/demo-source.ts";
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
    knownGaps: [],
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
  findings: [],
};

const initialFeasibility: AngularFeasibilityModel = {
  status: "WAITING",
  coreCompatibility: "SUPPORTED",
  runtimeCompatibility: "SUPPORTED",
  thirdPartySummary:
    "17 non-Angular manifest entries will be tracked; TSLint/Codelyzer and Protractor require later tooling transitions.",
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
    outcome: "QUALIFIED_WITH_GAPS",
    knownFailures: [],
    knownGaps: [
      "Karma/Jasmine/Chrome harness is configured, but no src/**/*.spec.ts unit specs exist in the source revision.",
      "Protractor 7 E2E coverage exists and is recorded as legacy test authority for later migration.",
    ],
    steps: initialBaseline().steps.map((step) => ({
      ...step,
      status: step.id === "tests" ? "COVERAGE_GAP" as const : "PASS" as const,
    })),
  };
}

export function completedAnalysis(
  status: AngularAnalysisModel["status"] = "APPROVED",
): AngularAnalysisModel {
  return {
    revision: 1,
    status,
    facts: [
      "1 Angular CLI application: angular-crud-example",
      "1 lazy-loaded feature module: UsersModule",
      "Reactive Forms with cross-field MustMatch validation",
      "HttpClient CRUD service with GET, GET by id, POST, PUT, and DELETE",
      "package-lock.json is the package authority",
      "strict TypeScript and strict Angular templates are enabled",
    ],
    risks: [
      "TSLint 6.1 and Codelyzer 6 require a governed lint-tooling transition on later Angular majors.",
      "Protractor 7 is legacy E2E authority and requires a governed replacement path.",
      "RxJS 6.6 usage includes the legacy throwError(value) call shape that must be modernized later.",
      "Lazy UsersModule routing and local development HTTP interceptor behavior must remain equivalent through every stage.",
    ],
    unknowns: [
      "No source unit specs are present, so unit-level behavioral coverage cannot be used as migration evidence until tests are added.",
    ],
    reviewerVerdict: "ACCEPT",
    summary:
      "The source is a single Angular 11.0.4 CLI application with a lazy UsersModule, Reactive Forms, an HttpClient CRUD service, an interceptor-based local development API, strict templates, and legacy TSLint/Protractor tooling that must be governed across later majors.",
    confidence: "HIGH",
    proposer: llmProvenance("phase_proposer", "SUCCEEDED", 3500, 2864, 748),
    reviewer: llmProvenance("phase_reviewer", "SUCCEEDED", 3400, 1760, 392),
    applicationProfile: {
      repository: ANGULAR11_CRUD_SOURCE.repository,
      revision: ANGULAR11_CRUD_SOURCE.revision,
      applicationName: ANGULAR11_CRUD_SOURCE.applicationName,
      angular: ANGULAR11_CRUD_SOURCE.angular,
      angularCli: ANGULAR11_CRUD_SOURCE.angularCli,
      buildAngular: ANGULAR11_CRUD_SOURCE.buildAngular,
      typescript: ANGULAR11_CRUD_SOURCE.typescript,
      rxjs: ANGULAR11_CRUD_SOURCE.rxjs,
      zoneJs: ANGULAR11_CRUD_SOURCE.zoneJs,
      projects: ANGULAR11_CRUD_SOURCE.projects,
      lazyFeatureModules: ANGULAR11_CRUD_SOURCE.lazyFeatureModules,
      crudOperations: ANGULAR11_CRUD_SOURCE.crudOperations,
      routes: [...ANGULAR11_CRUD_SOURCE.routes],
      architecture: [...ANGULAR11_CRUD_SOURCE.architecture],
      tooling: { ...ANGULAR11_CRUD_SOURCE.tooling },
    },
    findings: [
      {
        id: "preserve-ngmodule",
        category: "ARCHITECTURE",
        severity: "INFO",
        title: "Preserve NgModule architecture during major-by-major migration",
        evidence:
          "AppModule and lazy UsersModule are explicit source architecture; no standalone conversion is required for the migration goal.",
        impact:
          "Keep module boundaries stable unless an Angular-owned migration explicitly requires a change.",
      },
      {
        id: "lazy-users-module",
        category: "ROUTING",
        severity: "WATCH",
        title: "Keep the lazy UsersModule route behavior equivalent",
        evidence:
          "src/app/app-routing.module.ts lazy-loads src/app/users/users.module.ts for /users.",
        impact:
          "Verify /users, /users/add, and /users/edit/:id after each adjacent-major stage.",
      },
      {
        id: "reactive-forms",
        category: "FORMS",
        severity: "WATCH",
        title: "Preserve Reactive Forms validation semantics",
        evidence:
          "AddEditComponent uses required/email/minLength validators plus MustMatch(password, confirmPassword).",
        impact:
          "Form validity, add/edit password rules, and cross-field confirmation behavior require parity checks.",
      },
      {
        id: "interceptor-localstorage",
        category: "HTTP",
        severity: "WATCH",
        title: "Preserve interceptor-based local CRUD behavior",
        evidence:
          "The development HTTP interceptor handles five CRUD operations, persists users in localStorage, and delays responses by 500ms.",
        impact:
          "HttpClient/interceptor ordering and CRUD behavior must remain stable during framework transitions.",
      },
      {
        id: "rxjs-throwerror",
        category: "DEPENDENCY",
        severity: "WATCH",
        title: "Track legacy RxJS throwError call shape",
        evidence:
          "Error handling uses throwError(value) with RxJS 6.6 and rxjs/operators.",
        impact:
          "Later RxJS compatibility work should modernize the call shape without changing propagated error behavior.",
      },
      {
        id: "tslint-codelyzer",
        category: "TOOLING",
        severity: "MIGRATION_REQUIRED",
        title: "Replace TSLint/Codelyzer on a governed later stage",
        evidence:
          "angular.json uses @angular-devkit/build-angular:tslint with TSLint 6.1 and Codelyzer 6.",
        impact:
          "Lint authority must transition without silently dropping source quality checks.",
      },
      {
        id: "protractor",
        category: "TESTING",
        severity: "MIGRATION_REQUIRED",
        title: "Replace Protractor E2E authority",
        evidence:
          "e2e/protractor.conf.js and e2e/src/app.e2e-spec.ts define Protractor 7 + Jasmine E2E coverage.",
        impact:
          "Preserve the E2E intent while moving to supported browser-test tooling at the appropriate migration stage.",
      },
      {
        id: "unit-test-gap",
        category: "TESTING",
        severity: "WATCH",
        title: "Unit-test coverage is absent in the source revision",
        evidence:
          "src/test.ts discovers src/**/*.spec.ts, but the source tree contains no unit spec files.",
        impact:
          "Build, lint, E2E, route/service evidence, and manual parity carry more weight until unit coverage is introduced.",
      },
    ],
  };
}

export function completedFeasibility(): AngularFeasibilityModel {
  return {
    status: "APPROVED",
    coreCompatibility: "SUPPORTED",
    runtimeCompatibility: "SUPPORTED",
    thirdPartySummary:
      "17 non-Angular manifest entries tracked · TSLint/Codelyzer and Protractor migration-required · RxJS 6.6 modernization watched",
    lockfileAuthority: "package-lock.json",
    warnings: [
      "Legacy lint and E2E tooling transitions will be governed inside the affected adjacent-major stages.",
    ],
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
        baselineCommand(run.id, "BASELINE_INSTALL", "npm ci", now, [
          "Lockfile authority accepted.",
          "Install completed.",
        ]),
        baselineCommand(run.id, "BASELINE_BUILD", "npm run build -- --prod", now, [
          "Baseline build completed with exit code 0.",
        ]),
        baselineCommand(run.id, "BASELINE_TEST", "npm test -- --watch=false --browsers=ChromeHeadless", now, [
          "Karma/Jasmine/Chrome harness verified.",
          "No source unit specs discovered; coverage gap classified as known baseline evidence.",
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
          "Repository-grounded Angular 11 CRUD findings, Azure OpenAI proposer/reviewer provenance, and evidence references were bound to the G04 package.",
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
