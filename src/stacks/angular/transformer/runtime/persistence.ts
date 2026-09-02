import {
  TRANSFORMER_GATE_IDS,
  type TransformerGateDecision,
  type TransformerGateId,
} from "../domain/gates.ts";
import {
  TRANSFORMER_PHASE_IDS,
  TRANSFORMER_TIMING_PROFILE_IDS,
  type TransformerRuntime,
  type TransformerRuntimeStatus,
} from "../domain/types.ts";

const RUNTIME_STATUSES = new Set<TransformerRuntimeStatus>([
  "RUNNING",
  "WAITING_GATE",
  "WAITING_REPAIR",
  "BLOCKED",
  "SEALED",
  "COMPLETED",
  "CANCELLED",
]);

const GATE_IDS = new Set<string>(TRANSFORMER_GATE_IDS);
const PHASE_IDS = new Set<string>(TRANSFORMER_PHASE_IDS);
const TIMING_PROFILES = new Set<string>(TRANSFORMER_TIMING_PROFILE_IDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isGateDecision(
  value: unknown,
  expectedGateId: TransformerGateId,
): value is TransformerGateDecision {
  if (!isRecord(value)) return false;
  return (
    value.gateId === expectedGateId &&
    (value.decision === "APPROVE" ||
      value.decision === "REJECT" ||
      value.decision === "REQUEST_CHANGES") &&
    typeof value.decidedAt === "string" &&
    Number.isFinite(Date.parse(value.decidedAt)) &&
    typeof value.packageChecksum === "string" &&
    value.packageChecksum.length > 0
  );
}

function parseGateDecisions(
  value: unknown,
): TransformerRuntime["gateDecisions"] | null {
  if (!isRecord(value)) return null;
  const decisions: TransformerRuntime["gateDecisions"] = {};
  for (const [gateId, decision] of Object.entries(value)) {
    if (!GATE_IDS.has(gateId)) return null;
    const typedGateId = gateId as TransformerGateId;
    if (!isGateDecision(decision, typedGateId)) return null;
    decisions[typedGateId] = { ...decision };
  }
  return decisions;
}

export function serializeTransformerRuntime(runtime: TransformerRuntime): string {
  const durable: TransformerRuntime = {
    schemaVersion: "transformer-runtime-v1",
    id: runtime.id,
    runId: runtime.runId,
    stageId: runtime.stageId,
    sourceMajor: runtime.sourceMajor,
    targetMajor: runtime.targetMajor,
    timingProfile: runtime.timingProfile,
    scenarioId: runtime.scenarioId,
    runtimeProfileId: runtime.runtimeProfileId,
    gatePolicyId: runtime.gatePolicyId,
    status: runtime.status,
    startedAtMs: runtime.startedAtMs,
    accumulatedElapsedMs: runtime.accumulatedElapsedMs,
    cursor: {
      phaseId: runtime.cursor.phaseId,
      nodeId: runtime.cursor.nodeId,
      eventSequence: runtime.cursor.eventSequence,
      stateVersion: runtime.cursor.stateVersion,
      wakeSequence: runtime.cursor.wakeSequence,
    },
    gateDecisions: Object.fromEntries(
      Object.entries(runtime.gateDecisions).map(([gateId, decision]) => [
        gateId,
        decision ? { ...decision } : decision,
      ]),
    ) as TransformerRuntime["gateDecisions"],
    ...(runtime.activeGate ? { activeGate: runtime.activeGate } : {}),
    ...(runtime.activeRepairAttemptId
      ? { activeRepairAttemptId: runtime.activeRepairAttemptId }
      : {}),
    cancellationRequested: runtime.cancellationRequested,
    routeContext: {
      stageIndex: runtime.routeContext.stageIndex,
      stageCount: runtime.routeContext.stageCount,
      sealedStageCount: runtime.routeContext.sealedStageCount,
      ...(runtime.routeContext.previousSealId
        ? { previousSealId: runtime.routeContext.previousSealId }
        : {}),
    },
  };

  return JSON.stringify(durable);
}

export function deserializeTransformerRuntime(
  serialized: string,
): TransformerRuntime | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== "transformer-runtime-v1") {
    return null;
  }

  if (
    typeof parsed.id !== "string" ||
    typeof parsed.runId !== "string" ||
    typeof parsed.stageId !== "string" ||
    !isFiniteNumber(parsed.sourceMajor) ||
    !isFiniteNumber(parsed.targetMajor) ||
    typeof parsed.timingProfile !== "string" ||
    !TIMING_PROFILES.has(parsed.timingProfile) ||
    typeof parsed.scenarioId !== "string" ||
    typeof parsed.runtimeProfileId !== "string" ||
    typeof parsed.gatePolicyId !== "string" ||
    typeof parsed.status !== "string" ||
    !RUNTIME_STATUSES.has(parsed.status as TransformerRuntimeStatus) ||
    !isFiniteNumber(parsed.startedAtMs) ||
    !isFiniteNumber(parsed.accumulatedElapsedMs) ||
    typeof parsed.cancellationRequested !== "boolean" ||
    !isRecord(parsed.cursor) ||
    typeof parsed.cursor.phaseId !== "string" ||
    !PHASE_IDS.has(parsed.cursor.phaseId) ||
    typeof parsed.cursor.nodeId !== "string" ||
    !isFiniteNumber(parsed.cursor.eventSequence) ||
    !isFiniteNumber(parsed.cursor.stateVersion) ||
    !isFiniteNumber(parsed.cursor.wakeSequence) ||
    !isRecord(parsed.routeContext) ||
    !isFiniteNumber(parsed.routeContext.stageIndex) ||
    !isFiniteNumber(parsed.routeContext.stageCount) ||
    !isFiniteNumber(parsed.routeContext.sealedStageCount)
  ) {
    return null;
  }

  const gateDecisions = parseGateDecisions(parsed.gateDecisions);
  if (!gateDecisions || gateDecisions.G07?.decision !== "APPROVE") {
    return null;
  }

  if (
    parsed.activeGate !== undefined &&
    (typeof parsed.activeGate !== "string" || !GATE_IDS.has(parsed.activeGate))
  ) {
    return null;
  }
  if (
    parsed.activeRepairAttemptId !== undefined &&
    typeof parsed.activeRepairAttemptId !== "string"
  ) {
    return null;
  }
  if (
    parsed.routeContext.previousSealId !== undefined &&
    typeof parsed.routeContext.previousSealId !== "string"
  ) {
    return null;
  }

  return {
    schemaVersion: "transformer-runtime-v1",
    id: parsed.id,
    runId: parsed.runId,
    stageId: parsed.stageId,
    sourceMajor: parsed.sourceMajor,
    targetMajor: parsed.targetMajor,
    timingProfile: parsed.timingProfile as TransformerRuntime["timingProfile"],
    scenarioId: parsed.scenarioId,
    runtimeProfileId: parsed.runtimeProfileId,
    gatePolicyId: parsed.gatePolicyId,
    status: parsed.status as TransformerRuntimeStatus,
    startedAtMs: parsed.startedAtMs,
    accumulatedElapsedMs: parsed.accumulatedElapsedMs,
    cursor: {
      phaseId: parsed.cursor.phaseId as TransformerRuntime["cursor"]["phaseId"],
      nodeId: parsed.cursor.nodeId,
      eventSequence: parsed.cursor.eventSequence,
      stateVersion: parsed.cursor.stateVersion,
      wakeSequence: parsed.cursor.wakeSequence,
    },
    gateDecisions,
    ...(parsed.activeGate
      ? { activeGate: parsed.activeGate as TransformerGateId }
      : {}),
    ...(parsed.activeRepairAttemptId
      ? { activeRepairAttemptId: parsed.activeRepairAttemptId }
      : {}),
    cancellationRequested: parsed.cancellationRequested,
    routeContext: {
      stageIndex: parsed.routeContext.stageIndex,
      stageCount: parsed.routeContext.stageCount,
      sealedStageCount: parsed.routeContext.sealedStageCount,
      ...(parsed.routeContext.previousSealId
        ? { previousSealId: parsed.routeContext.previousSealId }
        : {}),
    },
  };
}
