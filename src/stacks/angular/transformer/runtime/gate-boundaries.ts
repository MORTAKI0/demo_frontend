import type { TransformerGateId } from "../domain/gates.ts";
import type { TransformerGatePolicy } from "../domain/scenarios.ts";
import { PROVEN_NODE_CATALOGUE } from "../data/node-catalogue.ts";

export interface TransformerGateBoundary {
  afterNodeId: string;
  gateId: TransformerGateId;
}

export function gateBoundariesForPolicy(
  policy: TransformerGatePolicy,
): readonly TransformerGateBoundary[] {
  const boundaries: TransformerGateBoundary[] = [
    {
      afterNodeId: "freeze_target_authority",
      gateId: policy.transformationReviewGate,
    },
  ];

  if (policy.postValidation.kind === "G11_DIRECT_SEAL") {
    boundaries.push({
      afterNodeId: "aggregate_proven_validation",
      gateId: "G11",
    });
    return boundaries;
  }

  boundaries.push(
    {
      afterNodeId: "aggregate_proven_validation",
      gateId: "G09",
    },
    {
      afterNodeId: "promotion_pending",
      gateId: "G12",
    },
  );
  return boundaries;
}

export function nodesForGatePolicy(policy: TransformerGatePolicy) {
  if (policy.postValidation.kind === "G11_DIRECT_SEAL") {
    return PROVEN_NODE_CATALOGUE.filter(
      (node) =>
        node.id !== "promotion_pending" && node.id !== "promote_validated",
    );
  }
  return [...PROVEN_NODE_CATALOGUE];
}
