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

function finishLive<T extends ReturnType<typeof createAngularRunModel>>(run: T) {
  assert.ok(run.liveExecution);
  return advanceAngularLiveExecution(
    run,
    run.liveExecution.startedAtMs +
      angularLiveExecutionDuration(run.liveExecution) +
      1,
  );
}

function repairRun20To21() {
  const preflight = prepareAngularPreflight({
    runName: "Angular 20 to 21 repair",
    sourcePath: "/workspace/source",
    outputParent: "/workspace/out",
    sourceMajor: 20,
    targetMajor: 21,
  });
  let run = createAngularRunModel(
    createRunFromApprovedPreflight(applyG01Decision(preflight, "APPROVE")),
  );
  for (const gate of ["G02", "G03", "G04", "G05", "G06"] as const) {
    run = finishLive(applyAngularGateDecision(run, gate, "APPROVE"));
  }
  return run;
}

test("20 to 21 visibly runs Repair Proposer and Reviewer before G10 opens", () => {
  let run = repairRun20To21();
  run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));

  assert.equal(run.currentGate, null);
  assert.equal(run.phase, "REPAIR");
  assert.equal(run.liveExecution?.kind, "REPAIR_REVIEW");
  assert.ok(run.liveExecution);
  assert.ok(angularLiveExecutionDuration(run.liveExecution) >= 45_000);

  const proposer = run.liveExecution.steps.find(
    (step) => step.role === "repair_proposer",
  );
  const reviewer = run.liveExecution.steps.find(
    (step) => step.role === "repair_reviewer",
  );
  assert.equal(proposer?.kind, "LLM");
  assert.equal(reviewer?.kind, "REVIEWER");
  assert.match(proposer?.label ?? "", /Main Repair LLM/i);
  assert.match(reviewer?.label ?? "", /Independent Reviewer/i);

  const active = run.stageExecution?.repairAttempts.at(-1);
  assert.equal(active?.status, "REVIEWING");

  run = finishLive(run);
  assert.equal(run.liveExecution, undefined);
  assert.equal(run.currentGate, "G10");
  assert.equal(run.stageExecution?.repairAttempts.at(-1)?.status, "READY_FOR_G10");
  assert.match(
    run.stageExecution?.repairAttempts.at(-1)?.diff ?? "",
    /setupZoneTestEnv/,
  );
});

test("G10 approval runs explicit apply and validation sequence before G11", () => {
  let run = repairRun20To21();
  run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));
  run = finishLive(run);
  assert.equal(run.currentGate, "G10");

  run = applyAngularStageGateDecision(run, "G10", "APPROVE");
  assert.equal(run.currentGate, null);
  assert.equal(run.liveExecution?.kind, "REPAIR_VALIDATION");
  assert.ok(run.liveExecution);
  assert.ok(angularLiveExecutionDuration(run.liveExecution) >= 120_000);

  assert.deepEqual(
    run.liveExecution.steps.map((step) => step.id),
    [
      "repair-apply-prepare",
      "repair-apply",
      "repair-postimage",
      "repair-install",
      "repair-affected-validation",
      "repair-full-build",
      "repair-full-test",
      "repair-finalize",
    ],
  );

  run = finishLive(run);
  assert.equal(run.currentGate, "G11");
  assert.equal(run.stageExecution?.repairAttempts.at(-1)?.status, "VALIDATED");
  assert.equal(run.stageExecution?.validation, "PASS");
});
