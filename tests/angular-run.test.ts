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
  getAllowedPreTransformDecisions,
  markG02Stale,
} from "../src/stacks/angular/workflow/run.ts";
import {
  advanceAngularLiveExecution,
  angularLiveExecutionDuration,
} from "../src/stacks/angular/workflow/live.ts";

function finishLive(run: ReturnType<typeof runModel>) {
  assert.ok(run.liveExecution);
  return advanceAngularLiveExecution(
    run,
    run.liveExecution.startedAtMs +
      angularLiveExecutionDuration(run.liveExecution) +
      1,
  );
}

function runModel() {
  const preflight = prepareAngularPreflight({
    runName: "Customer Portal",
    sourcePath: "/workspace/source",
    outputParent: "/workspace/out",
    sourceMajor: 11,
    targetMajor: 15,
  });
  const approved = applyG01Decision(preflight, "APPROVE");
  return createAngularRunModel(createRunFromApprovedPreflight(approved));
}

test("authoritative run begins at G02 source snapshot", () => {
  const run = runModel();
  assert.equal(run.phase, "SOURCE_SNAPSHOT");
  assert.equal(run.currentGate, "G02");
  assert.equal(run.gates.G02.status, "PENDING");
  assert.equal(run.gates.G03.status, "LOCKED");
});

test("G02 approval runs baseline before opening G03", () => {
  const running = applyAngularGateDecision(runModel(), "G02", "APPROVE");
  assert.equal(running.currentGate, null);
  assert.equal(running.phase, "BASELINE");
  assert.equal(running.baseline.outcome, "PENDING");
  assert.equal(running.liveExecution?.kind, "BASELINE");

  const next = finishLive(running);
  assert.equal(next.currentGate, "G03");
  assert.equal(next.baseline.outcome, "QUALIFIED_WITH_KNOWN_FAILURES");
  assert.ok(next.baseline.steps.every((step) => ["PASS", "KNOWN_FAILURES"].includes(step.status)));
});

test("G02 staleness invalidates the active review evidence", () => {
  const stale = markG02Stale(runModel());
  assert.equal(stale.gates.G02.status, "STALE");
  assert.throws(() => applyAngularGateDecision(stale, "G02", "APPROVE"), /cannot accept/);
});

test("G03 does not invent approve-with-comment", () => {
  assert.deepEqual(
    getAllowedPreTransformDecisions("G03"),
    ["APPROVE", "REQUEST_MODIFICATION", "REJECT"],
  );
});

test("G02 through G06 preserve the original governed order", () => {
  let run = runModel();
  for (const gate of ["G02", "G03", "G04", "G05", "G06"] as const) {
    assert.equal(run.currentGate, gate);
    run = finishLive(applyAngularGateDecision(run, gate, "APPROVE"));
  }
  assert.equal(run.phase, "STAGE_PREPARATION");
  assert.equal(run.currentGate, "G07");
  assert.equal(run.stageExecution?.runtime.certification, "CERTIFIED");
  assert.match(run.currentAction, /certified runtime/);
});

test("planning revision supersedes the previous plan without deleting history", () => {
  let run = runModel();
  run = finishLive(applyAngularGateDecision(run, "G02", "APPROVE"));
  run = finishLive(applyAngularGateDecision(run, "G03", "APPROVE"));
  run = finishLive(applyAngularGateDecision(run, "G04", "APPROVE"));
  run = finishLive(applyAngularGateDecision(run, "G05", "APPROVE"));
  const revised = applyAngularGateDecision(run, "G06", "REQUEST_MODIFICATION", "Reduce stage risk.");

  assert.equal(revised.planning.length, 2);
  assert.equal(revised.planning[0]?.status, "SUPERSEDED");
  assert.equal(revised.planning[1]?.status, "READY_FOR_REVIEW");
  assert.equal(revised.gates.G06.revision, 2);
  assert.equal(revised.gates.G06.decisions.length, 1);
});
