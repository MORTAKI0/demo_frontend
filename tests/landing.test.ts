import assert from "node:assert/strict";
import test from "node:test";

import { recentMigrations } from "../src/data/recent-migrations.ts";

test("recent migration deep links stay stack-owned", () => {
  assert.equal(recentMigrations.length, 5);
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


test("landing includes direct presenter links for Java analysis, repair, and terminal report states", () => {
  const hrefs = new Set(recentMigrations.map((migration) => migration.href));
  assert.ok(hrefs.has("/java/migrations/java-order-service"));
  assert.ok(hrefs.has("/java/migrations/java-repair-service"));
  assert.ok(hrefs.has("/java/migrations/java-terminal-service"));
  assert.ok(hrefs.has("/angular/migrations/run-angular-action"));
  assert.ok(hrefs.has("/angular/migrations/run-angular-complete"));
});


test("Angular presenter cards match the Angular 11 CRUD source-grounded scenario", () => {
  const angular = recentMigrations.filter((migration) => migration.stack === "Angular");
  assert.equal(angular.length, 2);
  assert.ok(angular.every((migration) => migration.name === "Angular 11 CRUD Example"));
  assert.ok(angular.every((migration) => migration.route === "Angular 11 → 21"));
});
