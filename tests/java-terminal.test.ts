import assert from "node:assert/strict";
import test from "node:test";

import { createJavaJob, prepareJavaMigration } from "../src/stacks/java/workflow/setup.ts";
import { createJavaJobModel } from "../src/stacks/java/workflow/cockpit.ts";
import {
  acceptJavaStage4Output,
  analyzeJavaTargetVersions,
  applyJavaTargetVersionProposal,
  applyJavaTargetVersionRepair,
  compareJavaTargetVersions,
  createJavaStage4OutputRevision,
  generateJavaFinalReport,
  getJavaReportArtifact,
  isJavaFinalReportEligible,
  parseJavaTargetVersionsCsv,
  renderJavaPomVersionDiff,
} from "../src/stacks/java/workflow/terminal.ts";
import type { JavaJobModel } from "../src/stacks/java/domain/run-types.ts";

const GREEN_CSV = [
  "groupId,artifactId,targetVersion",
  "org.springframework.boot,spring-boot-dependencies,4.0.0",
  "org.junit.jupiter,junit-jupiter,6.0.0",
  "org.mockito,mockito-core,5.20.0",
].join("\n");

const REPAIR_CSV = [
  "groupId,artifactId,targetVersion",
  "org.springframework.boot,spring-boot-dependencies,4.0.0",
  "com.acme,legacy-broken-lib,2.0.0",
].join("\n");

function terminalJob(): JavaJobModel {
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
  const model = createJavaJobModel(createJavaJob(configuration));
  return {
    ...model,
    status: "RUNNING",
    currentStage: 4,
    currentPhase: "TERMINAL_STAGE_4",
    currentGate: null,
    currentAction: "Run terminal Stage 4 target workflow",
    phaseGates: [],
    terminalStage4: {
      ...model.terminalStage4,
      active: true,
    },
  };
}

test("target-version CSV parser is deterministic and trims values", () => {
  const rows = parseJavaTargetVersionsCsv(
    [
      "groupId,artifactId,targetVersion",
      " org.springframework.boot , spring-boot-dependencies , 4.0.0 ",
      "",
      "org.junit.jupiter,junit-jupiter,6.0.0",
    ].join("\n"),
  );

  assert.deepEqual(rows, [
    {
      groupId: "org.springframework.boot",
      artifactId: "spring-boot-dependencies",
      targetVersion: "4.0.0",
    },
    {
      groupId: "org.junit.jupiter",
      artifactId: "junit-jupiter",
      targetVersion: "6.0.0",
    },
  ]);
});

test("malformed and duplicate target-version rows are rejected", () => {
  assert.throws(
    () => parseJavaTargetVersionsCsv("artifactId,targetVersion\na,1"),
    /header/,
  );
  assert.throws(
    () =>
      parseJavaTargetVersionsCsv(
        "groupId,artifactId,targetVersion\na,b,1\na,b,2",
      ),
    /Duplicate/,
  );
});

test("POM comparison emits only changed dependency versions", () => {
  const rows = parseJavaTargetVersionsCsv(
    [
      "groupId,artifactId,targetVersion",
      "org.mockito,mockito-core,5.18.0",
      "org.junit.jupiter,junit-jupiter,6.0.0",
    ].join("\n"),
  );
  const changes = compareJavaTargetVersions(rows);

  assert.equal(changes.length, 1);
  assert.equal(changes[0]?.artifactId, "junit-jupiter");
  assert.match(renderJavaPomVersionDiff(changes), /5\.12\.2/);
  assert.match(renderJavaPomVersionDiff(changes), /6\.0\.0/);
});

