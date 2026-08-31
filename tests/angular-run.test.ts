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

test("G02 approval proves baseline and opens G03", () => {
  const next = applyAngularGateDecision(runModel(), "G02", "APPROVE");
  assert.equal(next.currentGate, "G03");
  assert.equal(next.phase, "BASELINE");
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
    run = applyAngularGateDecision(run, gate, "APPROVE");
  }
  assert.equal(run.phase, "STAGE_PREPARATION");
  assert.equal(run.currentGate, "G07");
  assert.equal(run.stageExecution?.runtime.certification, "CERTIFIED");
  assert.match(run.currentAction, /certified runtime/);
});

test("planning revision supersedes the previous plan without deleting history", () => {
  let run = runModel();
  run = applyAngularGateDecision(run, "G02", "APPROVE");
  run = applyAngularGateDecision(run, "G03", "APPROVE");
  run = applyAngularGateDecision(run, "G04", "APPROVE");
  run = applyAngularGateDecision(run, "G05", "APPROVE");
  const revised = applyAngularGateDecision(run, "G06", "REQUEST_MODIFICATION", "Reduce stage risk.");

  assert.equal(revised.planning.length, 2);
  assert.equal(revised.planning[0]?.status, "SUPERSEDED");
  assert.equal(revised.planning[1]?.status, "READY_FOR_REVIEW");
  assert.equal(revised.gates.G06.revision, 2);
  assert.equal(revised.gates.G06.decisions.length, 1);
});
