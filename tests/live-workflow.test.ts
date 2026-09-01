import assert from "node:assert/strict";
import test from "node:test";

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
import {
  applyG01Decision,
  createRunFromApprovedPreflight,
  prepareAngularPreflight,
} from "../src/stacks/angular/workflow/setup.ts";
import {
  advanceJavaLiveExecution,
  ensureJavaLiveExecution,
  javaLiveExecutionDuration,
} from "../src/stacks/java/workflow/live.ts";
import {
  applyJavaGateDecision,
  createJavaJobModel,
} from "../src/stacks/java/workflow/cockpit.ts";
import {
  createJavaJob,
  prepareJavaMigration,
} from "../src/stacks/java/workflow/setup.ts";

const START = 1_900_000_000_000;

function angularRun() {
  const preflight = prepareAngularPreflight({
    runName: "Customer Portal",
    sourcePath: "/workspace/customer-portal-angular11",
    outputParent: "/workspace/migration-output",
    sourceMajor: 11,
    targetMajor: 15,
  });
  const approved = applyG01Decision(preflight, "APPROVE");
  return createAngularRunModel(createRunFromApprovedPreflight(approved));
}

function finishAngularExecution(run: ReturnType<typeof angularRun>) {
  assert.ok(run.liveExecution);
  return advanceAngularLiveExecution(
    run,
    run.liveExecution.startedAtMs +
      angularLiveExecutionDuration(run.liveExecution) +
      1,
  );
}

function reachAngularGate(
  gate: "G03" | "G04" | "G05" | "G06" | "G07",
) {
  let run = angularRun();

  run = applyAngularGateDecision(
    run,
    "G02",
    "APPROVE",
    "",
    "2026-09-01T12:30:00+01:00",
    START,
  );
  run = finishAngularExecution(run);
  if (gate === "G03") return run;

  run = applyAngularGateDecision(
    run,
    "G03",
    "APPROVE",
    "",
    "2026-09-01T12:31:00+01:00",
    START + 20_000,
  );
  run = finishAngularExecution(run);
  if (gate === "G04") return run;

  run = applyAngularGateDecision(
    run,
    "G04",
    "APPROVE",
    "",
    "2026-09-01T12:32:00+01:00",
    START + 40_000,
  );
  run = finishAngularExecution(run);
  if (gate === "G05") return run;

  run = applyAngularGateDecision(
    run,
    "G05",
    "APPROVE",
    "",
    "2026-09-01T12:33:00+01:00",
    START + 60_000,
  );
  run = finishAngularExecution(run);
  if (gate === "G06") return run;

  run = applyAngularGateDecision(
    run,
    "G06",
    "APPROVE",
    "",
    "2026-09-01T12:34:00+01:00",
    START + 80_000,
  );
  return finishAngularExecution(run);
}

test("G02 approval starts baseline execution instead of immediately exposing G03", () => {
  const run = applyAngularGateDecision(
    angularRun(),
    "G02",
    "APPROVE",
    "",
    "2026-09-01T12:30:00+01:00",
    START,
  );

  assert.equal(run.currentGate, null);
  assert.equal(run.baseline.outcome, "PENDING");
  assert.equal(run.liveExecution?.kind, "BASELINE");
  assert.equal(run.liveExecution?.status, "RUNNING");

  const completed = finishAngularExecution(run);
  assert.equal(completed.currentGate, "G03");
  assert.equal(completed.baseline.outcome, "QUALIFIED_WITH_GAPS");
  assert.equal(completed.liveExecution, undefined);
});

test("G03 approval runs Azure analysis proposer then independent reviewer before G04 exists", () => {
  let run = reachAngularGate("G03");

  run = applyAngularGateDecision(
    run,
    "G03",
    "APPROVE",
    "",
    "2026-09-01T12:31:00+01:00",
    START,
  );

  assert.equal(run.currentGate, null);
  assert.equal(run.analysis.status, "WAITING");
  assert.equal(run.liveExecution?.kind, "ANALYSIS");
  assert.equal(
    run.liveExecution?.steps.some(
      (step) => step.role === "phase_proposer" && step.deployment === "gpt-5-mini",
    ),
    true,
  );
  assert.equal(
    run.liveExecution?.steps.some(
      (step) => step.role === "phase_reviewer" && step.provider === "azure_openai",
    ),
    true,
  );

  run = finishAngularExecution(run);
  assert.equal(run.currentGate, "G04");
  assert.equal(run.analysis.status, "READY_FOR_REVIEW");
  assert.equal(run.analysis.proposer.deployment, "gpt-5-mini");
  assert.equal(run.analysis.reviewer.deployment, "gpt-5-mini");
  assert.equal(run.analysis.reviewerVerdict, "ACCEPT");
});

