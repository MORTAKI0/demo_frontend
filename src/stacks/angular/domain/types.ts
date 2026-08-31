export const ANGULAR_MAJORS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as const;
export type AngularMajor = (typeof ANGULAR_MAJORS)[number];

export interface AngularRouteStep {
  id: string;
  source: AngularMajor;
  target: AngularMajor;
  status: "PENDING" | "RUNNING" | "SEALED" | "ACTION_REQUIRED";
}

export type AngularPreflightStatus = "PASSED" | "PASSED_WITH_WARNINGS" | "BLOCKED" | "EXPIRED" | "STALE";
export type AngularReviewStatus = "PENDING" | "APPROVED" | "MODIFICATION_REQUESTED" | "REJECTED" | "STALE";
export type AngularG01Decision = "APPROVE" | "APPROVE_WITH_COMMENT" | "REQUEST_MODIFICATION" | "REJECT";

export interface AngularEnvironmentCheck {
  id: string;
  label: string;
  value: string;
  status: "READY" | "WARNING" | "BLOCKED";
}

export interface AngularSourceAnalysis {
  detectedVersion: string;
  packageManager: "npm";
  workspace: string;
  projects: number;
  builder: string;
  lockfile: string;
  dependencyCount: number;
  thirdPartyPackages: number;
  confidence: "HIGH" | "MEDIUM";
}

export interface AngularEvidenceItem {
  id: string;
  category: "READINESS" | "SOURCE" | "DECISION";
  title: string;
  summary: string;
  checksum: string;
  timestamp: string;
}

export interface AngularDecisionRecord {
  id: string;
  gate: "G01";
  decision: AngularG01Decision;
  comment?: string;
  timestamp: string;
  checksum: string;
}

export interface AngularPreflight {
  id: string;
  runName: string;
  sourcePath: string;
  outputParent: string;
  sourceMajor: AngularMajor;
  targetMajor: AngularMajor;
  route: AngularRouteStep[];
  status: AngularPreflightStatus;
  reviewStatus: AngularReviewStatus;
  warnings: string[];
  blockers: string[];
  environment: AngularEnvironmentCheck[];
  sourceAnalysis: AngularSourceAnalysis;
  evidence: AngularEvidenceItem[];
  decisions: AngularDecisionRecord[];
  revision: number;
  checksum: string;
}

export interface AngularRunSeed {
  id: string;
  name: string;
  sourceMajor: AngularMajor;
  targetMajor: AngularMajor;
  route: AngularRouteStep[];
  state: "STAGE_CREATED" | "RUNNING" | "COMPLETED";
  currentGate: "G02" | null;
  currentAction: string;
  g01DecisionId: string;
  createdAt: string;
}

export interface AngularPresentationState {
  preflights: Record<string, AngularPreflight>;
  runs: Record<string, AngularRunSeed>;
}
