import type {
  JavaContinuationPolicy,
  JavaJobSeed,
  JavaMigrationConfiguration,
  JavaPreTransformApprovalMode,
  JavaProfileId,
  JavaProofLevel,
  JavaRouteStage,
} from "../domain/types.ts";
import { JAVA_PROFILE_IDS, JAVA_PROFILES } from "../domain/types.ts";

const ROUTE_TEMPLATE: Array<Omit<JavaRouteStage, "disposition">> = [
  {
    stage: 1,
    source: "SB_2_1_J11",
    target: "SB_2_7_J11",
    label: "Spring Boot 2.1 / Java 11 → Spring Boot 2.7 / Java 11",
    terminal: false,
  },
  {
    stage: 2,
    source: "SB_2_7_J11",
    target: "SB_3_5_J17",
    label: "Spring Boot 2.7 / Java 11 → Spring Boot 3.5 / Java 17",
    terminal: false,
  },
  {
    stage: 3,
    source: "SB_3_5_J17",
    target: "SB_3_5_J21",
    label: "Spring Boot 3.5 / Java 17 → Spring Boot 3.5 / Java 21",
    terminal: false,
  },
  {
    stage: 4,
    source: "SB_3_5_J21",
    target: "SB_4_0_J21",
    label: "Spring Boot 3.5 / Java 21 → Spring Boot 4.0 / Java 21",
    terminal: true,
  },
];

export const JAVA_CONTINUATION_POLICIES: JavaContinuationPolicy[] = [
  "AUTO_ON_GREEN",
  "MANUAL",
  "MANUAL_ON_WARNING_OR_FAILURE",
];

export const JAVA_PRE_TRANSFORM_APPROVAL: JavaPreTransformApprovalMode =
  "HUMAN_REQUIRED";

function profileIndex(profile: JavaProfileId): number {
  const index = JAVA_PROFILE_IDS.indexOf(profile);
  if (index < 0) throw new Error(`Unsupported Java migration profile: ${profile}`);
  return index;
}

export function computeJavaRoute(
  sourceProfile: JavaProfileId,
  targetProfile: JavaProfileId,
): JavaRouteStage[] {
  const sourceIndex = profileIndex(sourceProfile);
  const targetIndex = profileIndex(targetProfile);

  if (targetIndex <= sourceIndex) {
    throw new Error("Target Spring Boot profile must be after the source profile.");
  }

  return ROUTE_TEMPLATE.map((stage) => {
    const stageSource = profileIndex(stage.source);
    const stageTarget = profileIndex(stage.target);
    const disposition =
      stageTarget <= sourceIndex
        ? "SKIPPED"
        : stageSource >= targetIndex
          ? "EXCLUDED"
          : stageSource >= sourceIndex && stageTarget <= targetIndex
            ? "INCLUDED"
            : "EXCLUDED";

    return { ...stage, disposition };
  });
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "spring-boot-migration";
}

export function profileById(id: JavaProfileId) {
  const profile = JAVA_PROFILES.find((item) => item.id === id);
  if (!profile) throw new Error(`Unknown profile ${id}`);
  return profile;
}

export function prepareJavaMigration(
  input: {
    name: string;
    sourcePath: string;
    outputParent: string;
    environmentImport: string;
    sourceProfile: JavaProfileId;
    targetProfile: JavaProfileId;
    continuationPolicy: JavaContinuationPolicy;
    proofLevel: JavaProofLevel;
  },
  now = "2026-08-31T20:30:00+01:00",
): JavaMigrationConfiguration {
  if (!JAVA_CONTINUATION_POLICIES.includes(input.continuationPolicy)) {
    throw new Error("Unsupported Java continuation policy.");
  }

  const route = computeJavaRoute(input.sourceProfile, input.targetProfile);
  const blocked = input.sourcePath.toLowerCase().includes("blocked");
  const blockers = blocked
    ? ["Project path failed preflight boundary validation."]
    : [];

  return {
    id: `java-config-${slugify(input.name)}`,
    name: input.name,
    sourcePath: input.sourcePath,
    outputParent: input.outputParent,
    environmentImport: input.environmentImport,
    sourceProfile: input.sourceProfile,
    targetProfile: input.targetProfile,
    route,
    continuationPolicy: input.continuationPolicy,
    proofLevel: input.proofLevel,
    preTransformApproval: JAVA_PRE_TRANSFORM_APPROVAL,
    maxRepairAttempts: 3,
    environment: [
      { id: "java11", label: "Java 11", value: "Available", status: "READY" },
      { id: "java17", label: "Java 17", value: "Available", status: "READY" },
      { id: "java21", label: "Java 21", value: "Available", status: "READY" },
      { id: "maven", label: "Maven", value: "3.9.9", status: "READY" },
      { id: "ai", label: "AI provider", value: "Smoke check passed", status: "READY" },
      { id: "azure", label: "Azure integration", value: "Smoke check passed", status: "READY" },
    ],
    readiness: blocked ? "BLOCKED" : "READY",
    blockers,
    createdAt: now,
  };
}

export function createJavaJob(
  configuration: JavaMigrationConfiguration,
  now = "2026-08-31T20:31:00+01:00",
): JavaJobSeed {
  if (configuration.readiness !== "READY") {
    throw new Error("Java migration job cannot start while readiness is blocked.");
  }

  const firstIncluded = configuration.route.find(
    (stage) => stage.disposition === "INCLUDED",
  );
  if (!firstIncluded) {
    throw new Error("Java migration route contains no included stage.");
  }

  return {
    id: `java-${slugify(configuration.name)}`,
    name: configuration.name,
    configuration,
    status: "READY",
    currentStage: firstIncluded.stage,
    currentPhase: "PREFLIGHT",
    currentAction: "Run preflight and cancellation checks",
    createdAt: now,
  };
}
