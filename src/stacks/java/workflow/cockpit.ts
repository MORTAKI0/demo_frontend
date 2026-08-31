import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import type { JavaProfileId } from "../domain/types.ts";
import { computeJavaRoute } from "./setup.ts";
import type {
  JavaAnalysisRevision,
  JavaGateDecision,
  JavaJobModel,
  JavaPhaseGate,
  JavaPhaseGateType,
  JavaPipelinePhase,
  JavaPipelinePhaseId,
  JavaPlanningRevision,
} from "../domain/run-types.ts";
import { JAVA_PIPELINE_PHASES } from "../domain/run-types.ts";
import type { JavaJobSeed } from "../domain/types.ts";
import {
  enterJavaRepair,
  markJavaRepairValidated,
} from "./repair.ts";

const PHASE_LABELS: Record<JavaPipelinePhaseId, string> = {
  PREFLIGHT: "Preflight",
  CANCELLATION: "Cancellation",
  ANALYSIS_AGENT: "Analysis Agent",
  PLANNING_AGENT: "Planning Agent",
  ASSESSMENT_AGENT: "Assessment Agent",
  HUMAN_APPROVAL: "Human Approval",
  TRANSFORM_AGENT: "Transform Agent",
  BUILD_AGENT: "Build Agent",
  TEST_VALIDATION: "Test Validation",
  REPAIR_FAILURE: "Repair / Failure",
  RESULT_CONTRACT: "Result Contract",
  FINAL_REPORT: "Final Report",
  STAGE_REPORT: "Stage Report",
};

export function getJavaGateDecisions(type: JavaPhaseGateType): JavaGateDecision[] {
  if (type === "analysis_review") {
    return ["CONTINUE", "REANALYZE", "OVERRIDE_SOURCE_PROFILE"];
  }
  if (type === "planning_review") {
    return ["CONTINUE", "REVISE"];
  }
  if (type === "approval_review") {
    return ["APPROVE", "REJECT"];
  }
  if (type === "repair_review") {
    return ["CONTINUE", "REANALYZE", "REVISE", "REJECT"];
  }
  return ["CONTINUE"];
}

function freshPipeline(active: JavaPipelinePhaseId = "PREFLIGHT"): JavaPipelinePhase[] {
  return JAVA_PIPELINE_PHASES.map((id) => ({
    id,
    label: PHASE_LABELS[id],
    status: id === active ? "RUNNING" : "PENDING",
    detail:
      id === "REPAIR_FAILURE"
        ? "Activated only when build or test validation fails."
        : id === "FINAL_REPORT"
          ? "Generated from accepted terminal conditions."
          : "Awaiting the prior Java execution phase.",
  }));
}

function setPhase(
  pipeline: JavaPipelinePhase[],
  completed: JavaPipelinePhaseId | null,
  next: JavaPipelinePhaseId | null,
): JavaPipelinePhase[] {
  return pipeline.map((phase) => {
    if (completed && phase.id === completed) return { ...phase, status: "PASS" as const };
    if (next && phase.id === next) return { ...phase, status: "RUNNING" as const };
    return phase;
  });
}

function stageForGate(job: JavaJobModel): 1 | 2 | 3 {
  if (job.currentStage === 1 || job.currentStage === 2 || job.currentStage === 3) {
    return job.currentStage;
  }
  throw new Error("Java Stage 4 is terminal-special and cannot own a normal PhaseGate.");
}

export function createJavaPhaseGate(
  job: JavaJobModel,
  type: JavaPhaseGateType,
): JavaPhaseGate {
  const stage = stageForGate(job);
  const revision =
    job.phaseGates.filter((gate) => gate.type === type && gate.stage === stage).length + 1;
  return {
    id: job.id + "-" + type + "-s" + stage + "-r" + revision,
    type,
    stage,
    status: "PENDING",
    revision,
    checksum: stableDisplayChecksum(
      job.id + ":" + type + ":" + stage + ":" + revision,
    ),
    decisions: [],
  };
}

