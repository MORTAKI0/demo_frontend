import assert from "node:assert/strict";
import test from "node:test";

import { validateUnifiedDiff } from "../src/components/ui/git-diff.ts";

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

function repairRun15To16() {
  const preflight = prepareAngularPreflight({
    runName: "Angular 15 to 16 tooling repair",
    sourcePath: "/workspace/angular-11-crud-example",
    outputParent: "/workspace/out",
    sourceMajor: 15,
    targetMajor: 16,
  });
  let run = createAngularRunModel(
    createRunFromApprovedPreflight(applyG01Decision(preflight, "APPROVE")),
  );
  for (const gate of ["G02", "G03", "G04", "G05", "G06"] as const) {
    run = finishLive(applyAngularGateDecision(run, gate, "APPROVE"));
  }
  return run;
}

test("15 to 16 runs a governed lint-tooling Repair LLM review before G10", () => {
  let run = repairRun15To16();
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
  assert.match(proposer?.label ?? "", /Main Repair LLM/i);
  assert.match(reviewer?.label ?? "", /Independent Reviewer/i);

  const reviewing = run.stageExecution?.repairAttempts.at(-1);
  assert.equal(reviewing?.status, "REVIEWING");
  assert.equal(reviewing?.failureCategory, "LEGACY_TSLINT_BUILDER_UNAVAILABLE");
  assert.equal(reviewing?.failurePhase, "MAIN_REPAIR");
  assert.equal(reviewing?.failureOwner, "MAIN_REPAIR_LLM");

  run = finishLive(run);

  assert.equal(run.currentGate, "G10");
  const active = run.stageExecution?.repairAttempts.at(-1);
  assert.equal(active?.status, "READY_FOR_G10");
  assert.equal(active?.proposalKind, "TOOLING_TRANSITION");
  assert.equal(active?.operation, "tooling_transition");
  assert.deepEqual(active?.changedFiles, [
    "package.json",
    "angular.json",
    ".eslintrc.json",
  ]);
  assert.match(active?.diff ?? "", /^diff --git a\/package\.json b\/package\.json$/m);
  assert.match(active?.diff ?? "", /^--- a\/package\.json$/m);
  assert.match(active?.diff ?? "", /^\+\+\+ b\/package\.json$/m);
  assert.match(active?.diff ?? "", /^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/m);
  assert.match(active?.diff ?? "", /^diff --git a\/angular\.json b\/angular\.json$/m);
  assert.match(active?.diff ?? "", /^diff --git a\/\.eslintrc\.json b\/\.eslintrc\.json$/m);
  assert.match(active?.diff ?? "", /@angular-devkit\/build-angular:tslint/);
  assert.match(active?.diff ?? "", /@angular-eslint\/builder:lint/);
  assert.match(active?.diff ?? "", /codelyzer/);
  assert.match(active?.diff ?? "", /lintFilePatterns/);
  assert.deepEqual(active?.validationTargets, ["lint", "build", "test"]);
  assert.deepEqual(validateUnifiedDiff(active?.diff ?? ""), []);
});

test("15 to 16 G10 approval applies tooling transition then validates lint build and tests", () => {
  let run = repairRun15To16();
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
      "repair-tooling-apply-prepare",
      "repair-tooling-manifest",
      "repair-tooling-config",
      "repair-tooling-lock",
      "repair-tooling-install",
      "repair-tooling-lint",
      "repair-tooling-build",
      "repair-tooling-test",
      "repair-tooling-finalize",
    ],
  );

  run = finishLive(run);
  assert.equal(run.currentGate, "G11");
  assert.equal(run.stageExecution?.repairAttempts.at(-1)?.status, "VALIDATED");
  assert.equal(run.stageExecution?.validation, "PASS");
});
