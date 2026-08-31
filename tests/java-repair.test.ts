import assert from "node:assert/strict";
import test from "node:test";

import { createJavaJob, prepareJavaMigration } from "../src/stacks/java/workflow/setup.ts";
import {
  advanceJavaPipeline,
  applyJavaGateDecision,
  createJavaJobModel,
} from "../src/stacks/java/workflow/cockpit.ts";
import {
  applyJavaRepairDecision,
  enterJavaRepair,
} from "../src/stacks/java/workflow/repair.ts";
import {
  confirmJavaGatePreview,
  previewJavaGateAction,
  answerJavaRepairAssistant,
} from "../src/stacks/java/workflow/assistant.ts";
import { cancelJavaMigration } from "../src/stacks/java/workflow/cancellation.ts";

function job() {
  const configuration = prepareJavaMigration({
    name: "Order Service",
    sourcePath: "/workspace/order-service",
    outputParent: "/workspace/out",
    environmentImport: "Development baseline",
    sourceProfile: "SB_2_1_J11",
    targetProfile: "SB_4_0_J21",
    continuationPolicy: "AUTO_ON_GREEN",
    proofLevel: "STRICT",
  });
  return createJavaJobModel(createJavaJob(configuration));
}

function advanceReviewedStage(model: ReturnType<typeof job>) {
  let current = model;
  current = advanceJavaPipeline(current);
  current = advanceJavaPipeline(current);
  current = advanceJavaPipeline(current);
  current = applyJavaGateDecision(current, "analysis_review", "CONTINUE");
  current = advanceJavaPipeline(current);
  current = applyJavaGateDecision(current, "planning_review", "CONTINUE");
  current = advanceJavaPipeline(current);
  current = applyJavaGateDecision(current, "approval_review", "APPROVE");
  current = advanceJavaPipeline(current);
  current = advanceJavaPipeline(current);
  current = advanceJavaPipeline(current);
  return current;
}

function repairJob() {
  const stage2 = advanceReviewedStage(job());
  assert.equal(stage2.currentStage, 2);

  let current = stage2;
  current = advanceJavaPipeline(current);
  current = advanceJavaPipeline(current);
  current = advanceJavaPipeline(current);
  current = applyJavaGateDecision(current, "analysis_review", "CONTINUE");
  current = advanceJavaPipeline(current);
  current = applyJavaGateDecision(current, "planning_review", "CONTINUE");
  current = advanceJavaPipeline(current);
  current = applyJavaGateDecision(current, "approval_review", "APPROVE");
  current = advanceJavaPipeline(current);
  current = advanceJavaPipeline(current);
  current = advanceJavaPipeline(current);
  return current;
}

test("Java Stage 2 failed validation enters reviewed repair_review", () => {
  const model = repairJob();

  assert.equal(model.currentStage, 2);
  assert.equal(model.currentPhase, "REPAIR_FAILURE");
  assert.equal(model.currentGate, "repair_review");
  assert.equal(model.repair.attempts.length, 1);
  assert.equal(model.repair.attempts[0]?.status, "REVIEWED");
  assert.equal(model.repair.attempts[0]?.reviewerVerdict, "ACCEPT");
  assert.equal(
    model.pipeline.find((phase) => phase.id === "TEST_VALIDATION")?.status,
    "FAILED",
  );
});

test("approved Java repair returns to validation and only progresses after a green rerun", () => {
  let model = repairJob();
  model = applyJavaRepairDecision(model, "CONTINUE");

  assert.equal(model.currentGate, null);
  assert.equal(model.currentPhase, "TEST_VALIDATION");
  assert.equal(model.repair.attempts[0]?.status, "APPLIED");

  model = advanceJavaPipeline(model);

  assert.equal(model.repair.attempts[0]?.status, "VALIDATED");
  assert.equal(model.currentStage, 3);
  assert.equal(model.currentPhase, "PREFLIGHT");
});

