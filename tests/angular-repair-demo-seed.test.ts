import assert from "node:assert/strict";
import test from "node:test";

import { seedAngularRun } from "../src/stacks/angular/scenarios/seeds.ts";

test("run-angular-action opens on the source-backed 20 to 21 G10 repair review", () => {
  const run = seedAngularRun("run-angular-action");

  assert.equal(run.stageExecution?.source, 20);
  assert.equal(run.stageExecution?.target, 21);
  assert.equal(run.currentGate, "G10");
  assert.equal(run.phase, "REPAIR");

  const active = run.stageExecution?.repairAttempts.at(-1);
  assert.equal(active?.proposalKind, "SOURCE_PATCH");
  assert.match(active?.diff ?? "", /setupZoneTestEnv/);
});
