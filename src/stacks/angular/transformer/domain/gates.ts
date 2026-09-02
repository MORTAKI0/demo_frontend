export const TRANSFORMER_GATE_IDS = [
  "G07",
  "G08",
  "G09",
  "G10",
  "G11",
  "G12",
] as const;

export type TransformerGateId = (typeof TRANSFORMER_GATE_IDS)[number];

export type TransformerGateDecisionValue =
  | "APPROVE"
  | "REJECT"
  | "REQUEST_CHANGES";

export interface TransformerGateDecision {
  gateId: TransformerGateId;
  decision: TransformerGateDecisionValue;
  decidedAt: string;
  packageChecksum: string;
}