function initialAnalysis(job: JavaJobSeed): JavaAnalysisRevision {
  return {
    revision: 1,
    sourceProfile: job.configuration.sourceProfile,
    status: "READY_FOR_REVIEW",
    facts: [
      "Maven project model loaded",
      "Spring Boot source profile confirmed",
      "Java runtime baseline identified",
    ],
    risks: ["Third-party compatibility will be checked before transformation."],
    checksum: stableDisplayChecksum(job.id + ":analysis:1"),
  };
}

function initialPlan(job: JavaJobModel): JavaPlanningRevision {
  const revision = job.planning.length + 1;
  return {
    revision,
    status: "READY_FOR_REVIEW",
    summary:
      "Execute the selected Spring Boot route with reviewed analysis, assessment, pre-transform approval, Maven validation, and governed repair when required.",
    checksum: stableDisplayChecksum(job.id + ":plan:" + revision),
  };
}

export function createJavaJobModel(seed: JavaJobSeed): JavaJobModel {
  return {
    ...seed,
    route: seed.configuration.route,
    pipeline: freshPipeline("PREFLIGHT"),
    phaseGates: [],
    currentGate: null,
    analysis: [],
    planning: [],
    assessment: {
      status: "WAITING",
      summary: "Assessment runs after an accepted migration plan.",
    },
    stageResults: [],
    evidence: [
      {
        id: seed.id + "-configuration",
        category: "CONFIGURATION",
        title: "Migration configuration accepted",
        summary:
          "Source/target profile, route projection, proof level, continuation policy, and pre-transform approval mode are bound to this job.",
        timestamp: seed.createdAt,
        checksum: stableDisplayChecksum(seed.id + ":configuration"),
      },
    ],
    cancellationRequested: false,
    repair: {
      attempts: [],
      maxAttempts: 3,
    },
    terminalStage4: {
      active: seed.currentStage === 4,
      acceptedOutputRevision: null,
    },
  };
}

function withGate(job: JavaJobModel, type: JavaPhaseGateType, action: string): JavaJobModel {
  const gate = createJavaPhaseGate(job, type);
  return {
    ...job,
    status: "ACTION_REQUIRED",
    currentGate: type,
    currentAction: action,
    phaseGates: [...job.phaseGates, gate],
  };
}

