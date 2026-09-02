import assert from "node:assert/strict";
import test from "node:test";

import {
  createTransformerRuntime,
} from "../src/stacks/angular/transformer/runtime/create-runtime.ts";
import {
  applyTransformerGateDecision,
} from "../src/stacks/angular/transformer/runtime/reducer.ts";
import {
  projectTransformerRuntime,
} from "../src/stacks/angular/transformer/runtime/projector.ts";
import {
  DIRECT_SEAL_GATE_POLICY,
  CANDIDATE_PROMOTION_GATE_POLICY,
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

test("far-future wall clock hard-stops at unresolved G08", () => {
  const current = runtime();
  const projection = projectTransformerRuntime(current, {
    nowMs: startedAtMs + 2 * 60 * 60_000,
    gatePolicy: DIRECT_SEAL_GATE_POLICY,
  });

  assert.equal(projection.activeGate, "G08");
  assert.equal(projection.status, "WAITING_GATE");
  assert.ok(projection.completedNodeIds.includes("freeze_target_authority"));
  assert.equal(
    projection.completedNodeIds.includes("create_validation_generation"),
    false,
  );
  assert.equal(
    projection.events.some(
      (event) =>
        event.kind === "GATE" && event.metadata?.gateId === "G08",
    ),
    true,
  );
});

test("persisted G08 approval resumes from the boundary without counting human wait", () => {
  const current = runtime();
  const waiting = projectTransformerRuntime(current, {
    nowMs: startedAtMs + 2 * 60 * 60_000,
    gatePolicy: DIRECT_SEAL_GATE_POLICY,
  });
  assert.equal(waiting.activeGate, "G08");

  const decidedAtMs = startedAtMs + 2 * 60 * 60_000;
  const approved = applyTransformerGateDecision(current, {
    gateId: "G08",
    decision: "APPROVE",
    decidedAt: new Date(decidedAtMs).toISOString(),
    packageChecksum: "g08-approved-checksum",
  });

  const immediatelyAfter = projectTransformerRuntime(approved, {
    nowMs: decidedAtMs + 1_000,
    gatePolicy: DIRECT_SEAL_GATE_POLICY,
  });
  assert.equal(immediatelyAfter.activeGate, undefined);
  assert.equal(
    immediatelyAfter.completedNodeIds.includes("validation_install"),
    false,
  );

  const later = projectTransformerRuntime(approved, {
    nowMs: decidedAtMs + 20 * 60_000,
    gatePolicy: DIRECT_SEAL_GATE_POLICY,
  });
  assert.equal(later.activeGate, "G11");
  assert.equal(
    later.completedNodeIds.includes("aggregate_proven_validation"),
    true,
  );
  assert.equal(
    later.events.some(
      (event) =>
        event.kind === "GATE" && event.metadata?.gateId === "G12",
    ),
    false,
  );
});

test("projection is refresh-safe and progress is completed-node weighted", () => {
  const current = runtime();
  const nowMs = startedAtMs + 90_000;
  const first = projectTransformerRuntime(current, {
    nowMs,
    gatePolicy: DIRECT_SEAL_GATE_POLICY,
  });
  const recreated = structuredClone(current);
  const second = projectTransformerRuntime(recreated, {
    nowMs,
    gatePolicy: DIRECT_SEAL_GATE_POLICY,
  });

  assert.deepEqual(first, second);
  assert.ok(first.stageProgressPercent >= 0);
  assert.ok(first.stageProgressPercent <= 100);
  assert.deepEqual(first.routeProgress, {
    sealedStages: 0,
    totalStages: 10,
  });

  const elapsedPercent = Math.round(
    (first.effectiveElapsedMs / first.uninterruptedStageDurationMs) * 100,
  );
  assert.notEqual(first.stageProgressPercent, elapsedPercent);

  for (let index = 1; index < first.events.length; index += 1) {
    assert.ok(first.events[index].sequence > first.events[index - 1].sequence);
    assert.ok(
      first.events[index].stateVersion >= first.events[index - 1].stateVersion,
    );
    assert.ok(
      first.events[index].wakeSequence >= first.events[index - 1].wakeSequence,
    );
  }
});

test("gate projection follows the selected scenario policy", () => {
  const direct = projectTransformerRuntime(runtime(), {
    nowMs: startedAtMs + 2 * 60 * 60_000,
    gatePolicy: DIRECT_SEAL_GATE_POLICY,
  });
  assert.equal(
    direct.events.some(
      (event) =>
        event.kind === "GATE" && event.metadata?.gateId === "G12",
    ),
    false,
  );

  const candidateRuntime = createTransformerRuntime({
    ...runtime(),
    id: undefined,
    gatePolicy: CANDIDATE_PROMOTION_GATE_POLICY,
  });
  assert.equal(
    candidateRuntime.gatePolicyId,
    CANDIDATE_PROMOTION_GATE_POLICY.id,
  );
});


test("PRESENTATION_REALISTIC clean direct stage stays within 4–8 minutes", () => {
  const projection = projectTransformerRuntime(runtime(), {
    nowMs: startedAtMs,
    gatePolicy: DIRECT_SEAL_GATE_POLICY,
  });

  assert.ok(
    projection.uninterruptedStageDurationMs >= 4 * 60_000,
    `clean stage must be at least 4 minutes, got ${projection.uninterruptedStageDurationMs}ms`,
  );
  assert.ok(
    projection.uninterruptedStageDurationMs <= 8 * 60_000,
    `clean stage must be at most 8 minutes, got ${projection.uninterruptedStageDurationMs}ms`,
  );
});
