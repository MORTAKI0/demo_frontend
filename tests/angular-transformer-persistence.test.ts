import assert from "node:assert/strict";
import test from "node:test";

import {
  createTransformerRuntime,
} from "../src/stacks/angular/transformer/runtime/create-runtime.ts";
import {
  deserializeTransformerRuntime,
  serializeTransformerRuntime,
} from "../src/stacks/angular/transformer/runtime/persistence.ts";
import {
  projectTransformerRuntime,
} from "../src/stacks/angular/transformer/runtime/projector.ts";
import {
  applyTransformerGateDecision,
} from "../src/stacks/angular/transformer/runtime/reducer.ts";
import {
  DIRECT_SEAL_GATE_POLICY,
} from "../src/stacks/angular/transformer/domain/scenarios.ts";

const startedAtMs = Date.parse("2026-09-02T00:00:00.000Z");

function runtime() {
  return createTransformerRuntime({
    runId: "run-angular-11-21",
    stageId: "stage-11-12",
    sourceMajor: 11,
    targetMajor: 12,
    timingProfile: "PRESENTATION_REALISTIC",
    scenarioId: "angular-11-12-clean",
    runtimeProfileId: "node12-angular12",
    startedAtMs,
    routeContext: {
      stageIndex: 0,
      stageCount: 10,
      sealedStageCount: 0,
    },
    gatePolicy: DIRECT_SEAL_GATE_POLICY,
    g07Decision: {
      gateId: "G07",
      decision: "APPROVE",
      decidedAt: new Date(startedAtMs).toISOString(),
      packageChecksum: "g07-approved-checksum",
    },
  });
}

test("Transformer persistence stores durable state only, not generated events", () => {
  const current = runtime();
  const withGeneratedEvents = {
    ...current,
    events: [
      {
        sequence: 1,
        kind: "STDOUT",
        message: "must never be persisted",
      },
    ],
  };

  const serialized = serializeTransformerRuntime(withGeneratedEvents);
  const raw = JSON.parse(serialized) as Record<string, unknown>;

  assert.equal("events" in raw, false);
  assert.equal(raw.schemaVersion, "transformer-runtime-v1");
  assert.equal(raw.runId, current.runId);
  assert.equal(raw.stageId, current.stageId);
});

test("Transformer runtime round-trip preserves gate decisions and projection", () => {
  const current = applyTransformerGateDecision(runtime(), {
    gateId: "G08",
    decision: "APPROVE",
    decidedAt: new Date(startedAtMs + 2 * 60 * 60_000).toISOString(),
    packageChecksum: "g08-approved-checksum",
  });

  const restored = deserializeTransformerRuntime(
    serializeTransformerRuntime(current),
  );
  assert.ok(restored);
  assert.equal(restored?.gateDecisions.G08?.decision, "APPROVE");

  const nowMs = startedAtMs + 2 * 60 * 60_000 + 30_000;
  assert.deepEqual(
    projectTransformerRuntime(restored!, {
      nowMs,
      gatePolicy: DIRECT_SEAL_GATE_POLICY,
    }),
    projectTransformerRuntime(current, {
      nowMs,
      gatePolicy: DIRECT_SEAL_GATE_POLICY,
    }),
  );
});

test("unknown or incompatible Transformer persistence fails closed", () => {
  const valid = JSON.parse(
    serializeTransformerRuntime(runtime()),
  ) as Record<string, unknown>;

  assert.equal(
    deserializeTransformerRuntime(
      JSON.stringify({ ...valid, schemaVersion: "transformer-runtime-v0" }),
    ),
    null,
  );
  assert.equal(deserializeTransformerRuntime("{not-json"), null);
  assert.equal(deserializeTransformerRuntime(JSON.stringify({})), null);
});
