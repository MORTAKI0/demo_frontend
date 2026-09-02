import type { TransformerGateDecision } from "../domain/gates.ts";
import type { TransformerRuntime } from "../domain/types.ts";

export function applyTransformerGateDecision(
  runtime: TransformerRuntime,
  decision: TransformerGateDecision,
): TransformerRuntime {
  return {
    ...runtime,
    status: "RUNNING",
    activeGate: undefined,
    gateDecisions: {
      ...runtime.gateDecisions,
      [decision.gateId]: { ...decision },
    },
  };
}
