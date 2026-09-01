import type { LiveExecution } from "../../../domain/live-execution.ts";
import type { AngularMajor, AngularRunSeed } from "./types.ts";

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
  | "QUALIFIED_WITH_GAPS"
  | "REPRODUCIBILITY_DEGRADED"
  | "BLOCKED_BY_ENVIRONMENT"
  | "BLOCKED_BY_PROJECT";

export interface AngularBaselineStep {
  id: string;
  label: string;
  status: "PENDING" | "PASS" | "KNOWN_FAILURES" | "COVERAGE_GAP" | "BLOCKED";
  detail: string;
}

export interface AngularBaselineModel {
  outcome: AngularBaselineOutcome;
  knownFailures: string[];
  knownGaps: string[];
  steps: AngularBaselineStep[];
}

export interface AngularLlmProvenance {
  provider: "azure_openai";
  deployment: "gpt-5-mini";
  role: "phase_proposer" | "phase_reviewer";
  promptVersion: string;
  status: "WAITING" | "RUNNING" | "SUCCEEDED";
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
}

export type AngularLiveExecutionKind =
  | "BASELINE"
  | "ANALYSIS"
  | "FEASIBILITY"
  | "PLANNING"
  | "STAGE_PREPARATION"
  | "STAGE_EXECUTION"
  | "REPAIR_VALIDATION";

export type AngularLiveExecution = LiveExecution<AngularLiveExecutionKind>;

export interface AngularApplicationProfile {
  repository: string;
  revision: string;
  applicationName: string;
  angular: string;
  angularCli: string;
  buildAngular: string;
  typescript: string;
  rxjs: string;
  zoneJs: string;
  projects: number;
  lazyFeatureModules: number;
  crudOperations: number;
  routes: string[];
  architecture: string[];
  tooling: {
    unit: string;
    lint: string;
    e2e: string;
  };
}

export interface AngularAnalysisFinding {
  id: string;
  category:
    | "ARCHITECTURE"
    | "ROUTING"
    | "FORMS"
    | "HTTP"
    | "DEPENDENCY"
    | "TOOLING"
    | "TESTING";
  severity: "INFO" | "WATCH" | "MIGRATION_REQUIRED";
  title: string;
  evidence: string;
  impact: string;
}

export interface AngularAnalysisModel {
  revision: number;
  status: "WAITING" | "READY_FOR_REVIEW" | "APPROVED";
  facts: string[];
  risks: string[];
  unknowns: string[];
  reviewerVerdict: "WAITING" | "ACCEPT";
  summary: string;
  confidence: "WAITING" | "HIGH";
  proposer: AngularLlmProvenance;
  reviewer: AngularLlmProvenance;
  applicationProfile?: AngularApplicationProfile;
  findings: AngularAnalysisFinding[];
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
  proposer: AngularLlmProvenance;
  reviewer: AngularLlmProvenance;
}

export type AngularStageGateId = "G07" | "G09" | "G10" | "G11" | "G12";
export type AngularStageGateStatus = "LOCKED" | "PENDING" | "APPROVED" | "REJECTED";
export type AngularStageGateDecision = "APPROVE" | "REQUEST_MODIFICATION" | "REJECT";

export interface AngularStageGateState {
  id: AngularStageGateId;
  label: string;
  status: AngularStageGateStatus;
  checksum: string;
  decisions: {
    id: string;
    decision: AngularStageGateDecision;
    timestamp: string;
    checksum: string;
    comment?: string;
  }[];
}

export type AngularProvenGroupId =
  | "SOURCE_PROOF"
  | "DISCOVERY"
  | "DEPENDENCY_RESOLUTION"
  | "MIGRATION"
  | "TARGET_PROOF"
  | "VALIDATION";

export interface AngularProvenTechnicalStep {
  id: string;
  label: string;
  status: "PENDING" | "PASS" | "FAILED";
}

export interface AngularProvenGroup {
  id: AngularProvenGroupId;
  label: string;
  status: "PENDING" | "RUNNING" | "PASS" | "FAILED";
  steps: AngularProvenTechnicalStep[];
}

export interface AngularRepairAttempt {
  id: string;
  attempt: number;
  status:
    | "REJECTED_BY_CAUSAL_POLICY"
    | "REVIEWER_REQUESTED_CHANGES"
    | "READY_FOR_G10"
    | "APPLIED"
    | "VALIDATED";
  failureCategory: string;
  proposalKind: "DEPENDENCY_MUTATION" | "SOURCE_PATCH";
  rationale: string;
  changedFiles: string[];
  diff: string;
  reviewerVerdict: "NOT_REVIEWED" | "REQUEST_CHANGES" | "ACCEPT";
  causalResult: "PASS" | "REPAIR_CAUSAL_KIND_MISMATCH";
  risk: "LOW" | "MEDIUM" | "HIGH";
}

export interface AngularStageExecution {
  stageId: string;
  source: AngularMajor;
  target: AngularMajor;
  status: "WAITING_G07" | "EXECUTING" | "ACTION_REQUIRED" | "WAITING_COMPLETION" | "SEALED";
  runtime: {
    profile: string;
    resolution: "PASS";
    certification: "CERTIFIED";
    dependencyPreflight: "PASS";
  };
  gates: Record<AngularStageGateId, AngularStageGateState>;
  groups: AngularProvenGroup[];
  validation: "PENDING" | "PASS" | "FAILED";
  repairAttempts: AngularRepairAttempt[];
  candidatePromotion: "PENDING" | "PASS";
  seal: "PENDING" | "SEALED";
}

export interface AngularRunEvidence {
  id: string;
  category:
    | "DECISION"
    | "BASELINE"
    | "ANALYSIS"
    | "FEASIBILITY"
    | "PLANNING"
    | "SOURCE"
    | "STAGE"
    | "FAILURE"
    | "REPAIR"
    | "VALIDATION"
    | "SEAL"
    | "COMMAND";
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
  | "TRANSFORMATION"
  | "REPAIR"
  | "COMPLETE"
  | "BLOCKED";


export interface AngularCommandRecord {
  id: string;
  action: "BASELINE_INSTALL" | "BASELINE_BUILD" | "BASELINE_TEST" | "ROLLBACK" | "RESUME" | "PARTIAL_DELIVERY" | "RESTART";
  command: string;
  authorization: "GOVERNED";
  status: "SUCCEEDED" | "FAILED";
  exitCode: number;
  logs: string[];
  timestamp: string;
  checksum: string;
}

export interface AngularPartialDelivery {
  id: string;
  stageId: string;
  source: AngularMajor;
  target: AngularMajor;
  artifactPath: string;
  timestamp: string;
  checksum: string;
}

export interface AngularRollbackRecord {
  id: string;
  fromStageId: string | null;
  toStageId: string;
  timestamp: string;
  reason: string;
  checksum: string;
}

export interface AngularOperations {
  commands: AngularCommandRecord[];
  partialDeliveries: AngularPartialDelivery[];
  rollbacks: AngularRollbackRecord[];
  stageHistory: AngularStageExecution[];
}

export interface AngularRunModel extends AngularRunSeed {
  phase: AngularRunPhase;
  gates: Record<AngularPreTransformGateId, AngularGateState>;
  baseline: AngularBaselineModel;
  analysis: AngularAnalysisModel;
  feasibility: AngularFeasibilityModel;
  planning: AngularPlanningRevision[];
  evidence: AngularRunEvidence[];
  diagnostics: string[];
  operations: AngularOperations;
  stageExecution?: AngularStageExecution;
  liveExecution?: AngularLiveExecution;
}
