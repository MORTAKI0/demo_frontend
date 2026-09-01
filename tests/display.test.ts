import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDuration,
  humanizeIdentifier,
  toneForStatus,
} from "../src/lib/display.ts";

test("status tone keeps operational states semantically distinct", () => {
  assert.equal(toneForStatus("PASSED"), "success");
  assert.equal(toneForStatus("ACTION_REQUIRED"), "warning");
  assert.equal(toneForStatus("FAILED"), "danger");
  assert.equal(toneForStatus("RUNNING"), "info");
  assert.equal(toneForStatus("PENDING"), "neutral");
  assert.equal(toneForStatus("ELIGIBLE"), "success");
  assert.equal(toneForStatus("REPAIR_READY"), "warning");
  assert.equal(toneForStatus("BLOCKED_BY_PROJECT"), "danger");
  assert.equal(toneForStatus("QUALIFIED_WITH_GAPS"), "warning");
  assert.equal(toneForStatus("COVERAGE_GAP"), "warning");
});

test("identifier labels are presentation friendly", () => {
  assert.equal(humanizeIdentifier("analysis_review"), "Analysis Review");
  assert.equal(humanizeIdentifier("stage-completion"), "Stage Completion");
});

test("durations stay compact for cockpit use", () => {
  assert.equal(formatDuration(18), "18s");
  assert.equal(formatDuration(92), "1m 32s");
  assert.equal(formatDuration(4800), "1h 20m");
  assert.equal(formatDuration(-1), "—");
});