test("G05 approval runs Planning proposer and reviewer before G06 is reviewable", () => {
  let run = reachAngularGate("G05");

  run = applyAngularGateDecision(
    run,
    "G05",
    "APPROVE",
    "",
    "2026-09-01T12:33:00+01:00",
    START,
  );

  assert.equal(run.currentGate, null);
  assert.equal(run.planning.length, 0);
  assert.equal(run.liveExecution?.kind, "PLANNING");

  run = finishAngularExecution(run);
  assert.equal(run.currentGate, "G06");
  assert.equal(run.planning.length, 1);
  assert.equal(run.planning[0]?.proposer.deployment, "gpt-5-mini");
  assert.equal(run.planning[0]?.reviewer.role, "phase_reviewer");
});

test("G07 approval executes PROVEN groups before exposing G12", () => {
  let run = reachAngularGate("G07");
  assert.equal(run.currentGate, "G07");

  run = applyAngularStageGateDecision(
    run,
    "G07",
    "APPROVE",
    "",
    "2026-09-01T12:35:00+01:00",
    START,
  );

  assert.equal(run.currentGate, null);
  assert.equal(run.stageExecution?.status, "EXECUTING");
  assert.equal(run.stageExecution?.validation, "PENDING");
  assert.equal(run.liveExecution?.kind, "STAGE_EXECUTION");

  run = finishAngularExecution(run);
  assert.equal(run.currentGate, "G12");
  assert.equal(run.stageExecution?.validation, "PASS");
  assert.equal(run.stageExecution?.groups.every((group) => group.status === "PASS"), true);
});

function javaJob() {
  const configuration = prepareJavaMigration({
    name: "Order Service",
    sourcePath: "/workspace/order-service",
    outputParent: "/workspace/out",
    environmentImport: "Development baseline",
    sourceProfile: "SB_2_1_J11",
    targetProfile: "SB_4_0_J21",
    continuationPolicy: "AUTO_ON_GREEN",
    proofLevel: "STRICT",
  });
  return createJavaJobModel(createJavaJob(configuration));
}

function finishJavaExecution(job: ReturnType<typeof javaJob>) {
  assert.ok(job.liveExecution);
  return advanceJavaLiveExecution(
    job,
    job.liveExecution.startedAtMs +
      javaLiveExecutionDuration(job.liveExecution) +
      1,
  );
}

function runJavaUntilGate(
  job: ReturnType<typeof javaJob>,
  gate: "analysis_review" | "planning_review" | "approval_review",
) {
  let current = ensureJavaLiveExecution(job, START);
  for (let index = 0; index < 12 && current.currentGate !== gate; index += 1) {
    current = finishJavaExecution(current);
  }
  assert.equal(current.currentGate, gate);
  return current;
}

test("Java pipeline automatically executes phases with logs before analysis_review", () => {
  let job = ensureJavaLiveExecution(javaJob(), START);

  assert.equal(job.currentPhase, "PREFLIGHT");
  assert.equal(job.liveExecution?.status, "RUNNING");
  assert.equal(job.liveExecution?.steps[0]?.node, "preflight.validate_setup");

  job = runJavaUntilGate(job, "analysis_review");

  assert.equal(job.currentGate, "analysis_review");
  assert.equal(job.liveExecution, undefined);
  assert.equal(job.analysis.length, 1);
  assert.equal(job.analysis[0]?.proposer.deployment, "gpt-5-mini");
  assert.equal(job.analysis[0]?.reviewer.provider, "azure_foundry");
  assert.equal(
    job.analysis[0]?.reviewer.deployment,
    "Llama-3.3-70B-Instruct",
  );
});

test("Java planning executes automatically after analysis review and exposes reviewer provenance", () => {
  let job = runJavaUntilGate(javaJob(), "analysis_review");
  job = applyJavaGateDecision(job, "analysis_review", "CONTINUE");

  job = ensureJavaLiveExecution(job, START + 60_000);
  assert.equal(job.currentPhase, "PLANNING_AGENT");
  assert.equal(job.currentGate, null);
  assert.equal(job.liveExecution?.kind, "PLANNING_AGENT");

  job = runJavaUntilGate(job, "planning_review");
  assert.equal(job.planning[0]?.proposer.role, "phase_proposer");
  assert.equal(
    job.planning[0]?.reviewer.deployment,
    "Llama-3.3-70B-Instruct",
  );
});
