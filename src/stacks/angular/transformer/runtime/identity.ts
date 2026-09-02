import { stableDisplayChecksum } from "../../../../scenarios/runtime/checksum.ts";
import type { TransformerTimingSeed } from "../domain/timing.ts";

export type TransformerIdentityKind =
  | "runtime"
  | "execution"
  | "event"
  | "artifact"
  | "generation"
  | "checkpoint"
  | "seal";

export function deterministicTransformerId(
  kind: TransformerIdentityKind,
  seed: TransformerTimingSeed,
  discriminator = "",
): string {
  const checksum = stableDisplayChecksum(
    [
      kind,
      seed.runId,
      seed.stageId,
      seed.nodeId,
      String(seed.attempt),
      seed.timingProfile,
      discriminator,
    ].join("|"),
  );
  return `${kind}-${checksum.slice(0, 12)}`;
}
