import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync(
  "src/stacks/java/components/java-repair-workspace.tsx",
  "utf8",
);

test("Java repair workspace uses the structured Git diff renderer", () => {
  assert.match(workspaceSource, /GitDiffView/);
  assert.doesNotMatch(
    workspaceSource,
    /<pre[^>]*>[\s\S]*\{attempt\.diff\}[\s\S]*<\/pre>/,
  );
});
