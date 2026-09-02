import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTransformerNodeEventSchedule,
} from "../src/stacks/angular/transformer/runtime/event-schedule.ts";
import {
  TRANSFORMER_TIMING_ENVELOPES,
} from "../src/stacks/angular/transformer/domain/timing.ts";

const base = {
  runId: "run-angular-11-21",
  stageId: "stage-11-12",
  attempt: 1,
  timingProfile: "PRESENTATION_REALISTIC" as const,
  runtimeProfileId: "runtime-node12-angular12",
};

test("command event schedules are deterministic, monotonic, and lifecycle-complete", () => {
  const input = { ...base, nodeId: "source_build" };
  const first = buildTransformerNodeEventSchedule(input);
  const second = buildTransformerNodeEventSchedule(input);

  assert.deepEqual(first, second);
  assert.ok(first.length >= 9);

  for (let index = 1; index < first.length; index += 1) {
    assert.ok(first[index].sequence > first[index - 1].sequence);
    assert.ok(first[index].offsetMs > first[index - 1].offsetMs);
    assert.ok(first[index].stateVersion >= first[index - 1].stateVersion);
    assert.ok(first[index].wakeSequence >= first[index - 1].wakeSequence);
  }

  const statuses = first
    .filter((event) => event.kind === "COMMAND_STATUS")
    .map((event) => event.metadata?.status);

  assert.deepEqual(statuses, [
    "QUEUED",
    "AUTHORIZED",
    "CLAIMED",
    "RUNNING",
    "SUCCEEDED",
  ]);

  const authorization = first.find(
    (event) => event.kind === "COMMAND_AUTHORIZATION",
  );
  assert.ok(authorization);
  assert.equal(authorization?.metadata?.shell, false);
  assert.equal(
    authorization?.metadata?.templateId,
    "npm-script-build-production",
  );
  assert.equal(authorization?.metadata?.runtimeProfileId, base.runtimeProfileId);
  assert.ok(authorization?.metadata?.workspaceAlias);
  assert.ok(authorization?.metadata?.timeoutMs);
  assert.ok(authorization?.checksum);

  const terminalIndex = first.findIndex(
    (event) =>
      event.kind === "COMMAND_STATUS" &&
      event.metadata?.status === "SUCCEEDED",
  );
  const lastOutputIndex = first.reduce(
    (last, event, index) =>
      event.kind === "STDOUT" ||
      event.kind === "STDERR" ||
      event.kind === "ARTIFACT"
        ? index
        : last,
    -1,
  );
  assert.ok(lastOutputIndex >= 0);
  assert.ok(terminalIndex > lastOutputIndex);

  const quietGap = first.some(
    (event, index) =>
      index > 0 && event.offsetMs - first[index - 1].offsetMs >= 4_000,
  );
  assert.equal(quietGap, true);
});

test("node context selects source-build versus validation-build timing", () => {
  const source = buildTransformerNodeEventSchedule({
    ...base,
    nodeId: "source_build",
  });
  const validation = buildTransformerNodeEventSchedule({
    ...base,
    nodeId: "validation_build",
  });

  const sourceDuration = source.at(-1)?.offsetMs ?? 0;
  const validationDuration = validation.at(-1)?.offsetMs ?? 0;

  assert.ok(
    sourceDuration >= TRANSFORMER_TIMING_ENVELOPES.SOURCE_BUILD.minMs &&
      sourceDuration <= TRANSFORMER_TIMING_ENVELOPES.SOURCE_BUILD.maxMs,
  );
  assert.ok(
    validationDuration >= TRANSFORMER_TIMING_ENVELOPES.VALIDATION_BUILD.minMs &&
      validationDuration <= TRANSFORMER_TIMING_ENVELOPES.VALIDATION_BUILD.maxMs,
  );

  assert.notEqual(source[0].executionId, validation[0].executionId);
});

test("orchestration nodes emit evidence/state events without fake command lifecycle", () => {
  const schedule = buildTransformerNodeEventSchedule({
    ...base,
    nodeId: "freeze_source_baseline",
  });

  assert.equal(
    schedule.some((event) => event.kind === "COMMAND_STATUS"),
    false,
  );
  assert.equal(schedule[0].kind, "WORKER");
  assert.ok(schedule.some((event) => event.kind === "STATE"));
  assert.ok(schedule.some((event) => event.kind === "ARTIFACT"));
  assert.ok(schedule.at(-1)?.offsetMs);
});
