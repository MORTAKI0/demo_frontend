export const JAVA_PROFILE_IDS = [
  "SB_2_1_J11",
  "SB_2_7_J11",
  "SB_3_5_J17",
  "SB_3_5_J21",
  "SB_4_0_J21",
] as const;

export type JavaProfileId = (typeof JAVA_PROFILE_IDS)[number];

export interface JavaMigrationProfile {
  id: JavaProfileId;
  label: string;
  springBoot: string;
  java: 11 | 17 | 21;
}

export const JAVA_PROFILES: JavaMigrationProfile[] = [
  { id: "SB_2_1_J11", label: "Spring Boot 2.1 / Java 11", springBoot: "2.1", java: 11 },
  { id: "SB_2_7_J11", label: "Spring Boot 2.7 / Java 11", springBoot: "2.7", java: 11 },
  { id: "SB_3_5_J17", label: "Spring Boot 3.5 / Java 17", springBoot: "3.5", java: 17 },
  { id: "SB_3_5_J21", label: "Spring Boot 3.5 / Java 21", springBoot: "3.5", java: 21 },
  { id: "SB_4_0_J21", label: "Spring Boot 4.0 / Java 21", springBoot: "4.0", java: 21 },
];

export type JavaRouteDisposition = "INCLUDED" | "SKIPPED" | "EXCLUDED";

export interface JavaRouteStage {
  stage: 1 | 2 | 3 | 4;
  source: JavaProfileId;
  target: JavaProfileId;
  label: string;
  terminal: boolean;
  disposition: JavaRouteDisposition;
}

export type JavaContinuationPolicy =
  | "AUTO_ON_GREEN"
  | "MANUAL"
  | "MANUAL_ON_WARNING_OR_FAILURE";

export type JavaProofLevel = "STANDARD" | "STRICT";
export type JavaPreTransformApprovalMode = "HUMAN_REQUIRED";

export interface JavaEnvironmentCheck {
  id: string;
  label: string;
  value: string;
  status: "READY" | "WARNING" | "BLOCKED";
}

export interface JavaMigrationConfiguration {
  id: string;
  name: string;
  sourcePath: string;
  outputParent: string;
  environmentImport: string;
  sourceProfile: JavaProfileId;
  targetProfile: JavaProfileId;
  route: JavaRouteStage[];
  continuationPolicy: JavaContinuationPolicy;
  proofLevel: JavaProofLevel;
  preTransformApproval: JavaPreTransformApprovalMode;
  maxRepairAttempts: 3;
  environment: JavaEnvironmentCheck[];
  readiness: "READY" | "BLOCKED";
  blockers: string[];
  createdAt: string;
}

export interface JavaJobSeed {
  id: string;
  name: string;
  configuration: JavaMigrationConfiguration;
  status: "READY" | "RUNNING" | "ACTION_REQUIRED" | "COMPLETED" | "CANCELLED";
  currentStage: 1 | 2 | 3 | 4 | null;
  currentPhase: string;
  currentAction: string;
  createdAt: string;
}

export interface JavaPresentationState {
  jobs: Record<string, JavaJobSeed>;
}
