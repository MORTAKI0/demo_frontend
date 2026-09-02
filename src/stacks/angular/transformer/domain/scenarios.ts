import type { TransformerGateId } from "./gates";

export type TransformerPostValidationPolicy =
  | {
      kind: "G11_DIRECT_SEAL";
      gateId: "G11";
      requiresCandidatePromotion: false;
    }
  | {
      kind: "G12_CANDIDATE_PROMOTION";
      gateId: "G12";
      requiresCandidatePromotion: true;
    };

export interface TransformerGatePolicy {
  id: string;
  transformationReviewGate: "G08";
  repairApprovalGate: "G10";
  repairedStateGate: "G11";
  promotionGates: readonly TransformerGateId[];
  postValidation: TransformerPostValidationPolicy;
}

export const DIRECT_SEAL_GATE_POLICY: TransformerGatePolicy = {
  id: "reference-g11-direct-seal",
  transformationReviewGate: "G08",
  repairApprovalGate: "G10",
  repairedStateGate: "G11",
  promotionGates: [],
  postValidation: {
    kind: "G11_DIRECT_SEAL",
    gateId: "G11",
    requiresCandidatePromotion: false,
  },
};

export const CANDIDATE_PROMOTION_GATE_POLICY: TransformerGatePolicy = {
  id: "g09-g12-candidate-promotion",
  transformationReviewGate: "G08",
  repairApprovalGate: "G10",
  repairedStateGate: "G11",
  promotionGates: ["G09", "G12"],
  postValidation: {
    kind: "G12_CANDIDATE_PROMOTION",
    gateId: "G12",
    requiresCandidatePromotion: true,
  },
};