export function advanceJavaPipeline(
  job: JavaJobModel,
  now = "2026-08-31T20:40:00+01:00",
): JavaJobModel {
  if (job.currentGate) {
    throw new Error("Resolve the active Java PhaseGate before advancing the pipeline.");
  }
  if (job.cancellationRequested) {
    return {
      ...job,
      status: "CANCELLED",
      currentAction: "Migration cancelled by operator request",
    };
  }
  if (job.currentStage === 4) {
    throw new Error("Java Stage 4 is terminal-special and uses its dedicated workflow.");
  }

  if (job.currentPhase === "PREFLIGHT") {
    return {
      ...job,
      status: "RUNNING",
      currentPhase: "CANCELLATION",
      currentAction: "Check cancellation state before analysis",
      pipeline: setPhase(job.pipeline, "PREFLIGHT", "CANCELLATION"),
    };
  }

  if (job.currentPhase === "CANCELLATION") {
    return {
      ...job,
      currentPhase: "ANALYSIS_AGENT",
      currentAction: "Run Analysis Agent",
      pipeline: setPhase(job.pipeline, "CANCELLATION", "ANALYSIS_AGENT"),
    };
  }

  if (job.currentPhase === "ANALYSIS_AGENT") {
    const revision =
      job.analysis.length === 0
        ? initialAnalysis(job)
        : {
            ...job.analysis.at(-1)!,
            revision: job.analysis.length + 1,
            status: "READY_FOR_REVIEW" as const,
            checksum: stableDisplayChecksum(job.id + ":analysis:" + (job.analysis.length + 1)),
          };
    const next = {
      ...job,
      analysis: [...job.analysis, revision],
      pipeline: setPhase(job.pipeline, "ANALYSIS_AGENT", null),
      evidence: [
        ...job.evidence,
        {
          id: job.id + "-analysis-" + revision.revision,
          category: "ANALYSIS" as const,
          title: "Analysis Agent revision " + revision.revision,
          summary: "Source profile, project facts, and migration risks are ready for independent human review.",
          timestamp: now,
          checksum: revision.checksum,
        },
      ],
    };
    return withGate(next, "analysis_review", "Review Analysis Agent evidence");
  }

  if (job.currentPhase === "PLANNING_AGENT") {
    const plan = initialPlan(job);
    const next = {
      ...job,
      planning: [...job.planning, plan],
      pipeline: setPhase(job.pipeline, "PLANNING_AGENT", null),
      evidence: [
        ...job.evidence,
        {
          id: job.id + "-planning-" + plan.revision,
          category: "PLANNING" as const,
          title: "Planning Agent revision " + plan.revision,
          summary: plan.summary,
          timestamp: now,
          checksum: plan.checksum,
        },
      ],
    };
    return withGate(next, "planning_review", "Review migration plan");
  }

  if (job.currentPhase === "ASSESSMENT_AGENT") {
    const next = {
      ...job,
      assessment: {
        status: "PASS" as const,
        summary:
          "Assessment confirms that the accepted plan can proceed to explicit pre-transform human approval.",
      },
      currentPhase: "HUMAN_APPROVAL",
      pipeline: setPhase(job.pipeline, "ASSESSMENT_AGENT", "HUMAN_APPROVAL"),
      evidence: [
        ...job.evidence,
        {
          id: job.id + "-assessment-s" + job.currentStage,
          category: "ASSESSMENT" as const,
          title: "Assessment Agent completed",
          summary:
            "Assessment produced execution readiness evidence; there is intentionally no assessment_review gate.",
          timestamp: now,
          checksum: stableDisplayChecksum(job.id + ":assessment:" + job.currentStage),
        },
      ],
    };
    return withGate(next, "approval_review", "Approve or reject pre-transform execution");
  }

  if (job.currentPhase === "TRANSFORM_AGENT") {
    return {
      ...job,
      currentPhase: "BUILD_AGENT",
      currentAction: "Run Maven build validation",
      pipeline: setPhase(job.pipeline, "TRANSFORM_AGENT", "BUILD_AGENT"),
      evidence: [
        ...job.evidence,
        {
          id: job.id + "-transform-s" + job.currentStage,
          category: "TRANSFORM",
          title: "Transform Agent completed",
          summary: "Reviewed transformation changes were applied to the current stage workspace.",
          timestamp: now,
          checksum: stableDisplayChecksum(job.id + ":transform:" + job.currentStage),
        },
      ],
    };
  }

  if (job.currentPhase === "BUILD_AGENT") {
    return {
      ...job,
      currentPhase: "TEST_VALIDATION",
      currentAction: "Run test validation",
      pipeline: setPhase(job.pipeline, "BUILD_AGENT", "TEST_VALIDATION"),
      evidence: [
        ...job.evidence,
        {
          id: job.id + "-build-s" + job.currentStage,
          category: "BUILD",
          title: "Maven build passed",
          summary: "Build Agent completed with a green Maven result.",
          timestamp: now,
          checksum: stableDisplayChecksum(job.id + ":build:" + job.currentStage),
        },
      ],
    };
  }

  if (job.currentPhase === "TEST_VALIDATION") {
    const latestRepair = job.repair.attempts.at(-1);
    if (job.currentStage === 2 && !latestRepair) {
      return enterJavaRepair(job, now);
    }
    if (latestRepair?.status === "APPLIED") {
      return completeGreenJavaStage(markJavaRepairValidated(job, now), now);
    }
    return completeGreenJavaStage(job, now);
  }

  throw new Error("Current Java phase requires a gate decision or a dedicated workflow action.");
}

function latestGate(job: JavaJobModel): JavaPhaseGate {
  const gate = job.phaseGates.at(-1);
  if (!gate || gate.type !== job.currentGate) {
    throw new Error("Active Java PhaseGate state is inconsistent.");
  }
  return gate;
}

function updateLatestGate(
  job: JavaJobModel,
  gate: JavaPhaseGate,
): JavaPhaseGate[] {
  return job.phaseGates.map((item) => (item.id === gate.id ? gate : item));
}

