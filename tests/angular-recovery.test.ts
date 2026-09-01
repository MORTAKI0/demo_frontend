import assert from "node:assert/strict";
import test from "node:test";

import { applyG01Decision, createRunFromApprovedPreflight, prepareAngularPreflight } from "../src/stacks/angular/workflow/setup.ts";
import { applyAngularGateDecision, createAngularRunModel } from "../src/stacks/angular/workflow/run.ts";
import { applyAngularStageGateDecision } from "../src/stacks/angular/workflow/proven.ts";
import {
  advanceAngularLiveExecution,
  angularLiveExecutionDuration,
} from "../src/stacks/angular/workflow/live.ts";
import {
  createAngularPartialDelivery,
  furthestSealedStage,
  resumeAngularFromSealed,
  rollbackAngularToFurthestSealed,
} from "../src/stacks/angular/workflow/recovery.ts";
import { answerAngularAssistant } from "../src/stacks/angular/workflow/assistant.ts";

function finishLive(run: ReturnType<typeof governedRun>) {
  assert.ok(run.liveExecution);
  return advanceAngularLiveExecution(
    run,
    run.liveExecution.startedAtMs +
      angularLiveExecutionDuration(run.liveExecution) +
      1,
  );
}

function governedRun() {
  const preflight = prepareAngularPreflight({
    runName: "Customer Portal",
    sourcePath: "/workspace/source",
    outputParent: "/workspace/out",
    sourceMajor: 11,
    targetMajor: 15,
  });
  let run = createAngularRunModel(
    createRunFromApprovedPreflight(applyG01Decision(preflight, "APPROVE")),
  );
  for (const gate of ["G02", "G03", "G04", "G05", "G06"] as const) {
    run = finishLive(applyAngularGateDecision(run, gate, "APPROVE"));
  }
  return run;
}

function repairRun() {
  let run = governedRun();
  for (let index = 0; index < 2; index += 1) {
    run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));
    run = finishLive(applyAngularStageGateDecision(run, "G12", "APPROVE"));
  }
  return finishLive(
    applyAngularStageGateDecision(run, "G07", "APPROVE"),
  );
}

test("baseline command evidence preserves authorization, result, and logs", () => {
  const run = governedRun();
  assert.equal(run.operations.commands.length, 3);
  for (const command of run.operations.commands) {
    assert.equal(command.authorization, "GOVERNED");
    assert.equal(command.status, "SUCCEEDED");
    assert.equal(command.exitCode, 0);
    assert.ok(command.logs.length > 0);
    assert.equal(command.checksum.length, 64);
  }
});

test("partial delivery always selects the furthest sealed Angular stage", () => {
  const run = repairRun();
  const sealed = furthestSealedStage(run);
  assert.equal(sealed?.source, 12);
  assert.equal(sealed?.target, 13);

  const delivered = createAngularPartialDelivery(run);
  const artifact = delivered.operations.partialDeliveries.at(-1);

  assert.equal(artifact?.stageId, sealed?.id);
  assert.equal(artifact?.target, 13);
  assert.match(artifact?.artifactPath ?? "", /angular-13-sealed\.zip$/);
});

test("rollback preserves the active failed execution in history and returns to sealed authority", () => {
  const run = repairRun();
  assert.equal(run.currentGate, "G10");
  assert.equal(run.stageExecution?.source, 13);

  const rolledBack = rollbackAngularToFurthestSealed(run);

  assert.equal(rolledBack.stageExecution, undefined);
  assert.equal(rolledBack.route[0]?.status, "SEALED");
  assert.equal(rolledBack.route[1]?.status, "SEALED");
  assert.equal(rolledBack.route[2]?.status, "PENDING");
  assert.equal(rolledBack.operations.stageHistory.length, 3);
  assert.equal(rolledBack.operations.stageHistory[0]?.status, "SEALED");
  assert.equal(rolledBack.operations.stageHistory[1]?.status, "SEALED");
  assert.equal(rolledBack.operations.stageHistory[2]?.repairAttempts.length, 2);
  assert.equal(rolledBack.operations.stageHistory[2]?.source, 13);
  assert.equal(rolledBack.operations.stageHistory[2]?.target, 14);
  assert.equal(rolledBack.operations.rollbacks.at(-1)?.toStageId, "angular-12-to-13");
});

test("resume from sealed rematerializes the next adjacent stage at certified G07", () => {
  const rolledBack = rollbackAngularToFurthestSealed(repairRun());
  const resumed = resumeAngularFromSealed(rolledBack);

  assert.equal(resumed.stageExecution?.source, 13);
  assert.equal(resumed.stageExecution?.target, 14);
  assert.equal(resumed.stageExecution?.runtime.certification, "CERTIFIED");
  assert.equal(resumed.currentGate, "G07");
});

test("assistant status and repair answers are grounded in the current repair state", () => {
  const run = repairRun();
  const status = answerAngularAssistant(run, "What is happening?");
  const repair = answerAngularAssistant(run, "Explain the repair");

  assert.match(status, /repair/i);
  assert.match(status, /G10/);
  assert.match(repair, /REPAIR_CAUSAL_KIND_MISMATCH/);
  assert.match(repair, /attempt 2/i);
});
