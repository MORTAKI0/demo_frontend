import type { AngularRunSeed } from "./types.ts";

export type AngularPreTransformGateId = "G02" | "G03" | "G04" | "G05" | "G06";
export type AngularGateStatus = "LOCKED" | "PENDING" | "APPROVED" | "MODIFICATION_REQUESTED" | "REJECTED" | "STALE";
export type AngularGovernanceDecision = "APPROVE" | "APPROVE_WITH_COMMENT" | "REQUEST_MODIFICATION" | "REJECT";

export interface AngularGateDecisionRecord {
  id: string;
  gate: AngularPreTransformGateId;
  decision: AngularGovernanceDecision;
  comment?: string;
  timestamp: string;
  checksum: string;
  revision: number;
}

export interface AngularGateState {
  id: AngularPreTransformGateId;
  label: string;
  status: AngularGateStatus;
  revision: number;
  checksum: string;
  decisions: AngularGateDecisionRecord[];
}

export type AngularBaselineOutcome =
  | "PENDING"
  | "QUALIFIED"
  | "QUALIFIED_WITH_KNOWN_FAILURES"
  | "REPRODUCIBILITY_DEGRADED"
  | "BLOCKED_BY_ENVIRONMENT"
  | "BLOCKED_BY_PROJECT";

export interface AngularBaselineStep {
  id: string;
  label: string;
  status: "PENDING" | "PASS" | "KNOWN_FAILURES" | "BLOCKED";
  detail: string;
}

export interface AngularBaselineModel {
  outcome: AngularBaselineOutcome;
  knownFailures: string[];
  steps: AngularBaselineStep[];
}

export interface AngularAnalysisModel {
  revision: number;
  status: "WAITING" | "READY_FOR_REVIEW" | "APPROVED";
  facts: string[];
  risks: string[];
  unknowns: string[];
  reviewerVerdict: "WAITING" | "ACCEPT";
}

export interface AngularFeasibilityModel {
  status: "WAITING" | "READY_FOR_REVIEW" | "APPROVED";
  coreCompatibility: "SUPPORTED";
  runtimeCompatibility: "SUPPORTED";
  thirdPartySummary: string;
  lockfileAuthority: string;
  warnings: string[];
}

export interface AngularPlanningRevision {
  revision: number;
  status: "READY_FOR_REVIEW" | "SUPERSEDED" | "ACCEPTED";
  summary: string;
  checksum: string;
}

export interface AngularRunEvidence {
  id: string;
  category: "DECISION" | "BASELINE" | "ANALYSIS" | "FEASIBILITY" | "PLANNING" | "SOURCE";
  title: string;
  summary: string;
  timestamp: string;
  checksum: string;
}

export type AngularRunPhase =
  | "SOURCE_SNAPSHOT"
  | "BASELINE"
  | "ANALYSIS"
  | "FEASIBILITY"
  | "PLANNING"
  | "STAGE_PREPARATION"
  | "COMPLETE"
  | "BLOCKED";

export interface AngularRunModel extends AngularRunSeed {
  phase: AngularRunPhase;
  gates: Record<AngularPreTransformGateId, AngularGateState>;
  baseline: AngularBaselineModel;
  analysis: AngularAnalysisModel;
  feasibility: AngularFeasibilityModel;
  planning: AngularPlanningRevision[];
  evidence: AngularRunEvidence[];
  diagnostics: string[];
}