export function applyJavaGateDecision(
  job: JavaJobModel,
  type: JavaPhaseGateType,
  decision: JavaGateDecision,
  options: {
    comment?: string;
    overrideSourceProfile?: JavaProfileId;
  } = {},
  now = "2026-08-31T20:41:00+01:00",
): JavaJobModel {
  if (job.currentGate !== type) {
    throw new Error(type + " is not the active Java PhaseGate.");
  }
  const allowed = getJavaGateDecisions(type);
  if (!allowed.includes(decision)) {
    throw new Error(decision + " is not valid for " + type + ".");
  }

  const current = latestGate(job);
  const record = {
    id: current.id + "-decision-" + (current.decisions.length + 1),
    decision,
    timestamp: now,
    checksum: current.checksum,
    comment: options.comment?.trim() || undefined,
  };
  const decided: JavaPhaseGate = {
    ...current,
    status: decision === "REJECT" ? "REJECTED" : "APPROVED",
    decisions: [...current.decisions, record],
  };
  const base: JavaJobModel = {
    ...job,
    phaseGates: updateLatestGate(job, decided),
    evidence: [
      ...job.evidence,
      {
        id: record.id,
        category: "DECISION",
        title: type + " decision",
        summary: decision.replaceAll("_", " "),
        timestamp: now,
        checksum: stableDisplayChecksum(current.checksum + ":" + decision),
      },
    ],
  };

  if (decision === "REJECT") {
    return {
      ...base,
      status: "ACTION_REQUIRED",
      currentAction: "Java migration is stopped by " + type + " rejection",
    };
  }

  if (type === "analysis_review") {
    if (decision === "CONTINUE") {
      return {
        ...base,
        status: "RUNNING",
        currentGate: null,
        currentPhase: "PLANNING_AGENT",
        currentAction: "Run Planning Agent",
        pipeline: setPhase(base.pipeline, null, "PLANNING_AGENT"),
        analysis: base.analysis.map((revision, index, all) =>
          index === all.length - 1
            ? { ...revision, status: "ACCEPTED" as const }
            : revision,
        ),
      };
    }

    const superseded = base.analysis.map((revision, index, all) =>
      index === all.length - 1
        ? { ...revision, status: "SUPERSEDED" as const }
        : revision,
    );

    if (decision === "OVERRIDE_SOURCE_PROFILE") {
      const override = options.overrideSourceProfile;
      if (!override) {
        throw new Error("Override Source Profile requires an explicit source profile.");
      }
      const route = computeJavaRoute(override, base.configuration.targetProfile);
      const firstIncluded = route.find((stage) => stage.disposition === "INCLUDED");
      if (!firstIncluded) throw new Error("Source-profile override produced no included route stage.");

      return {
        ...base,
        status: "RUNNING",
        currentGate: null,
        currentStage: firstIncluded.stage,
        currentPhase: "ANALYSIS_AGENT",
        currentAction: "Reanalyze with overridden source profile",
        route,
        configuration: {
          ...base.configuration,
          sourceProfile: override,
          route,
        },
        analysis: superseded,
        pipeline: freshPipeline("ANALYSIS_AGENT"),
      };
    }

    return {
      ...base,
      status: "RUNNING",
      currentGate: null,
      currentPhase: "ANALYSIS_AGENT",
      currentAction: "Reanalyze current source profile",
      analysis: superseded,
      pipeline: setPhase(base.pipeline, null, "ANALYSIS_AGENT"),
    };
  }

  if (type === "planning_review") {
    if (decision === "REVISE") {
      return {
        ...base,
        status: "RUNNING",
        currentGate: null,
        currentPhase: "PLANNING_AGENT",
        currentAction: "Revise migration plan",
        planning: base.planning.map((revision, index, all) =>
          index === all.length - 1
            ? { ...revision, status: "SUPERSEDED" as const }
            : revision,
        ),
        pipeline: setPhase(base.pipeline, null, "PLANNING_AGENT"),
      };
    }

    return {
      ...base,
      status: "RUNNING",
      currentGate: null,
      currentPhase: "ASSESSMENT_AGENT",
      currentAction: "Run Assessment Agent",
      planning: base.planning.map((revision, index, all) =>
        index === all.length - 1
          ? { ...revision, status: "ACCEPTED" as const }
          : revision,
      ),
      pipeline: setPhase(base.pipeline, null, "ASSESSMENT_AGENT"),
    };
  }

  if (type === "approval_review") {
    return {
      ...base,
      status: "RUNNING",
      currentGate: null,
      currentPhase: "TRANSFORM_AGENT",
      currentAction: "Run Transform Agent",
      pipeline: setPhase(base.pipeline, "HUMAN_APPROVAL", "TRANSFORM_AGENT"),
    };
  }

  if (type === "stage_completion_review") {
    return progressToNextJavaStage(base, now);
  }

  throw new Error("repair_review is handled by the governed repair workflow.");
}