test("terminal target-version validation failure enters AMF-252 repair without a Stage-4 PhaseGate", () => {
  let model = terminalJob();
  const gateCount = model.phaseGates.length;

  model = analyzeJavaTargetVersions(model, REPAIR_CSV);
  model = applyJavaTargetVersionProposal(model);

  assert.equal(model.currentStage, 4);
  assert.equal(model.currentGate, null);
  assert.equal(model.phaseGates.length, gateCount);
  assert.equal(model.terminalStage4.validation, "FAILED");
  assert.equal(model.terminalStage4.targetVersions.status, "REPAIR_READY");
  assert.equal(
    model.terminalStage4.targetVersions.repairAttempts[0]?.status,
    "READY_FOR_APPLY",
  );
});

test("AMF-252 terminal repair validates without creating repair_review", () => {
  let model = terminalJob();
  model = analyzeJavaTargetVersions(model, REPAIR_CSV);
  model = applyJavaTargetVersionProposal(model);
  model = applyJavaTargetVersionRepair(model);

  assert.equal(model.currentGate, null);
  assert.equal(model.phaseGates.length, 0);
  assert.equal(model.terminalStage4.validation, "PASS");
  assert.equal(model.terminalStage4.targetVersions.status, "PASS");
  assert.equal(
    model.terminalStage4.targetVersions.rows.find(
      (row) => row.artifactId === "legacy-broken-lib",
    )?.targetVersion,
    "1.9.9",
  );
  assert.equal(
    model.terminalStage4.targetVersions.repairAttempts[0]?.status,
    "VALIDATED",
  );
});

test("final report stays blocked until a validated Stage-4 output revision is accepted", () => {
  let model = terminalJob();
  model = analyzeJavaTargetVersions(model, GREEN_CSV);
  model = applyJavaTargetVersionProposal(model);

  assert.equal(model.terminalStage4.validation, "PASS");
  assert.equal(isJavaFinalReportEligible(model), false);
  assert.throws(() => generateJavaFinalReport(model), /blocked/);

  model = createJavaStage4OutputRevision(model);
  assert.equal(isJavaFinalReportEligible(model), false);
  assert.equal(
    model.terminalStage4.outputRevisions[0]?.status,
    "READY_FOR_REVIEW",
  );

  model = acceptJavaStage4Output(model, 1);
  assert.equal(model.terminalStage4.acceptedOutputRevision, 1);
  assert.equal(model.finalReport.status, "ELIGIBLE");
  assert.equal(isJavaFinalReportEligible(model), true);
});

test("an open prior PhaseGate still blocks final report eligibility", () => {
  let model = terminalJob();
  model = analyzeJavaTargetVersions(model, GREEN_CSV);
  model = applyJavaTargetVersionProposal(model);
  model = createJavaStage4OutputRevision(model);
  model = {
    ...model,
    phaseGates: [
      {
        id: "prior-open-gate",
        type: "stage_completion_review",
        stage: 3,
        status: "PENDING",
        revision: 1,
        checksum: "a".repeat(64),
        decisions: [],
      },
    ],
  };
  model = acceptJavaStage4Output(model, 1);

  assert.equal(model.finalReport.status, "BLOCKED");
  assert.equal(isJavaFinalReportEligible(model), false);
});

test("generated final report exposes readable markdown, JSON, and CSV artifact content", () => {
  let model = terminalJob();
  model = analyzeJavaTargetVersions(model, GREEN_CSV);
  model = applyJavaTargetVersionProposal(model);
  model = createJavaStage4OutputRevision(model);
  model = acceptJavaStage4Output(model, 1);
  model = generateJavaFinalReport(model);

  assert.equal(model.status, "COMPLETED");
  assert.equal(model.finalReport.status, "GENERATED");
  assert.equal(model.finalReport.artifacts.length, 3);

  const markdown = getJavaReportArtifact(model, "migration-report.md");
  const json = getJavaReportArtifact(model, "stage-4-evidence.json");
  const csv = getJavaReportArtifact(model, "target-version-report.csv");

  assert.match(markdown.content, /Migration Factory Final Report/);
  assert.match(markdown.content, /Accepted Stage 4 output revision: #1/);
  assert.match(json.content, /"validation": "PASS"/);
  assert.match(csv.content, /groupId,artifactId,targetVersion/);
});
