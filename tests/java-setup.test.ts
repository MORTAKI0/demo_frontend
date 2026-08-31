import assert from "node:assert/strict";
import test from "node:test";

import {
  JAVA_CONTINUATION_POLICIES,
  JAVA_PRE_TRANSFORM_APPROVAL,
  computeJavaRoute,
  createJavaJob,
  prepareJavaMigration,
} from "../src/stacks/java/workflow/setup.ts";

test("Java route keeps included, skipped, and excluded stages separate", () => {
  const route = computeJavaRoute("SB_2_7_J11", "SB_3_5_J21");

  assert.deepEqual(
    route.map((stage) => [stage.stage, stage.disposition]),
    [
      [1, "SKIPPED"],
      [2, "INCLUDED"],
      [3, "INCLUDED"],
      [4, "EXCLUDED"],
    ],
  );
});

test("full Spring Boot 2.1 to 4.0 route includes all four route stages", () => {
  const route = computeJavaRoute("SB_2_1_J11", "SB_4_0_J21");
  assert.ok(route.every((stage) => stage.disposition === "INCLUDED"));
  assert.equal(route[3]?.terminal, true);
});

test("Java route rejects equal or backwards profiles", () => {
  assert.throws(
    () => computeJavaRoute("SB_3_5_J21", "SB_3_5_J21"),
    /after the source/,
  );
  assert.throws(
    () => computeJavaRoute("SB_3_5_J21", "SB_2_7_J11"),
    /after the source/,
  );
});

test("continuation policy enum matches the three Java V2 policies exactly", () => {
  assert.deepEqual(JAVA_CONTINUATION_POLICIES, [
    "AUTO_ON_GREEN",
    "MANUAL",
    "MANUAL_ON_WARNING_OR_FAILURE",
  ]);
});

test("pre-transform approval is scoped and human-required", () => {
  assert.equal(JAVA_PRE_TRANSFORM_APPROVAL, "HUMAN_REQUIRED");
});

test("blocked readiness cannot create a Java job", () => {
  const configuration = prepareJavaMigration({
    name: "Blocked Service",
    sourcePath: "/workspace/blocked/service",
    outputParent: "/workspace/out",
    environmentImport: "Development baseline",
    sourceProfile: "SB_2_1_J11",
    targetProfile: "SB_4_0_J21",
    continuationPolicy: "MANUAL",
    proofLevel: "STRICT",
  });

  assert.equal(configuration.readiness, "BLOCKED");
  assert.throws(() => createJavaJob(configuration), /cannot start/);
});

test("Java job starts with the first included route stage, not a fabricated phase gate", () => {
  const configuration = prepareJavaMigration({
    name: "Order Service",
    sourcePath: "/workspace/order-service",
    outputParent: "/workspace/out",
    environmentImport: "Development baseline",
    sourceProfile: "SB_2_7_J11",
    targetProfile: "SB_3_5_J21",
    continuationPolicy: "MANUAL_ON_WARNING_OR_FAILURE",
    proofLevel: "STRICT",
  });
  const job = createJavaJob(configuration);

  assert.equal(job.currentStage, 2);
  assert.equal(job.currentPhase, "PREFLIGHT");
  assert.equal(job.currentAction, "Run preflight and cancellation checks");
});
