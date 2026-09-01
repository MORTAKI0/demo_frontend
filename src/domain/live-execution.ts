export type LiveExecutionStepKind =
  | "SYSTEM"
  | "COMMAND"
  | "LLM"
  | "REVIEWER";

export interface LiveExecutionStep {
  id: string;
  label: string;
  node: string;
  detail: string;
  durationMs: number;
  kind: LiveExecutionStepKind;
  logs: string[];
  command?: string;
  provider?: string;
  deployment?: string;
  role?: string;
}

export interface LiveExecution<K extends string> {
  id: string;
  kind: K;
  status: "RUNNING";
  startedAtMs: number;
  steps: LiveExecutionStep[];
}

export interface ProjectedLiveExecutionStep extends LiveExecutionStep {
  status: "PENDING" | "RUNNING" | "PASS";
  visibleLogs: string[];
}

export interface LiveExecutionProjection<K extends string> {
  id: string;
  kind: K;
  progressPercent: number;
  elapsedMs: number;
  totalDurationMs: number;
  activeStepIndex: number;
  activeStep: ProjectedLiveExecutionStep | null;
  steps: ProjectedLiveExecutionStep[];
}

export function liveExecutionDuration<K extends string>(
  execution: LiveExecution<K>,
): number {
  return execution.steps.reduce((total, step) => total + step.durationMs, 0);
}

export function projectLiveExecution<K extends string>(
  execution: LiveExecution<K>,
  nowMs: number,
): LiveExecutionProjection<K> {
  const elapsedMs = Math.max(0, nowMs - execution.startedAtMs);
  const totalDurationMs = liveExecutionDuration(execution);
  let consumed = 0;
  let activeStepIndex = execution.steps.length - 1;

  const steps = execution.steps.map((step, index) => {
    const startsAt = consumed;
    const endsAt = startsAt + step.durationMs;
    consumed = endsAt;

    if (elapsedMs >= endsAt) {
      return {
        ...step,
        status: "PASS" as const,
        visibleLogs: step.logs,
      };
    }

    if (elapsedMs >= startsAt) {
      activeStepIndex = index;
      const stepElapsed = Math.max(0, elapsedMs - startsAt);
      const fraction =
        step.durationMs <= 0 ? 1 : Math.min(1, stepElapsed / step.durationMs);
      const visibleCount =
        step.logs.length === 0
          ? 0
          : Math.max(1, Math.ceil(step.logs.length * fraction));
      return {
        ...step,
        status: "RUNNING" as const,
        visibleLogs: step.logs.slice(0, visibleCount),
      };
    }

    return {
      ...step,
      status: "PENDING" as const,
      visibleLogs: [],
    };
  });

  if (elapsedMs >= totalDurationMs) {
    activeStepIndex = execution.steps.length - 1;
  }

  const activeStep =
    steps.find((step) => step.status === "RUNNING") ??
    (elapsedMs >= totalDurationMs ? steps.at(-1) ?? null : null);

  return {
    id: execution.id,
    kind: execution.kind,
    progressPercent:
      totalDurationMs <= 0
        ? 100
        : Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100)),
    elapsedMs,
    totalDurationMs,
    activeStepIndex,
    activeStep,
    steps,
  };
}
