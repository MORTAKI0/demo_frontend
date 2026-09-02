import assert from "node:assert/strict";
import test from "node:test";

import { seedAngularRun } from "../src/stacks/angular/scenarios/seeds.ts";
import { seedJavaJob } from "../src/stacks/java/scenarios/seeds.ts";

test("Angular action scenario reseeds deterministically", () => {
  const first = seedAngularRun("run-angular-action");
  const second = seedAngularRun("run-angular-action");

  assert.deepEqual(second, first);
  assert.equal(first.currentGate, "G10");
  assert.equal(first.stageExecution?.source, 20);
  assert.equal(first.stageExecution?.target, 21);
  assert.equal(first.stageExecution?.repairAttempts.length, 4);
  assert.equal(first.stageExecution?.repairAttempts.at(-1)?.proposalKind, "SOURCE_PATCH");
});

test("Java terminal report scenario reseeds deterministically", () => {
  const first = seedJavaJob("java-terminal-service");
  const second = seedJavaJob("java-terminal-service");

  assert.deepEqual(second, first);
  assert.equal(first.status, "COMPLETED");
  assert.equal(first.currentStage, 4);
  assert.equal(first.finalReport.status, "GENERATED");
  assert.equal(first.finalReport.artifacts.length, 3);
});

test("Java repair scenario reseeds deterministically at repair_review", () => {
  const first = seedJavaJob("java-repair-service");
  const second = seedJavaJob("java-repair-service");

  assert.deepEqual(second, first);
  assert.equal(first.currentGate, "repair_review");
  assert.equal(first.repair.attempts[0]?.stage, 2);
  assert.equal(first.repair.attempts[0]?.attempt, 1);
});