test("repair revisions preserve history and stop after the third governed attempt", () => {
  let model = repairJob();

  model = applyJavaRepairDecision(model, "REVISE");
  assert.equal(model.repair.attempts.length, 2);
  assert.equal(model.repair.attempts[0]?.status, "SUPERSEDED");
  assert.equal(model.currentGate, "repair_review");

  model = applyJavaRepairDecision(model, "REANALYZE");
  assert.equal(model.repair.attempts.length, 3);
  assert.equal(model.repair.attempts[1]?.status, "SUPERSEDED");
  assert.equal(model.currentGate, "repair_review");

  model = applyJavaRepairDecision(model, "REVISE");
  assert.equal(model.repair.attempts.length, 3);
  assert.equal(model.currentGate, null);
  assert.match(model.currentAction, /Maximum governed repair attempts/);
});

test("Gate Assistant preview is bound to gate checksum and revision", () => {
  let model = job();
  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);

  const preview = previewJavaGateAction(model, "CONTINUE");
  assert.equal(confirmJavaGatePreview(model, preview).actionChecksum, preview.actionChecksum);

  const changed = {
    ...model,
    phaseGates: model.phaseGates.map((gate, index, all) =>
      index === all.length - 1
        ? {
            ...gate,
            revision: gate.revision + 1,
            checksum: gate.checksum.replace(/^./, gate.checksum[0] === "a" ? "b" : "a"),
          }
        : gate,
    ),
  };

  assert.throws(
    () => confirmJavaGatePreview(changed, preview),
    /stale/,
  );
});

test("Repair Assistant answers from current attempt and attempt limit", () => {
  const model = repairJob();
  assert.match(answerJavaRepairAssistant(model, "What is happening?"), /attempt 1/i);
  assert.match(answerJavaRepairAssistant(model, "attempt limit"), /1 of 3/i);
});

test("cancellation stops active Java work through the Cancellation phase", () => {
  let model = job();
  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);
  const cancelled = cancelJavaMigration(model);

  assert.equal(cancelled.status, "CANCELLED");
  assert.equal(cancelled.currentGate, null);
  assert.equal(cancelled.currentPhase, "CANCELLATION");
  assert.equal(cancelled.cancellationRequested, true);
  assert.equal(
    cancelled.pipeline.find((phase) => phase.id === "CANCELLATION")?.status,
    "PASS",
  );
  assert.equal(cancelled.evidence.at(-1)?.category, "CANCELLATION");
});


test("repair attempt limit is scoped to each Java route stage", () => {
  let model = repairJob();
  model = applyJavaRepairDecision(model, "CONTINUE");
  model = advanceJavaPipeline(model);

  assert.equal(model.currentStage, 3);
  assert.equal(model.repair.attempts[0]?.stage, 2);
  assert.equal(model.repair.attempts[0]?.status, "VALIDATED");

  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);
  model = applyJavaGateDecision(model, "analysis_review", "CONTINUE");
  model = advanceJavaPipeline(model);
  model = applyJavaGateDecision(model, "planning_review", "CONTINUE");
  model = advanceJavaPipeline(model);
  model = applyJavaGateDecision(model, "approval_review", "APPROVE");
  model = advanceJavaPipeline(model);
  model = advanceJavaPipeline(model);

  assert.equal(model.currentPhase, "TEST_VALIDATION");
  assert.equal(model.currentGate, null);

  model = enterJavaRepair(model);
  assert.equal(model.currentStage, 3);
  assert.equal(model.currentGate, "repair_review");
  assert.equal(model.repair.attempts.length, 2);
  assert.equal(model.repair.attempts[1]?.stage, 3);
  assert.equal(model.repair.attempts[1]?.attempt, 1);
});

test("repair cannot be entered outside failed test validation", () => {
  assert.throws(
    () => enterJavaRepair(job()),
    /only from failed test validation/,
  );
});
