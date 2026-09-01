import { liveExecutionDuration } from "../../../domain/live-execution.ts";
import type {
  JavaJobModel,
  JavaLiveExecution,
  JavaLiveExecutionKind,
} from "../domain/run-types.ts";
import { advanceJavaPipeline } from "./cockpit.ts";
import { createJavaLiveExecution } from "./live-definitions.ts";

const EXECUTABLE_PHASES = new Set<JavaLiveExecutionKind>([
  "PREFLIGHT",
  "CANCELLATION",
  "ANALYSIS_AGENT",
  "PLANNING_AGENT",
  "ASSESSMENT_AGENT",
  "TRANSFORM_AGENT",
  "BUILD_AGENT",
  "TEST_VALIDATION",
]);

export { liveExecutionDuration as javaLiveExecutionDuration };

function liveKind(job: JavaJobModel): JavaLiveExecutionKind | null {
  const phase = job.currentPhase as JavaLiveExecutionKind;
  return EXECUTABLE_PHASES.has(phase) ? phase : null;
}

export function ensureJavaLiveExecution(
  job: JavaJobModel,
  startedAtMs: number,
): JavaJobModel {
  if (
    job.liveExecution ||
    job.currentGate ||
    job.currentStage === 4 ||
    job.status === "CANCELLED" ||
    job.status === "COMPLETED"
  ) {
    return job;
  }

  const kind = liveKind(job);
  if (!kind) return job;

  return {
    ...job,
    status: "RUNNING",
    currentAction: executionAction(kind),
    liveExecution: createJavaLiveExecution(
      kind,
      startedAtMs,
      job.currentStage,
    ),
  };
}

export function advanceJavaLiveExecution(
  job: JavaJobModel,
  nowMs: number,
): JavaJobModel {
  const execution = job.liveExecution;
  if (!execution) return ensureJavaLiveExecution(job, nowMs);

  if (
    nowMs <
    execution.startedAtMs + liveExecutionDuration(execution)
  ) {
    return job;
  }

  const next = advanceJavaPipeline(
    { ...job, liveExecution: undefined },
    new Date(nowMs).toISOString(),
  );

  return ensureJavaLiveExecution(next, nowMs);
}

function executionAction(kind: JavaLiveExecutionKind): string {
  switch (kind) {
    case "PREFLIGHT":
      return "Preflight checks are running";
    case "CANCELLATION":
      return "Checking cancellation and execution lease";
    case "ANALYSIS_AGENT":
      return "Analysis Proposer and independent Reviewer are running";
    case "PLANNING_AGENT":
      return "Planning Proposer and independent Reviewer are running";
    case "ASSESSMENT_AGENT":
      return "Assessment Agent is validating execution readiness";
    case "TRANSFORM_AGENT":
      return "Transformation Agent is applying the accepted stage plan";
    case "BUILD_AGENT":
      return "Maven build validation is running";
    case "TEST_VALIDATION":
      return "Governed test validation is running";
    default:
      return "Java migration execution is running";
  }
}

export function hasJavaLiveExecution(
  value: JavaJobModel["liveExecution"],
): value is JavaLiveExecution {
  return Boolean(value);
}
