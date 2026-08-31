import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const REQUIRED_ROUTES = [
  "src/app/page.tsx",
  "src/app/loading.tsx",
  "src/app/error.tsx",
  "src/app/angular/migrations/new/page.tsx",
  "src/app/angular/preflights/[preflightId]/page.tsx",
  "src/app/angular/migrations/[runId]/page.tsx",
  "src/app/java/migrations/new/page.tsx",
  "src/app/java/migrations/[jobId]/page.tsx",
  "src/app/java/migrations/[jobId]/artifacts/[artifactId]/page.tsx",
];

const FORBIDDEN_VISIBLE_TERMS = [
  "mock",
  "fake",
  "demo backend",
  "simulation",
  "fixture",
];

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

test("all presentation deep-link route files exist", () => {
  for (const route of REQUIRED_ROUTES) {
    assert.equal(existsSync(route), true, route + " should exist");
  }
});

test("renderable TSX contains no forbidden product terminology", () => {
  const files = walk("src").filter((file) => file.endsWith(".tsx"));
  const violations: string[] = [];

  for (const file of files) {
    const source = readFileSync(file, "utf8").toLowerCase();
    for (const term of FORBIDDEN_VISIBLE_TERMS) {
      if (source.includes(term)) {
        violations.push(file + " contains " + term);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("obsolete bootstrap-only Control Tower components are removed", () => {
  assert.equal(
    existsSync("src/stacks/angular/components/angular-run-bootstrap-page.tsx"),
    false,
  );
  assert.equal(
    existsSync("src/stacks/java/components/java-job-bootstrap-page.tsx"),
    false,
  );
});
