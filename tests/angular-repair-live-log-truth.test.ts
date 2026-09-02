import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  "src/stacks/angular/workflow/live-definitions.ts",
  "utf8",
);

test("legacy stage logs do not fabricate an Angular 13 to 14 failure", () => {
  assert.doesNotMatch(source, /source === 13 && target === 14/);
  assert.doesNotMatch(source, /OrderService compatibility expectation failed/);
});

test("Angular 20 to 21 failure logs match the source-backed Jest repair family", () => {
  assert.match(source, /source === 20 && target === 21/);
  assert.match(source, /jest-environment-jsdom/);
  assert.match(source, /setup-jest\.ts/);
  assert.match(source, /jest-preset-angular\/setup-jest/);
});
