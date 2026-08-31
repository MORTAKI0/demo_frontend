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
  status: "PENDING" | "RUNNING" | "PASS" | "ACTION_REQUIRED" | "SKIPPED";
  detail: string;
}

export interface JavaAnalysisRevision {
  revision: number;
  sourceProfile: JavaProfileId;
  status: "READY_FOR_REVIEW" | "SUPERSEDED" | "ACCEPTED";
  facts: string[];
  risks: string[];
  checksum: string;
}

export interface JavaPlanningRevision {
  revision: number;
  status: "READY_FOR_REVIEW" | "SUPERSEDED" | "ACCEPTED";
  summary: string;
  checksum: string;
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
    | "STAGE";
  title: string;
  summary: string;
  timestamp: string;
  checksum: string;
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
  terminalStage4: {
    active: boolean;
    acceptedOutputRevision: number | null;
  };
}
