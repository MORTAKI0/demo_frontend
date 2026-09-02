import assert from "node:assert/strict";
import test from "node:test";

import {
  CLEAN_STAGE_CORE_TIMING_OPERATIONS,
  TRANSFORMER_TIMING_ENVELOPES,
  deterministicDurationMs,
} from "../src/stacks/angular/transformer/domain/timing.ts";
import {
  TRANSFORMER_COMMAND_CATALOGUE,
} from "../src/stacks/angular/transformer/data/command-catalogue.ts";
import {
  deterministicTransformerId,
} from "../src/stacks/angular/transformer/runtime/identity.ts";

const seed = {
  runId: "run-angular-11-21",
  stageId: "stage-11-12",
  nodeId: "source_build",
  attempt: 1,
  timingProfile: "PRESENTATION_REALISTIC" as const,
};

test("Transformer timing and IDs are deterministic from durable identity", () => {
  const duration = deterministicDurationMs(seed, "SOURCE_BUILD");
  assert.equal(duration, deterministicDurationMs(seed, "SOURCE_BUILD"));

  const executionId = deterministicTransformerId("execution", seed);
  assert.equal(executionId, deterministicTransformerId("execution", seed));
  assert.match(executionId, /^execution-[a-f0-9]{12}$/);

  const changed = {
    ...seed,
    nodeId: "source_test",
  };
  assert.notEqual(
    deterministicTransformerId("execution", seed),
    deterministicTransformerId("execution", changed),
  );
});

test("approved presentation timing envelopes remain meaningful per operation", () => {
  assert.deepEqual(TRANSFORMER_TIMING_ENVELOPES.SOURCE_INSTALL, {
    minMs: 35_000,
    maxMs: 60_000,
  });
  assert.deepEqual(TRANSFORMER_TIMING_ENVELOPES.SOURCE_BUILD, {
    minMs: 25_000,
    maxMs: 45_000,
  });
  assert.deepEqual(TRANSFORMER_TIMING_ENVELOPES.SOURCE_TEST, {
    minMs: 20_000,
    maxMs: 40_000,
  });
  assert.deepEqual(TRANSFORMER_TIMING_ENVELOPES.DISCOVERY, {
    minMs: 30_000,
    maxMs: 55_000,
  });
  assert.deepEqual(TRANSFORMER_TIMING_ENVELOPES.LOCK_GENERATION, {
    minMs: 25_000,
    maxMs: 45_000,
  });
  assert.deepEqual(TRANSFORMER_TIMING_ENVELOPES.TARGET_INSTALL, {
    minMs: 35_000,
    maxMs: 65_000,
  });
  assert.deepEqual(TRANSFORMER_TIMING_ENVELOPES.VALIDATION_INSTALL, {
    minMs: 35_000,
    maxMs: 65_000,
  });
  assert.deepEqual(TRANSFORMER_TIMING_ENVELOPES.VALIDATION_BUILD, {
    minMs: 30_000,
    maxMs: 55_000,
  });
  assert.deepEqual(TRANSFORMER_TIMING_ENVELOPES.VALIDATION_TEST, {
    minMs: 25_000,
    maxMs: 50_000,
  });

  for (const [operation, envelope] of Object.entries(
    TRANSFORMER_TIMING_ENVELOPES,
  )) {
    const selected = deterministicDurationMs(seed, operation as keyof typeof TRANSFORMER_TIMING_ENVELOPES);
    assert.ok(selected >= envelope.minMs, operation);
    assert.ok(selected <= envelope.maxMs, operation);
  }

  const minimumCoreDuration = CLEAN_STAGE_CORE_TIMING_OPERATIONS.reduce(
    (total, operation) => total + TRANSFORMER_TIMING_ENVELOPES[operation].minMs,
    0,
  );
  assert.ok(minimumCoreDuration >= 4 * 60_000);
});

test("Transformer command catalogue is structured and never raw-shell authority", () => {
  const required = [
    "npm-ci-bootstrap",
    "npm-ci-final",
    "npm-dependency-tree",
    "npm-lockfile-generate",
    "angular-update-discovery",
    "angular-cli-authority-version",
    "angular-version-verify",
    "npm-script-build-production",
    "npm-script-test-ci",
    "npm-dependency-materialize",
    "npm-angular-lockfile-normalize",
    "npm-dependency-uninstall",
    "npm-dependency-install",
    "angular-migrate-installed",
    "angular-migrate-range-v2",
    "angular-migrate-name-v2",
    "npm-script-lint",
  ];

  const ids = TRANSFORMER_COMMAND_CATALOGUE.map((command) => command.commandId);
  for (const commandId of required) {
    assert.ok(ids.includes(commandId), commandId);
  }

  for (const command of TRANSFORMER_COMMAND_CATALOGUE) {
    assert.equal(command.shell, false);
    assert.ok(command.templateId);
    assert.ok(command.timeoutMs > 0);
    assert.ok(command.workspaceAliasClass);
    assert.ok(command.networkPolicy);
    assert.ok(command.timingOperation);
  }
});
