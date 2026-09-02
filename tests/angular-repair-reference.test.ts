import assert from "node:assert/strict";
import test from "node:test";

import type { AngularMajor } from "../src/stacks/angular/domain/types.ts";
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

function governedRun(sourceMajor: AngularMajor, targetMajor: AngularMajor) {
  const preflight = prepareAngularPreflight({
    runName: "Repair reference projection",
    sourcePath: "/workspace/source",
    outputParent: "/workspace/out",
    sourceMajor,
    targetMajor,
  });
  let run = createAngularRunModel(
    createRunFromApprovedPreflight(applyG01Decision(preflight, "APPROVE")),
  );
  for (const gate of ["G02", "G03", "G04", "G05", "G06"] as const) {
    run = finishLive(applyAngularGateDecision(run, gate, "APPROVE"));
  }
  return run;
}

test("13 to 14 is not used as a fabricated Main Repair LLM failure", () => {
  let run = governedRun(13, 14);
  run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));

  assert.equal(run.currentGate, "G12");
  assert.equal(run.stageExecution?.validation, "PASS");
  assert.deepEqual(run.stageExecution?.repairAttempts, []);
});

test("20 to 21 exposes the source-backed final repair proposal before G10 approval", () => {
  let run = governedRun(20, 21);
  run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));
  assert.equal(run.liveExecution?.kind, "REPAIR_REVIEW");
  run = finishLive(run);

  assert.equal(run.currentGate, "G10");
  assert.equal(run.stageExecution?.validation, "FAILED");
  assert.equal(run.stageExecution?.repairAttempts.length, 4);

  const attempts = run.stageExecution?.repairAttempts ?? [];
  assert.deepEqual(
    attempts.map((attempt) => attempt.proposalKind),
    [
      "DEPENDENCY_TRANSITION",
      "DEPENDENCY_ADD",
      "DEPENDENCY_CHANGE",
      "SOURCE_PATCH",
    ],
  );

  const dependencyAdd = attempts[1];
  assert.match(dependencyAdd.diff, /jest-environment-jsdom/);
  assert.match(dependencyAdd.diff, /\^30\.0\.0/);

  const requestChangeParent = attempts[2];
  assert.equal(requestChangeParent.reviewerVerdict, "REQUEST_CHANGES");

  const active = attempts[3] as unknown as {
    parentAttemptId?: string;
    failurePhase?: string;
    failureOwner?: string;
    operation?: string;
    changedFiles: string[];
    diff: string;
    proposer?: {
      role: string;
      task: string;
      status: string;
    };
    reviewer?: {
      role: string;
      task: string;
      status: string;
      decision: string;
    };
  };

  assert.equal(active.parentAttemptId, requestChangeParent.id);
  assert.equal(active.failurePhase, "MAIN_REPAIR");
  assert.equal(active.failureOwner, "MAIN_REPAIR_LLM");
  assert.equal(active.operation, "replace_text");
  assert.deepEqual(active.changedFiles, ["setup-jest.ts"]);
  assert.match(active.diff, /^diff --git a\/setup-jest\.ts b\/setup-jest\.ts$/m);
  assert.match(active.diff, /^--- a\/setup-jest\.ts$/m);
  assert.match(active.diff, /^\+\+\+ b\/setup-jest\.ts$/m);
  assert.match(active.diff, /^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/m);
  assert.match(
    active.diff,
    /jest-preset-angular\/setup-env\/zone/,
  );
  assert.match(active.diff, /setupZoneTestEnv\(\);/);
  assert.deepEqual(active.proposer, {
    role: "repair_proposer",
    task: "repair_diagnosis",
    status: "SUCCEEDED",
  });
  assert.deepEqual(active.reviewer, {
    role: "repair_reviewer",
    task: "repair_review",
    status: "SUCCEEDED",
    decision: "ACCEPT",
  });
});

test("G10 approval applies only the active reviewed repair then revalidates", () => {
  let run = governedRun(20, 21);
  run = finishLive(applyAngularStageGateDecision(run, "G07", "APPROVE"));
  run = finishLive(run);

  const before = run.stageExecution?.repairAttempts.at(-1);
  assert.ok(before);
  assert.equal(before.status, "READY_FOR_G10");

  run = applyAngularStageGateDecision(run, "G10", "APPROVE");
  const approved = run.stageExecution?.repairAttempts.at(-1);
  assert.equal(approved?.status, "APPLIED");
  assert.equal(run.currentGate, null);
  assert.equal(run.phase, "REPAIR");
  assert.ok(run.liveExecution);
});
