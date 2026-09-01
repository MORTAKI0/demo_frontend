import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { liveExecutionDuration } from "../src/domain/live-execution.ts";
import { createAngularLiveExecution } from "../src/stacks/angular/workflow/live-definitions.ts";
import {
  applyG01Decision,
  createRunFromApprovedPreflight,
  prepareAngularPreflight,
} from "../src/stacks/angular/workflow/setup.ts";
import {
  completeAngularPlanningExecution,
  createAngularRunModel,
} from "../src/stacks/angular/workflow/run.ts";
import { createJavaLiveExecution } from "../src/stacks/java/workflow/live-definitions.ts";
import { seedJavaJob } from "../src/stacks/java/scenarios/seeds.ts";

const START = 1_900_000_000_000;

test("every Angular live execution keeps the operator in an observable phase for at least 30 seconds", () => {
  const kinds = [
    "BASELINE",
    "ANALYSIS",
    "FEASIBILITY",
    "PLANNING",
    "STAGE_PREPARATION",
    "STAGE_EXECUTION",
    "REPAIR_VALIDATION",
  ] as const;

  for (const kind of kinds) {
    const execution = createAngularLiveExecution(kind, START, {
      source: 11,
      target: 12,
    });
    assert.ok(
      liveExecutionDuration(execution) >= 30_000,
      kind + " must last at least 30 seconds",
    );
  }
});

test("Angular Planning lasts about 45 seconds and exposes the real deterministic plan contract", () => {
  const execution = createAngularLiveExecution("PLANNING", START, {
    source: 11,
    target: 12,
  });
  const duration = liveExecutionDuration(execution);
  const nodes = execution.steps.map((step) => step.node);
  const logs = execution.steps.flatMap((step) => step.logs).join("\n");

  assert.ok(duration >= 44_000, "Planning must last at least 44 seconds");
  assert.ok(duration <= 46_000, "Planning must finish within 46 seconds");

  for (const node of [
    "planning.inputs.resolve",
    "planning.route.build",
    "planning.first_stage.resolve",
    "planning.command_contract",
    "planning.policy_contract",
    "planning.phase_proposer",
    "planning.phase_reviewer",
    "planning.package.finalize",
  ]) {
    assert.ok(nodes.includes(node), node + " must be visible in Planning");
  }

  assert.match(logs, /resolve_exact_before_each_stage/);
  assert.match(logs, /catalog-v4/);
  assert.match(logs, /transformer-plan-v2\.2-proven-1/);
  assert.match(logs, /11\.0\.4.*12\.2\.17/);
  assert.match(logs, /12\.2\.18/);
  assert.match(logs, /12\.22\.12.*8\.19\.4/);
  assert.match(logs, /angular-stage-standard-v2/);
  assert.match(logs, /safe-boundary-v1/);
  assert.match(logs, /proposer-reviewer-human-v1/);
  assert.match(logs, /mandatory-human-v1/);
});

test("completed Angular Planning exposes route, first-stage, policies, reviewer, and checksums for G06", () => {
  const preflight = prepareAngularPreflight({
    runName: "Angular 11 CRUD Example",
    sourcePath: "/workspace/angular-11-crud-example",
    outputParent: "/workspace/migration-output",
    sourceMajor: 11,
    targetMajor: 21,
  });
  const seed = createRunFromApprovedPreflight(
    applyG01Decision(preflight, "APPROVE"),
  );
  const run = createAngularRunModel(seed);
  const planned = completeAngularPlanningExecution(
    run,
    "2026-09-01T14:00:00+01:00",
  );
  const revision = planned.planning[0] as unknown as {
    deterministicPlan?: {
      route: string[];
      stagePlanStrategy: string;
      catalogueVersion: string;
      transformerSemanticVersion: string;
      approvalPolicy: string;
      commandPolicy: string;
      artifactPolicy: string;
    };
    firstStagePlan?: {
      sourceExact: string;
      targetExact: string;
      targetCliExact: string;
      runtime: string;
      npm: string;
      commandGroups: string[];
      builder: string;
    };
    policies?: {
      validation: string;
      recovery: string;
      repair: string;
      forbiddenChanges: string[];
    };
    narrative?: {
      rationale: string[];
      risks: string[];
      unresolvedQuestions: string[];
    };
    review?: {
      decision: string;
      confidence: string;
      notes: string[];
      policyConcerns: string[];
    };
  };

  assert.equal(revision.deterministicPlan?.stagePlanStrategy, "resolve_exact_before_each_stage");
  assert.equal(revision.deterministicPlan?.catalogueVersion, "catalog-v4");
  assert.equal(
    revision.deterministicPlan?.transformerSemanticVersion,
    "transformer-plan-v2.2-proven-1",
  );
  assert.equal(revision.deterministicPlan?.approvalPolicy, "mandatory-human-v1");
  assert.equal(revision.deterministicPlan?.commandPolicy, "structured-registry-v1");
  assert.equal(revision.deterministicPlan?.artifactPolicy, "immutable-stage-scoped-v1");
  assert.equal(revision.deterministicPlan?.route.length, 10);

  assert.equal(revision.firstStagePlan?.sourceExact, "11.0.4");
  assert.equal(revision.firstStagePlan?.targetExact, "12.2.17");
  assert.equal(revision.firstStagePlan?.targetCliExact, "12.2.18");
  assert.equal(revision.firstStagePlan?.runtime, "Node 12.22.12");
  assert.equal(revision.firstStagePlan?.npm, "8.19.4");
  assert.equal(
    revision.firstStagePlan?.builder,
    "@angular-devkit/build-angular:browser",
  );
  assert.ok((revision.firstStagePlan?.commandGroups.length ?? 0) >= 6);

  assert.equal(revision.policies?.validation, "angular-stage-standard-v2");
  assert.equal(revision.policies?.recovery, "safe-boundary-v1");
  assert.equal(revision.policies?.repair, "proposer-reviewer-human-v1");
  assert.ok((revision.policies?.forbiddenChanges.length ?? 0) >= 5);
  assert.ok((revision.narrative?.rationale.length ?? 0) >= 4);
  assert.ok((revision.narrative?.risks.length ?? 0) >= 3);
  assert.equal(revision.review?.decision, "ACCEPT");
  assert.equal(revision.review?.confidence, "HIGH");
});

