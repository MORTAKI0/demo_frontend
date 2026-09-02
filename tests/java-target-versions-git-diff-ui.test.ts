import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync(
  "src/stacks/java/components/java-target-versions-workspace.tsx",
  "utf8",
);

test("Java Stage-4 diff surfaces use GitDiffView for both POM patches", () => {
  assert.match(workspaceSource, /GitDiffView/);
  assert.match(workspaceSource, /<GitDiffView diff=\{target\.diff\} \/>/);
  assert.match(workspaceSource, /<GitDiffView diff=\{attempt\.diff\} \/>/);
  assert.doesNotMatch(
    workspaceSource,
    /<pre[^>]*>[\s\S]*\{(?:target|attempt)\.diff\}[\s\S]*<\/pre>/,
  );
});
