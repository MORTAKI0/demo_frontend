import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  "src/stacks/angular/components/angular-repair-workspace.tsx",
  "utf8",
);

test("repair workspace exposes governed LLM and human-approval roles", () => {
  assert.match(source, /Main Repair LLM/);
  assert.match(source, /Independent Reviewer/);
  assert.match(source, /Candidate diff/);
  assert.match(source, /Reviewed diff/);
  assert.match(source, /Parent attempt/);
  assert.match(source, /G10/);
  assert.match(source, /human approval/i);
  assert.match(source, /reviewer cannot apply/i);
});

test("repair workspace distinguishes dependency operations from source patches", () => {
  assert.match(source, /DEPENDENCY_TRANSITION/);
  assert.match(source, /DEPENDENCY_ADD/);
  assert.match(source, /DEPENDENCY_CHANGE/);
  assert.match(source, /SOURCE_PATCH/);
});


test("repair workspace labels tooling transitions explicitly", () => {
  assert.match(source, /TOOLING_TRANSITION/);
  assert.match(source, /Governed tooling transition/);
});
