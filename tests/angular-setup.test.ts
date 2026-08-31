import assert from "node:assert/strict";
import test from "node:test";

import {
  applyG01Decision,
  computeAngularRoute,
  createRunFromApprovedPreflight,
  prepareAngularPreflight,
} from "../src/stacks/angular/workflow/setup.ts";

test("Angular 11 to 15 computes four adjacent governed stages", () => {
  const route = computeAngularRoute(11, 15);
  assert.deepEqual(
    route.map((step) => [step.source, step.target]),
    [[11, 12], [12, 13], [13, 14], [14, 15]],
  );
});

test("backward or equal Angular targets are rejected", () => {
  assert.throws(() => computeAngularRoute(15, 15), /greater/);
  assert.throws(() => computeAngularRoute(15, 14), /greater/);
});

test("blocked production preflight cannot be approved", () => {
  const preflight = prepareAngularPreflight({
    runName: "Blocked",
    sourcePath: "/workspace/blocked/source",
    outputParent: "/workspace/out",
    sourceMajor: 11,
    targetMajor: 15,
  });
  assert.equal(preflight.status, "BLOCKED");
  assert.throws(() => applyG01Decision(preflight, "APPROVE"), /cannot be approved/);
});

test("G01 request modification keeps decision history", () => {
  const preflight = prepareAngularPreflight({
    runName: "Customer Portal",
    sourcePath: "/workspace/source",
    outputParent: "/workspace/out",
    sourceMajor: 11,
    targetMajor: 15,
  });
  const requested = applyG01Decision(preflight, "REQUEST_MODIFICATION", "Confirm Chrome binding.");
  assert.equal(requested.reviewStatus, "MODIFICATION_REQUESTED");
  assert.equal(requested.decisions.length, 1);
  assert.equal(preflight.decisions.length, 0);
});

test("only an approved G01 creates an authoritative run at G02", () => {
  const preflight = prepareAngularPreflight({
    runName: "Customer Portal",
    sourcePath: "/workspace/source",
    outputParent: "/workspace/out",
    sourceMajor: 11,
    targetMajor: 15,
  });
  assert.throws(() => createRunFromApprovedPreflight(preflight), /requires an approved G01/);
  const approved = applyG01Decision(preflight, "APPROVE");
  const run = createRunFromApprovedPreflight(approved);
  assert.equal(run.currentGate, "G02");
  assert.equal(run.route.length, 4);
  assert.equal(run.g01DecisionId, "g01-decision-1");
});
