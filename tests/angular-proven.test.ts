import assert from "node:assert/strict";
import test from "node:test";

import {
  applyG01Decision,
  createRunFromApprovedPreflight,
  prepareAngularPreflight,
} from "../src/stacks/angular/workflow/setup.ts";
import {
  applyAngularGateDecision,
  createAngularRunModel,
} from "../src/stacks/angular/workflow/run.ts";
import {
  applyAngularStageGateDecision,
} from "../src/stacks/angular/workflow/proven.ts";
import {
  advanceAngularLiveExecution,
  angularLiveExecutionDuration,
} from "../src/stacks/angular/workflow/live.ts";

function finishLive(run: ReturnType<typeof governedRun>) {
  assert.ok(run.liveExecution);
  return advanceAngularLiveExecution(
    run,
    run.liveExecution.startedAtMs +
      angularLiveExecutionDuration(run.liveExecution) +
      1,
  );
}

function finishIfLive(run: ReturnType<typeof governedRun>) {
  return run.liveExecution ? finishLive(run) : run;
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

test("legacy stage facade binds certified runtime before G07", () => {
  const run = governedRun();
  assert.equal(run.currentGate, "G07");
  assert.equal(run.stageExecution?.runtime.certification, "CERTIFIED");
  assert.equal(run.stageExecution?.groups.length, 6);
});

test("clean 11 to 12 legacy facade validates then seals", () => {
  let run = governedRun();
  run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));

  assert.equal(run.stageExecution?.validation, "PASS");
  assert.equal(run.currentGate, "G12");
  assert.deepEqual(run.stageExecution?.repairAttempts, []);

  run = finishIfLive(applyAngularStageGateDecision(run, "G12", "APPROVE"));
  assert.equal(run.route[0]?.status, "SEALED");
  assert.equal(run.operations.stageHistory.length, 1);
  assert.equal(run.operations.stageHistory[0]?.seal, "SEALED");
  assert.equal(run.stageExecution?.source, 12);
  assert.equal(run.stageExecution?.target, 13);
  assert.equal(run.currentGate, "G07");
});

test("13 to 14 is a clean presentation stage, not a fabricated repair", () => {
  let run = governedRun();
  for (let index = 0; index < 2; index += 1) {
    run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));
    run = finishIfLive(applyAngularStageGateDecision(run, "G12", "APPROVE"));
  }

  run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));

  assert.equal(run.stageExecution?.source, 13);
  assert.equal(run.stageExecution?.target, 14);
  assert.equal(run.currentGate, "G12");
  assert.equal(run.stageExecution?.validation, "PASS");
  assert.deepEqual(run.stageExecution?.repairAttempts, []);
});

test("all four adjacent stages can complete without continuing beyond Angular 15", () => {
  let run = governedRun();

  for (let stageIndex = 0; stageIndex < 4; stageIndex += 1) {
    run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));
    assert.equal(run.currentGate, "G12");
    run = finishIfLive(applyAngularStageGateDecision(run, "G12", "APPROVE"));
  }

  assert.equal(run.state, "COMPLETED");
  assert.equal(run.phase, "COMPLETE");
  assert.equal(run.currentGate, null);
  assert.ok(run.route.every((stage) => stage.status === "SEALED"));
});
