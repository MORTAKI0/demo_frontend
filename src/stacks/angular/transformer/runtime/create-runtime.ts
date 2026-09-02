import { stableDisplayChecksum } from "../../../../scenarios/runtime/checksum.ts";
import type { TransformerGateDecision } from "../domain/gates.ts";
import type { TransformerGatePolicy } from "../domain/scenarios.ts";
import type {
  TransformerRouteContext,
  TransformerRuntime,
  TransformerTimingProfileId,
} from "../domain/types.ts";
import { deterministicTransformerId } from "./identity.ts";

export interface CreateTransformerRuntimeInput {
  id?: string;
  runId: string;
  stageId: string;
  sourceMajor: number;
  targetMajor: number;
  timingProfile: TransformerTimingProfileId;
  scenarioId: string;
  runtimeProfileId: string;
  startedAtMs: number;
  accumulatedElapsedMs?: number;
  routeContext: TransformerRouteContext;
  gatePolicy: TransformerGatePolicy;
  g07Decision?: TransformerGateDecision;
  gateDecisions?: TransformerRuntime["gateDecisions"];
}

export function createTransformerRuntime(
  input: CreateTransformerRuntimeInput,
): TransformerRuntime {
  const g07Decision = input.g07Decision ?? input.gateDecisions?.G07;
  if (
    !g07Decision ||
    g07Decision.gateId !== "G07" ||
    g07Decision.decision !== "APPROVE"
  ) {
    throw new Error(
      "Transformer runtime creation requires the persisted approved G07 decision",
    );
  }

  const seed = {
    runId: input.runId,
    stageId: input.stageId,
    nodeId: "select_run_mode",
    attempt: 1,
    timingProfile: input.timingProfile,
  } as const;

  return {
    schemaVersion: "transformer-runtime-v1",
    id: input.id ?? deterministicTransformerId("runtime", seed),
    runId: input.runId,
    stageId: input.stageId,
    sourceMajor: input.sourceMajor,
    targetMajor: input.targetMajor,
    timingProfile: input.timingProfile,
    scenarioId: input.scenarioId,
    runtimeProfileId: input.runtimeProfileId,
    gatePolicyId: input.gatePolicy.id,
    status: "RUNNING",
    startedAtMs: input.startedAtMs,
    accumulatedElapsedMs: input.accumulatedElapsedMs ?? 0,
    cursor: {
      phaseId: "STAGE_PREPARATION",
      nodeId: "select_run_mode",
      eventSequence: 0,
      stateVersion: 0,
      wakeSequence: 0,
    },
    gateDecisions: {
      ...(input.gateDecisions ?? {}),
      G07: {
        ...g07Decision,
        packageChecksum:
          g07Decision.packageChecksum ||
          stableDisplayChecksum(
            [input.runId, input.stageId, "G07", "APPROVE"].join("|"),
          ),
      },
    },
    cancellationRequested: false,
    routeContext: { ...input.routeContext },
  };
}
