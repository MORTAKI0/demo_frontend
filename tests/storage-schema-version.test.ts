import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("browser scenario stores use stack-specific schema keys", () => {
  const angular = readFileSync(
    "src/stacks/angular/scenarios/angular-store.ts",
    "utf8",
  );
  const java = readFileSync(
    "src/stacks/java/scenarios/java-store.ts",
    "utf8",
  );

  assert.match(angular, /migration-factory:angular:v4/);
  assert.doesNotMatch(angular, /migration-factory:angular:v3/);
  assert.match(java, /migration-factory:java:v3/);
});
