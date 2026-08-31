import type {
  JavaContinuationPolicy,
  JavaJobSeed,
} from "../domain/types.ts";
import type { JavaJobModel } from "../domain/run-types.ts";
import {
  advanceJavaPipeline,
  applyJavaGateDecision,
  createJavaJobModel,
} from "../workflow/cockpit.ts";
import { applyJavaRepairDecision } from "../workflow/repair.ts";
import {
  acceptJavaStage4Output,
  analyzeJavaTargetVersions,
  applyJavaTargetVersionProposal,
  createJavaStage4OutputRevision,
  generateJavaFinalReport,
} from "../workflow/terminal.ts";
import {
  createJavaJob,
  prepareJavaMigration,
} from "../workflow/setup.ts";

const TERMINAL_TARGETS = [
  "groupId,artifactId,targetVersion",
  "org.springframework.boot,spring-boot-dependencies,4.0.0",
  "org.junit.jupiter,junit-jupiter,6.0.0",
  "org.mockito,mockito-core,5.20.0",
].join("\n");

function seedConfiguration(
  name: string,
  continuationPolicy: JavaContinuationPolicy,
) {
  return prepareJavaMigration({
    name,
    sourcePath: "/workspace/" + name.toLowerCase().replaceAll(" ", "-"),
    outputParent: "/workspace/migration-output",
    environmentImport: "Development baseline",
    sourceProfile: "SB_2_1_J11",
    targetProfile: "SB_4_0_J21",
    continuationPolicy,
    proofLevel: "STRICT",
  });
}

function baseJob(
  id: string,
  name: string,
  continuationPolicy: JavaContinuationPolicy,
): JavaJobModel {
  const seed: JavaJobSeed = {
    ...createJavaJob(seedConfiguration(name, continuationPolicy)),
    id,
    status: "RUNNING",
  };
  return createJavaJobModel(seed);
}

function runToAnalysisGate(job: JavaJobModel): JavaJobModel {
  let current = advanceJavaPipeline(job);
  current = advanceJavaPipeline(current);
  return advanceJavaPipeline(current);
}

function runToTestValidation(job: JavaJobModel): JavaJobModel {
  let current = runToAnalysisGate(job);
  current = applyJavaGateDecision(
    current,
    "analysis_review",
    "CONTINUE",
  );
  current = advanceJavaPipeline(current);
  current = applyJavaGateDecision(
    current,
    "planning_review",
    "CONTINUE",
  );
  current = advanceJavaPipeline(current);
  current = applyJavaGateDecision(
    current,
    "approval_review",
    "APPROVE",
  );
  current = advanceJavaPipeline(current);
  return advanceJavaPipeline(current);
}

function completeCurrentGreenStage(job: JavaJobModel): JavaJobModel {
  return advanceJavaPipeline(runToTestValidation(job));
}

function seedJavaRepairScenario(): JavaJobModel {
  let job = baseJob(
    "java-repair-service",
    "Payments Service",
    "AUTO_ON_GREEN",
  );

  job = completeCurrentGreenStage(job);
  return advanceJavaPipeline(runToTestValidation(job));
}

function seedJavaTerminalScenario(): JavaJobModel {
  let job = seedJavaRepairScenario();
  job = applyJavaRepairDecision(job, "CONTINUE");
  job = advanceJavaPipeline(job);
  job = completeCurrentGreenStage(job);

  if (job.currentStage !== 4) {
    throw new Error("Terminal Java scenario did not reach Stage 4.");
  }

  job = analyzeJavaTargetVersions(job, TERMINAL_TARGETS);
  job = applyJavaTargetVersionProposal(job);
  job = createJavaStage4OutputRevision(job);
  job = acceptJavaStage4Output(job, 1);
  return generateJavaFinalReport(job);
}

export function seedJavaJob(id: string): JavaJobModel {
  if (id === "java-repair-service") {
    return seedJavaRepairScenario();
  }

  if (id === "java-terminal-service") {
    return seedJavaTerminalScenario();
  }

  if (id === "java-order-service") {
    return runToAnalysisGate(
      baseJob(
        id,
        "Order Service",
        "MANUAL_ON_WARNING_OR_FAILURE",
      ),
    );
  }

  return baseJob(
    id,
    "Payments Service",
    "MANUAL_ON_WARNING_OR_FAILURE",
  );
}