test("every Java live execution lasts at least 30 seconds and Java Planning lasts about 45 seconds", () => {
  const kinds = [
    "PREFLIGHT",
    "CANCELLATION",
    "ANALYSIS_AGENT",
    "PLANNING_AGENT",
    "ASSESSMENT_AGENT",
    "TRANSFORM_AGENT",
    "BUILD_AGENT",
    "TEST_VALIDATION",
  ] as const;

  for (const kind of kinds) {
    const execution = createJavaLiveExecution(kind, START, 1);
    const duration = liveExecutionDuration(execution);
    assert.ok(duration >= 30_000, kind + " must last at least 30 seconds");

    if (kind === "PLANNING_AGENT") {
      assert.ok(duration >= 44_000 && duration <= 46_000);
      const logs = execution.steps.flatMap((step) => step.logs).join("\n");
      assert.match(logs, /source profile/i);
      assert.match(logs, /route/i);
      assert.match(logs, /Maven/i);
      assert.match(logs, /validation/i);
      assert.match(logs, /repair/i);
      assert.match(logs, /review/i);
    }
  }
});

test("Java Planning projection exposes detailed execution units and reviewer conclusions", () => {
  const job = seedJavaJob("java-terminal-service");
  const revision = job.planning[0] as unknown as {
    routePlan?: string[];
    executionUnits?: string[];
    validationTargets?: string[];
    constraints?: string[];
    rationale?: string[];
    reviewerNotes?: string[];
  };

  assert.ok((revision.routePlan?.length ?? 0) >= 3);
  assert.ok((revision.executionUnits?.length ?? 0) >= 5);
  assert.ok((revision.validationTargets?.length ?? 0) >= 2);
  assert.ok((revision.constraints?.length ?? 0) >= 3);
  assert.ok((revision.rationale?.length ?? 0) >= 3);
  assert.ok((revision.reviewerNotes?.length ?? 0) >= 2);
});

test("Control Towers auto-focus a new live execution and historical phase detail is collapsible", () => {
  const angularPage = readFileSync(
    "src/stacks/angular/components/angular-control-tower-page.tsx",
    "utf8",
  );
  const javaPage = readFileSync(
    "src/stacks/java/components/java-cockpit-page.tsx",
    "utf8",
  );
  const angularPipeline = readFileSync(
    "src/stacks/angular/components/angular-pipeline.tsx",
    "utf8",
  );
  const javaPipeline = readFileSync(
    "src/stacks/java/components/java-pipeline.tsx",
    "utf8",
  );

  for (const source of [angularPage, javaPage]) {
    assert.match(source, /scrollIntoView/);
    assert.match(source, /liveExecution.*id/);
    assert.match(source, /block:\s*"start"/);
  }

  for (const source of [angularPipeline, javaPipeline]) {
    assert.match(source, /<details/);
    assert.match(source, /<summary/);
    assert.match(source, /Completed phase detail/);
  }
});


test("Angular baseline detail collapses after G03 while remaining reopenable", () => {
  const source = readFileSync(
    "src/stacks/angular/components/angular-pipeline.tsx",
    "utf8",
  );

  assert.match(source, /Baseline phase detail/);
  assert.match(source, /open=\{run\.currentGate === "G03"\}/);
  assert.match(source, /Completed baseline detail · click to reopen/);
});
