import type { LiveExecution } from "../../../domain/live-execution.ts";
import type {
  JavaJobSeed,
  JavaProfileId,
  JavaRouteStage,
} from "./types.ts";

export const JAVA_PHASE_GATE_TYPES = [
  "analysis_review",
  "planning_review",
  "approval_review",
  "repair_review",
  "stage_completion_review",
] as const;

export type JavaPhaseGateType = (typeof JAVA_PHASE_GATE_TYPES)[number];

export type JavaGateDecision =
  | "CONTINUE"
  | "REANALYZE"
  | "OVERRIDE_SOURCE_PROFILE"
  | "REVISE"
  | "APPROVE"
  | "REJECT";

export interface JavaGateDecisionRecord {
  id: string;
  decision: JavaGateDecision;
  timestamp: string;
  checksum: string;
  comment?: string;
}

export interface JavaPhaseGate {
  id: string;
  type: JavaPhaseGateType;
  stage: 1 | 2 | 3;
  status: "PENDING" | "APPROVED" | "REJECTED";
  revision: number;
  checksum: string;
  decisions: JavaGateDecisionRecord[];
}

export const JAVA_PIPELINE_PHASES = [
  "PREFLIGHT",
  "CANCELLATION",
  "ANALYSIS_AGENT",
  "PLANNING_AGENT",
  "ASSESSMENT_AGENT",
  "HUMAN_APPROVAL",
  "TRANSFORM_AGENT",
  "BUILD_AGENT",
  "TEST_VALIDATION",
  "REPAIR_FAILURE",
  "RESULT_CONTRACT",
  "FINAL_REPORT",
  "STAGE_REPORT",
] as const;

export type JavaPipelinePhaseId = (typeof JAVA_PIPELINE_PHASES)[number];

export interface JavaPipelinePhase {
  id: JavaPipelinePhaseId;
  label: string;
  status: "PENDING" | "RUNNING" | "PASS" | "FAILED" | "ACTION_REQUIRED" | "SKIPPED";
  detail: string;
}

export interface JavaLlmProvenance {
  provider: "azure_openai" | "azure_foundry";
  deployment: "gpt-5-mini" | "Llama-3.3-70B-Instruct";
  role: "phase_proposer" | "phase_reviewer";
  status: "SUCCEEDED";
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
}

export type JavaLiveExecutionKind =
  | "PREFLIGHT"
  | "CANCELLATION"
  | "ANALYSIS_AGENT"
  | "PLANNING_AGENT"
  | "ASSESSMENT_AGENT"
  | "TRANSFORM_AGENT"
  | "BUILD_AGENT"
  | "TEST_VALIDATION";

export type JavaLiveExecution = LiveExecution<JavaLiveExecutionKind>;

export interface JavaAnalysisRevision {
  revision: number;
  sourceProfile: JavaProfileId;
  status: "READY_FOR_REVIEW" | "SUPERSEDED" | "ACCEPTED";
  facts: string[];
  risks: string[];
  checksum: string;
  summary: string;
  proposer: JavaLlmProvenance;
  reviewer: JavaLlmProvenance;
}

export interface JavaPlanningRevision {
  revision: number;
  status: "READY_FOR_REVIEW" | "SUPERSEDED" | "ACCEPTED";
  summary: string;
  checksum: string;
  proposer: JavaLlmProvenance;
  reviewer: JavaLlmProvenance;
  routePlan: string[];
  executionUnits: string[];
  validationTargets: string[];
  constraints: string[];
  rationale: string[];
  reviewerNotes: string[];
}

export interface JavaAssessmentProjection {
  status: "WAITING" | "PASS";
  summary: string;
}

export interface JavaStageResult {
  stage: 1 | 2 | 3 | 4;
  status: "PASS" | "WARNING" | "FAILED";
  build: "PASS" | "FAILED";
  tests: "PASS" | "FAILED";
  completedAt: string;
}

export interface JavaEvidenceRecord {
  id: string;
  category:
    | "CONFIGURATION"
    | "ANALYSIS"
    | "PLANNING"
    | "ASSESSMENT"
    | "DECISION"
    | "TRANSFORM"
    | "BUILD"
    | "TEST"
    | "STAGE"
    | "FAILURE"
    | "REPAIR"
    | "CANCELLATION";
  title: string;
  summary: string;
  timestamp: string;
  checksum: string;
}


export interface JavaRepairAttempt {
  id: string;
  stage: 1 | 2 | 3;
  attempt: number;
  status:
    | "REVIEWED"
    | "SUPERSEDED"
    | "APPLIED"
    | "VALIDATED"
    | "REJECTED";
  failureKind: "BUILD_OR_TEST_FAILURE";
  diagnosis: string;
  proposerSummary: string;
  reviewerVerdict: "ACCEPT" | "REQUEST_CHANGES";
  changedFiles: string[];
  diff: string;
  checksum: string;
  createdAt: string;
}

export interface JavaRepairState {
  attempts: JavaRepairAttempt[];
  maxAttempts: 3;
}

export interface JavaGateAssistantPreview {
  gateId: string;
  gateType: JavaPhaseGateType;
  gateRevision: number;
  gateChecksum: string;
  decision: JavaGateDecision;
  comment?: string;
  overrideSourceProfile?: JavaProfileId;
  actionChecksum: string;
}


export interface JavaTargetVersionRow {
  groupId: string;
  artifactId: string;
  targetVersion: string;
}

export interface JavaPomVersionChange {
  groupId: string;
  artifactId: string;
  currentVersion: string;
  targetVersion: string;
}

export interface JavaTargetVersionRepairAttempt {
  id: string;
  attempt: number;
  status: "READY_FOR_APPLY" | "APPLIED" | "VALIDATED" | "SUPERSEDED";
  diagnosis: string;
  diff: string;
  checksum: string;
  createdAt: string;
}

export interface JavaTargetVersionState {
  rows: JavaTargetVersionRow[];
  changes: JavaPomVersionChange[];
  status:
    | "EMPTY"
    | "PROPOSED"
    | "APPLIED"
    | "PASS"
    | "FAILED"
    | "REPAIR_READY";
  diff: string;
  repairAttempts: JavaTargetVersionRepairAttempt[];
}

export interface JavaStage4OutputRevision {
  revision: number;
  status: "READY_FOR_REVIEW" | "ACCEPTED";
  summary: string;
  checksum: string;
  createdAt: string;
}

export interface JavaReportArtifact {
  id: string;
  label: string;
  mediaType: "text/markdown" | "application/json" | "text/csv";
  content: string;
}

export interface JavaFinalReportState {
  status: "BLOCKED" | "ELIGIBLE" | "GENERATED";
  generatedAt?: string;
  artifacts: JavaReportArtifact[];
}

export interface JavaJobModel extends JavaJobSeed {
  route: JavaRouteStage[];
  pipeline: JavaPipelinePhase[];
  phaseGates: JavaPhaseGate[];
  currentGate: JavaPhaseGateType | null;
  analysis: JavaAnalysisRevision[];
  planning: JavaPlanningRevision[];
  assessment: JavaAssessmentProjection;
  stageResults: JavaStageResult[];
  evidence: JavaEvidenceRecord[];
  cancellationRequested: boolean;
  repair: JavaRepairState;
  terminalStage4: {
    active: boolean;
    acceptedOutputRevision: number | null;
    outputRevisions: JavaStage4OutputRevision[];
    targetVersions: JavaTargetVersionState;
    validation: "PENDING" | "PASS" | "FAILED";
  };
  finalReport: JavaFinalReportState;
  liveExecution?: JavaLiveExecution;
}
