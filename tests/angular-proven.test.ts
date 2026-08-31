import assert from "node:assert/strict";
import test from "node:test";

import { applyG01Decision, createRunFromApprovedPreflight, prepareAngularPreflight } from "../src/stacks/angular/workflow/setup.ts";
import { applyAngularGateDecision, createAngularRunModel } from "../src/stacks/angular/workflow/run.ts";
import { applyAngularStageGateDecision } from "../src/stacks/angular/workflow/proven.ts";

function governedRun() {
  const preflight = prepareAngularPreflight({
    runName: "Customer Portal",
    sourcePath: "/workspace/source",
    outputParent: "/workspace/out",
    sourceMajor: 11,
    targetMajor: 15,
  });
  let run = createAngularRunModel(createRunFromApprovedPreflight(applyG01Decision(preflight, "APPROVE")));
  for (const gate of ["G02","G03","G04","G05","G06"] as const) {
    run = applyAngularGateDecision(run, gate, "APPROVE");
  }
  return run;
}

test("runtime certification is bound before G07 and modern G08 is absent", () => {
  const run = governedRun();
  assert.equal(run.currentGate, "G07");
  assert.equal(run.stageExecution?.runtime.certification, "CERTIFIED");
  assert.deepEqual(Object.keys(run.stageExecution?.gates ?? {}), ["G07","G09","G10","G11","G12"]);
  assert.equal(run.stageExecution?.groups.length, 6);
});

test("clean PROVEN stage goes directly from G07 validation to G12, then promotion and seal", () => {
  let run = governedRun();
  run = applyAngularStageGateDecision(run, "G07", "APPROVE");

  assert.equal(run.stageExecution?.validation, "PASS");
  assert.equal(run.currentGate, "G12");
  assert.equal(run.stageExecution?.gates.G09.status, "LOCKED");

  run = applyAngularStageGateDecision(run, "G12", "APPROVE");
  assert.equal(run.route[0]?.status, "SEALED");
  assert.equal(run.stageExecution?.source, 12);
  assert.equal(run.stageExecution?.target, 13);
  assert.equal(run.currentGate, "G07");
});

test("13 to 14 failure records causal rejection and opens only a valid G10 proposal", () => {
  let run = governedRun();
  for (let index = 0; index < 2; index += 1) {
    run = applyAngularStageGateDecision(run, "G07", "APPROVE");
    run = applyAngularStageGateDecision(run, "G12", "APPROVE");
  }
  run = applyAngularStageGateDecision(run, "G07", "APPROVE");

  assert.equal(run.stageExecution?.source, 13);
  assert.equal(run.stageExecution?.target, 14);
  assert.equal(run.currentGate, "G10");
  assert.equal(run.stageExecution?.validation, "FAILED");
  assert.equal(run.stageExecution?.repairAttempts[0]?.causalResult, "REPAIR_CAUSAL_KIND_MISMATCH");
  assert.equal(run.stageExecution?.repairAttempts[0]?.status, "REJECTED_BY_CAUSAL_POLICY");
  assert.equal(run.stageExecution?.repairAttempts[1]?.causalResult, "PASS");
});

test("repaired stage follows G10 to G11 to G09 to G12 before promotion and seal", () => {
  let run = governedRun();
  for (let index = 0; index < 2; index += 1) {
    run = applyAngularStageGateDecision(run, "G07", "APPROVE");
    run = applyAngularStageGateDecision(run, "G12", "APPROVE");
  }
  run = applyAngularStageGateDecision(run, "G07", "APPROVE");

  run = applyAngularStageGateDecision(run, "G10", "APPROVE");
  assert.equal(run.currentGate, "G11");
  run = applyAngularStageGateDecision(run, "G11", "APPROVE");
  assert.equal(run.currentGate, "G09");
  run = applyAngularStageGateDecision(run, "G09", "APPROVE");
  assert.equal(run.currentGate, "G12");
  run = applyAngularStageGateDecision(run, "G12", "APPROVE");

  assert.equal(run.route[2]?.status, "SEALED");
  assert.equal(run.stageExecution?.source, 14);
  assert.equal(run.stageExecution?.target, 15);
  assert.equal(run.currentGate, "G07");
});

test("all four adjacent stages can complete without continuing beyond requested Angular 15", () => {
  let run = governedRun();

  for (let stageIndex = 0; stageIndex < 4; stageIndex += 1) {
    run = applyAngularStageGateDecision(run, "G07", "APPROVE");
    if (run.currentGate === "G10") {
      run = applyAngularStageGateDecision(run, "G10", "APPROVE");
      run = applyAngularStageGateDecision(run, "G11", "APPROVE");
      run = applyAngularStageGateDecision(run, "G09", "APPROVE");
    }
    run = applyAngularStageGateDecision(run, "G12", "APPROVE");
  }

  assert.equal(run.state, "COMPLETED");
  assert.equal(run.phase, "COMPLETE");
  assert.equal(run.currentGate, null);
  assert.ok(run.route.every((stage) => stage.status === "SEALED"));
});
