import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync(
  "src/stacks/angular/components/angular-repair-workspace.tsx",
  "utf8",
);

test("repair workspace uses the structured Git diff renderer", () => {
  assert.match(workspaceSource, /GitDiffView/);
  assert.doesNotMatch(
    workspaceSource,
    /<pre[^>]*>[\s\S]*\{attempt\.diff\}[\s\S]*<\/pre>/,
  );
});

test("Git diff renderer exposes hunk rows, line numbers, red deletions, and green additions", () => {
  const path = "src/components/ui/git-diff-view.tsx";
  assert.equal(existsSync(path), true, "GitDiffView component must exist");
  const source = readFileSync(path, "utf8");

  assert.match(source, /data-diff-kind/);
  assert.match(source, /oldLine/);
  assert.match(source, /newLine/);
  assert.match(source, /bg-red-/);
  assert.match(source, /text-red-/);
  assert.match(source, /bg-emerald-/);
  assert.match(source, /text-emerald-/);
  assert.match(source, /kind === "hunk"/);
});
