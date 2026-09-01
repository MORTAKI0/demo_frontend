import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createJavaJob,
  prepareJavaMigration,
} from "../src/stacks/java/workflow/setup.ts";
import { createJavaJobModel } from "../src/stacks/java/workflow/cockpit.ts";
import { ensureJavaLiveExecution } from "../src/stacks/java/workflow/live.ts";
import { cancelJavaMigration } from "../src/stacks/java/workflow/cancellation.ts";

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

test("Java cancellation clears any active live execution immediately", () => {
  const running = ensureJavaLiveExecution(javaJob(), 1_900_000_000_000);
  assert.equal(running.liveExecution?.status, "RUNNING");

  const cancelled = cancelJavaMigration(running);

  assert.equal(cancelled.status, "CANCELLED");
  assert.equal(cancelled.liveExecution, undefined);
});

test("Angular current execution copy explicitly handles live execution before target-complete fallback", () => {
  const source = readFileSync(
    new URL(
      "../src/stacks/angular/components/angular-current-action.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /run\.liveExecution/);
  assert.match(
    source,
    /Execution is active.*next governed review boundary/s,
  );
});

test("live execution graph keeps runtime metadata visible after a step passes", () => {
  const source = readFileSync(
    new URL(
      "../src/components/shared/live-execution-panel.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /step\.status !== "PENDING"/);
  assert.doesNotMatch(
    source,
    /step\.status === "RUNNING"\s*&&\s*\(step\.provider \|\| step\.command\)/,
  );
});
