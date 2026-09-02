import type { TransformerGateDecision, TransformerGateId } from "./gates";

export const TRANSFORMER_TIMING_PROFILE_IDS = [
  "PRESENTATION_REALISTIC",
  "REFERENCE_E2E_SCALE",
] as const;

export type TransformerTimingProfileId =
  (typeof TRANSFORMER_TIMING_PROFILE_IDS)[number];

export const TRANSFORMER_PHASE_IDS = [
  "STAGE_PREPARATION",
  "SOURCE_BASELINE",
  "DISCOVERY",
  "TARGET_AUTHORITY_MATERIALIZATION",
  "MIGRATION_OWNERS_TRANSFORMATION_REVIEW",
  "CLEAN_VALIDATION",
  "POST_VALIDATION_AUTHORITY_SEAL",
  "REPAIR",
] as const;

export type TransformerPhaseId = (typeof TRANSFORMER_PHASE_IDS)[number];
export type PrimaryTransformerPhaseId = Exclude<TransformerPhaseId, "REPAIR">;

export type TransformerRuntimeStatus =
  | "RUNNING"
  | "WAITING_GATE"
  | "WAITING_REPAIR"
  | "BLOCKED"
  | "SEALED"
  | "COMPLETED"
  | "CANCELLED";

export interface TransformerRuntimeCursor {
  phaseId: TransformerPhaseId;
  nodeId: string;
  eventSequence: number;
  stateVersion: number;
  wakeSequence: number;
}

export interface TransformerRouteContext {
  stageIndex: number;
  stageCount: number;
  sealedStageCount: number;
  previousSealId?: string;
}

export interface TransformerRuntime {
  schemaVersion: "transformer-runtime-v1";
  id: string;
  runId: string;
  stageId: string;
  sourceMajor: number;
  targetMajor: number;
  timingProfile: TransformerTimingProfileId;
  scenarioId: string;
  status: TransformerRuntimeStatus;
  startedAtMs: number;
  accumulatedElapsedMs: number;
  cursor: TransformerRuntimeCursor;
  gateDecisions: Partial<Record<TransformerGateId, TransformerGateDecision>>;
  activeGate?: TransformerGateId;
  activeRepairAttemptId?: string;
  cancellationRequested: boolean;
  routeContext: TransformerRouteContext;
}
