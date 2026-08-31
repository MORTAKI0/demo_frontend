import assert from "node:assert/strict";
import test from "node:test";

import { createJavaJob, prepareJavaMigration } from "../src/stacks/java/workflow/setup.ts";
import {
  advanceJavaPipeline,
  applyJavaGateDecision,
  createJavaJobModel,
  createJavaPhaseGate,
  getJavaGateDecisions,
} from "../src/stacks/java/workflow/cockpit.ts";
import {
  JAVA_PHASE_GATE_TYPES,
  JAVA_PIPELINE_PHASES,
} from "../src/stacks/java/domain/run-types.ts";
import type { JavaContinuationPolicy } from "../src/stacks/java/domain/types.ts";

function job(policy: JavaContinuationPolicy = "MANUAL") {
  const configuration = prepareJavaMigration({
    name: "Order Service",
    sourcePath: "/workspace/order-service",
    outputParent: "/workspace/out",
    environmentImport: "Development baseline",
    sourceProfile: "SB_2_1_J11",
    targetProfile: "SB_4_0_J21",
    continuationPolicy: policy,
    proofLevel: "STRICT",
  });
  return createJavaJobModel(createJavaJob(configuration));
}

function reachAnalysisGate(policy: JavaContinuationPolicy = "MANUAL") {
  let model = job(policy);
  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);
  return model;
}

function reachPlanningGate(policy: JavaContinuationPolicy = "MANUAL") {
  let model = reachAnalysisGate(policy);
  model = applyJavaGateDecision(model, "analysis_review", "CONTINUE");
  model = advanceJavaPipeline(model);
  return model;
}

function reachApprovalGate(policy: JavaContinuationPolicy = "MANUAL") {
  let model = reachPlanningGate(policy);
  model = applyJavaGateDecision(model, "planning_review", "CONTINUE");
  model = advanceJavaPipeline(model);
  return model;
}

function reachGreenCompletion(policy: JavaContinuationPolicy) {
  let model = reachApprovalGate(policy);
  model = applyJavaGateDecision(model, "approval_review", "APPROVE");
  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);
  return model;
}

test("Java exposes exactly five PhaseGate types and no assessment_review", () => {
  assert.deepEqual(JAVA_PHASE_GATE_TYPES, [
    "analysis_review",
    "planning_review",
    "approval_review",
    "repair_review",
    "stage_completion_review",
  ]);
  assert.equal(JAVA_PHASE_GATE_TYPES.includes("assessment_review" as never), false);
});

test("Java route stages and execution phases are separate dimensions", () => {
  const model = job();
  assert.equal(model.route.length, 4);
  assert.equal(JAVA_PIPELINE_PHASES.length, 13);
  assert.equal(model.pipeline[0]?.id, "PREFLIGHT");
  assert.equal(model.route[0]?.stage, 1);
});

test("Java gate decisions match the original gate-specific sets", () => {
  assert.deepEqual(getJavaGateDecisions("analysis_review"), [
    "CONTINUE",
    "REANALYZE",
    "OVERRIDE_SOURCE_PROFILE",
  ]);
  assert.deepEqual(getJavaGateDecisions("planning_review"), [
    "CONTINUE",
    "REVISE",
  ]);
  assert.deepEqual(getJavaGateDecisions("approval_review"), [
    "APPROVE",
    "REJECT",
  ]);
  assert.deepEqual(getJavaGateDecisions("repair_review"), [
    "CONTINUE",
    "REANALYZE",
    "REVISE",
    "REJECT",
  ]);
  assert.deepEqual(getJavaGateDecisions("stage_completion_review"), ["CONTINUE"]);
});

test("Assessment Agent flows directly to approval_review without an assessment gate", () => {
  const model = reachApprovalGate();
  assert.equal(model.assessment.status, "PASS");
  assert.equal(model.currentGate, "approval_review");
  assert.equal(
    model.phaseGates.some((gate) => (gate.type as string) === "assessment_review"),
    false,
  );
});

test("analysis source-profile override creates a new route authority before reanalysis", () => {
  let model = reachAnalysisGate();
  model = applyJavaGateDecision(
    model,
    "analysis_review",
    "OVERRIDE_SOURCE_PROFILE",
    { overrideSourceProfile: "SB_2_7_J11" },
  );

  assert.equal(model.configuration.sourceProfile, "SB_2_7_J11");
  assert.equal(model.route[0]?.disposition, "SKIPPED");
  assert.equal(model.currentStage, 2);
  assert.equal(model.currentPhase, "ANALYSIS_AGENT");
  assert.equal(model.analysis[0]?.status, "SUPERSEDED");

  model = advanceJavaPipeline(model);
  assert.equal(model.currentGate, "analysis_review");
  assert.equal(model.analysis.length, 2);
});

test("planning revise supersedes old revision and produces a new review revision", () => {
  let model = reachPlanningGate();
  model = applyJavaGateDecision(model, "planning_review", "REVISE");

  assert.equal(model.currentGate, null);
  assert.equal(model.currentPhase, "PLANNING_AGENT");
  assert.equal(model.planning[0]?.status, "SUPERSEDED");

  model = advanceJavaPipeline(model);
  assert.equal(model.currentGate, "planning_review");
  assert.equal(model.planning.length, 2);
  assert.equal(model.planning[1]?.status, "READY_FOR_REVIEW");
});

test("manual continuation opens stage_completion_review while auto-on-green advances", () => {
  const manual = reachGreenCompletion("MANUAL");
  const automatic = reachGreenCompletion("AUTO_ON_GREEN");

  assert.equal(manual.currentGate, "stage_completion_review");
  assert.equal(manual.currentStage, 1);

  assert.equal(automatic.currentGate, null);
  assert.equal(automatic.currentStage, 2);
  assert.equal(automatic.currentPhase, "PREFLIGHT");
});

test("Java Stage 4 cannot own a normal PhaseGate", () => {
  const base = job();
  const terminal = {
    ...base,
    currentStage: 4 as const,
    currentPhase: "TERMINAL_STAGE_4",
    terminalStage4: {
      ...base.terminalStage4,
      active: true,
    },
  };

  assert.throws(
    () => createJavaPhaseGate(terminal, "analysis_review"),
    /terminal-special/,
  );
});
