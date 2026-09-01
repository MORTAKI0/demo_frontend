import assert from "node:assert/strict";
import test from "node:test";

import { liveExecutionDuration } from "../src/domain/live-execution.ts";
import { prepareAngularPreflight } from "../src/stacks/angular/workflow/setup.ts";
import { createAngularLiveExecution } from "../src/stacks/angular/workflow/live-definitions.ts";
import {
  completedAnalysis,
  completedBaseline,
} from "../src/stacks/angular/workflow/run.ts";

test("Angular demo source review matches cornflourblue angular-11-crud-example", () => {
  const preflight = prepareAngularPreflight({
    runName: "Angular 11 CRUD Example",
    sourcePath: "/workspace/angular-11-crud-example",
    outputParent: "/workspace/migration-output",
    sourceMajor: 11,
    targetMajor: 21,
  });

  assert.equal(preflight.sourceAnalysis.detectedVersion, "11.0.4");
  assert.equal(preflight.sourceAnalysis.workspace, "Angular CLI application");
  assert.equal(preflight.sourceAnalysis.projects, 1);
  assert.equal(
    preflight.sourceAnalysis.builder,
    "@angular-devkit/build-angular:browser",
  );
  assert.equal(preflight.sourceAnalysis.lockfile, "package-lock.json");
  assert.equal(preflight.sourceAnalysis.dependencyCount, 28);
  assert.equal(preflight.sourceAnalysis.thirdPartyPackages, 17);
  assert.equal(preflight.sourceAnalysis.applicationName, "angular-crud-example");
  assert.equal(preflight.sourceAnalysis.angularCliVersion, "11.0.4");
  assert.equal(preflight.sourceAnalysis.typescriptVersion, "4.0.2");
  assert.equal(preflight.sourceAnalysis.rxjsVersion, "6.6.x");
  assert.equal(preflight.sourceAnalysis.lazyFeatureModules, 1);
  assert.equal(preflight.sourceAnalysis.crudOperations, 5);
});

test("G03 baseline execution lasts 17-19 seconds and proves the real Angular 11 CRUD source", () => {
  const execution = createAngularLiveExecution("BASELINE", 1_900_000_000_000);
  const duration = liveExecutionDuration(execution);
  const allLogs = execution.steps.flatMap((step) => step.logs).join("\n");
  const commands = execution.steps.map((step) => step.command).filter(Boolean);

  assert.ok(duration >= 17_000, "baseline must last at least 17 seconds");
  assert.ok(duration <= 19_000, "baseline must finish within 19 seconds");
  assert.match(allLogs, /angular-crud-example/);
  assert.match(allLogs, /Angular 11\.0\.4/);
  assert.match(allLogs, /Angular CLI 11\.0\.4/);
  assert.match(allLogs, /TypeScript 4\.0\.2/);
  assert.match(allLogs, /RxJS 6\.6/);
  assert.match(allLogs, /Karma.*Jasmine.*Chrome/i);
  assert.match(allLogs, /no src\/\*\*\/\*\.spec\.ts unit specs/i);
  assert.match(allLogs, /Protractor.*e2e/i);
  assert.ok(commands.includes("npm ci"));
  assert.ok(commands.includes("npm run build -- --prod"));
  assert.ok(commands.includes("npm test -- --watch=false --browsers=ChromeHeadless"));
  assert.ok(commands.includes("npm run lint"));
});

test("G04 analysis execution lasts 18-20 seconds and visibly scans the real CRUD architecture", () => {
  const execution = createAngularLiveExecution("ANALYSIS", 1_900_000_000_000);
  const duration = liveExecutionDuration(execution);
  const nodes = execution.steps.map((step) => step.node);
  const logs = execution.steps.flatMap((step) => step.logs).join("\n");

  assert.ok(duration >= 18_000, "analysis must last at least 18 seconds");
  assert.ok(duration <= 20_000, "analysis must finish within 20 seconds");

  assert.ok(nodes.includes("analysis.topology_scan"));
  assert.ok(nodes.includes("analysis.route_service_scan"));
  assert.ok(nodes.includes("analysis.forms_http_scan"));
  assert.ok(nodes.includes("analysis.tooling_scan"));
  assert.ok(nodes.includes("analysis.phase_proposer"));
  assert.ok(nodes.includes("analysis.phase_reviewer"));

  assert.match(logs, /src\/app\/app\.module\.ts/);
  assert.match(logs, /lazy.*UsersModule/i);
  assert.match(logs, /\/users\/add/);
  assert.match(logs, /\/users\/edit\/:id/);
  assert.match(logs, /UserService.*GET.*POST.*PUT.*DELETE/i);
  assert.match(logs, /ReactiveFormsModule/);
  assert.match(logs, /localStorage/);
  assert.match(logs, /throwError/);
  assert.match(logs, /TSLint.*Codelyzer/i);
  assert.match(logs, /Protractor/i);
});

test("G04 completed analysis exposes repository-grounded application profile and migration findings", () => {
  const analysis = completedAnalysis("READY_FOR_REVIEW");

  assert.ok(analysis.applicationProfile);
  const profile = analysis.applicationProfile;

  assert.equal(profile.repository, "cornflourblue/angular-11-crud-example");
  assert.equal(profile.revision, "eda3cf6278c02e4fb65f91ec73a9281d4325514e");
  assert.equal(profile.applicationName, "angular-crud-example");
  assert.equal(profile.angular, "11.0.4");
  assert.equal(profile.angularCli, "11.0.4");
  assert.equal(profile.typescript, "4.0.2");
  assert.equal(profile.rxjs, "6.6.x");
  assert.equal(profile.projects, 1);
  assert.equal(profile.lazyFeatureModules, 1);
  assert.equal(profile.crudOperations, 5);
  assert.deepEqual(profile.routes, [
    "/",
    "/users",
    "/users/add",
    "/users/edit/:id",
  ]);

  const findings = new Map(
    analysis.findings.map((finding) => [finding.id, finding]),
  );

  assert.equal(findings.get("preserve-ngmodule")?.severity, "INFO");
  assert.equal(findings.get("rxjs-throwerror")?.severity, "WATCH");
  assert.equal(findings.get("tslint-codelyzer")?.severity, "MIGRATION_REQUIRED");
  assert.equal(findings.get("protractor")?.severity, "MIGRATION_REQUIRED");
  assert.equal(findings.get("interceptor-localstorage")?.category, "HTTP");
  assert.match(
    findings.get("lazy-users-module")?.evidence ?? "",
    /users\/users\.module\.ts/,
  );
});


test("G03 classifies missing unit specs as a coverage gap rather than a test failure", () => {
  const baseline = completedBaseline();
  const tests = baseline.steps.find((step) => step.id === "tests");

  assert.equal(baseline.outcome, "QUALIFIED_WITH_GAPS");
  assert.equal(tests?.status, "COVERAGE_GAP");
  assert.equal(baseline.knownFailures.length, 0);
  assert.ok(
    baseline.knownGaps.some((gap) =>
      gap.includes("no src/**/*.spec.ts unit specs"),
    ),
  );
});