function completeGreenJavaStage(
  job: JavaJobModel,
  now: string,
): JavaJobModel {
  if (job.currentStage !== 1 && job.currentStage !== 2 && job.currentStage !== 3) {
    throw new Error("Normal green-stage completion applies only to Java stages 1–3.");
  }

  const stageResult = {
    stage: job.currentStage,
    status: "PASS" as const,
    build: "PASS" as const,
    tests: "PASS" as const,
    completedAt: now,
  };
  const pipeline = setPhase(job.pipeline, "TEST_VALIDATION", null).map((phase) =>
    phase.id === "RESULT_CONTRACT" || phase.id === "STAGE_REPORT"
      ? { ...phase, status: "PASS" as const }
      : phase,
  );
  const next: JavaJobModel = {
    ...job,
    stageResults: [...job.stageResults, stageResult],
    pipeline,
    evidence: [
      ...job.evidence,
      {
        id: job.id + "-test-s" + job.currentStage,
        category: "TEST",
        title: "Test validation passed",
        summary: "Build and tests are green for the current Java route stage.",
        timestamp: now,
        checksum: stableDisplayChecksum(job.id + ":test:" + job.currentStage),
      },
    ],
  };

  if (job.configuration.continuationPolicy === "MANUAL") {
    return withGate(
      {
        ...next,
        currentPhase: "STAGE_REPORT",
      },
      "stage_completion_review",
      "Review completed Java stage before continuation",
    );
  }

  return progressToNextJavaStage(next, now);
}

function progressToNextJavaStage(
  job: JavaJobModel,
  now: string,
): JavaJobModel {
  const currentStage = job.currentStage;
  const included = job.route.filter((stage) => stage.disposition === "INCLUDED");
  const currentIndex = included.findIndex((stage) => stage.stage === currentStage);
  const next = included[currentIndex + 1];

  if (!next) {
    return {
      ...job,
      status: "ACTION_REQUIRED",
      currentGate: null,
      currentPhase: "FINAL_REPORT",
      currentAction: "Prepare final report from accepted stage results",
      pipeline: job.pipeline.map((phase) =>
        phase.id === "FINAL_REPORT"
          ? { ...phase, status: "RUNNING" as const }
          : phase,
      ),
    };
  }

  if (next.stage === 4) {
    return {
      ...job,
      status: "RUNNING",
      currentStage: 4,
      currentGate: null,
      currentPhase: "TERMINAL_STAGE_4",
      currentAction: "Run terminal Stage 4 target workflow",
      terminalStage4: {
        ...job.terminalStage4,
        active: true,
      },
      pipeline: job.pipeline.map((phase) => ({
        ...phase,
        status: phase.id === "FINAL_REPORT" ? "PENDING" as const : "SKIPPED" as const,
      })),
      evidence: [
        ...job.evidence,
        {
          id: job.id + "-stage-" + currentStage + "-complete",
          category: "STAGE",
          title: "Java stage " + currentStage + " completed",
          summary: "Continuation policy advanced the route to terminal Stage 4.",
          timestamp: now,
          checksum: stableDisplayChecksum(job.id + ":stage-complete:" + currentStage),
        },
      ],
    };
  }

  return {
    ...job,
    status: "RUNNING",
    currentStage: next.stage,
    currentGate: null,
    currentPhase: "PREFLIGHT",
    currentAction: "Run preflight and cancellation checks for Java stage " + next.stage,
    pipeline: freshPipeline("PREFLIGHT"),
    evidence: [
      ...job.evidence,
      {
        id: job.id + "-stage-" + currentStage + "-complete",
        category: "STAGE",
        title: "Java stage " + currentStage + " completed",
        summary: "Continuation policy advanced to Java stage " + next.stage + ".",
        timestamp: now,
        checksum: stableDisplayChecksum(job.id + ":stage-complete:" + currentStage),
      },
    ],
  };
}
