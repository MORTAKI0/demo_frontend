import assert from "node:assert/strict";
import test from "node:test";

import { recentMigrations } from "../src/data/recent-migrations.ts";

test("recent migration deep links stay stack-owned", () => {
  assert.equal(recentMigrations.length, 3);
  for (const migration of recentMigrations) {
    const expectedPrefix = migration.stack === "Angular" ? "/angular/" : "/java/";
    assert.ok(migration.href.startsWith(expectedPrefix));
  }
});

test("landing scenarios include action-required, running, and completed examples", () => {
  assert.deepEqual(
    new Set(recentMigrations.map((migration) => migration.status)),
    new Set(["ACTION_REQUIRED", "RUNNING", "COMPLETED"]),
  );
});
