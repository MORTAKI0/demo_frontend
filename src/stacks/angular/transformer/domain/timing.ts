import { stableDisplayChecksum } from "../../../../scenarios/runtime/checksum.ts";
import type { TransformerTimingProfileId } from "./types.ts";

export const TRANSFORMER_TIMING_ENVELOPES = {
  STAGE_BINDING: { minMs: 10_000, maxMs: 20_000 },
  CONTROL_PLANE: { minMs: 250, maxMs: 1_000 },
  SOURCE_INSTALL: { minMs: 35_000, maxMs: 60_000 },
  SOURCE_PROOF: { minMs: 12_000, maxMs: 25_000 },
  SOURCE_BUILD: { minMs: 25_000, maxMs: 45_000 },
  SOURCE_TEST: { minMs: 20_000, maxMs: 40_000 },
  DISCOVERY: { minMs: 30_000, maxMs: 55_000 },
  LOCK_GENERATION: { minMs: 25_000, maxMs: 45_000 },
  TARGET_INSTALL: { minMs: 35_000, maxMs: 65_000 },
  TARGET_PROOF: { minMs: 15_000, maxMs: 30_000 },
  MIGRATION_OWNER: { minMs: 20_000, maxMs: 45_000 },
  VALIDATION_INSTALL: { minMs: 35_000, maxMs: 65_000 },
  VALIDATION_BUILD: { minMs: 30_000, maxMs: 55_000 },
  VALIDATION_TEST: { minMs: 25_000, maxMs: 50_000 },
  DIAGNOSTIC_AGGREGATION: { minMs: 10_000, maxMs: 20_000 },
  POST_VALIDATION_SEAL: { minMs: 20_000, maxMs: 40_000 },
} as const;

export type TransformerTimingOperation =
  keyof typeof TRANSFORMER_TIMING_ENVELOPES;

export interface TransformerTimingSeed {
  runId: string;
  stageId: string;
  nodeId: string;
  attempt: number;
  timingProfile: TransformerTimingProfileId;
}

export const CLEAN_STAGE_CORE_TIMING_OPERATIONS = [
  "SOURCE_INSTALL",
  "SOURCE_BUILD",
  "SOURCE_TEST",
  "DISCOVERY",
  "LOCK_GENERATION",
  "TARGET_INSTALL",
  "VALIDATION_INSTALL",
  "VALIDATION_BUILD",
  "VALIDATION_TEST",
] as const satisfies readonly TransformerTimingOperation[];

function deterministicUint32(input: string): number {
  return Number.parseInt(stableDisplayChecksum(input).slice(0, 8), 16) >>> 0;
}

export function deterministicDurationMs(
  seed: TransformerTimingSeed,
  operation: TransformerTimingOperation,
): number {
  const envelope = TRANSFORMER_TIMING_ENVELOPES[operation];
  const span = envelope.maxMs - envelope.minMs + 1;
  const source = [
    seed.runId,
    seed.stageId,
    seed.nodeId,
    String(seed.attempt),
    seed.timingProfile,
    operation,
  ].join("|");
  return envelope.minMs + (deterministicUint32(source) % span);
}
