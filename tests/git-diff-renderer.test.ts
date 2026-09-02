import assert from "node:assert/strict";
import test from "node:test";

import { parseUnifiedDiff } from "../src/components/ui/git-diff.tsx";

const SAMPLE = [
  "diff --git a/src/app/example.ts b/src/app/example.ts",
  "index 1111111..2222222 100644",
  "--- a/src/app/example.ts",
  "+++ b/src/app/example.ts",
  "@@ -10,3 +10,4 @@ export function example() {",
  "   const stable = true;",
  "-  const legacy = true;",
  "+  const current = true;",
  "+  const added = true;",
  " }",
].join("\n");

test("unified diff parser preserves git file headers, hunks, and line kinds", () => {
  const parsed = parseUnifiedDiff(SAMPLE);

  assert.equal(parsed.files.length, 1);
  assert.equal(parsed.files[0]?.oldPath, "src/app/example.ts");
  assert.equal(parsed.files[0]?.newPath, "src/app/example.ts");

  assert.deepEqual(
    parsed.files[0]?.lines.map((line) => line.kind),
    [
      "meta",
      "old-file",
      "new-file",
      "hunk",
      "context",
      "deletion",
      "addition",
      "addition",
      "context",
    ],
  );
});

test("unified diff parser tracks old and new line numbers across a hunk", () => {
  const parsed = parseUnifiedDiff(SAMPLE);
  const lines = parsed.files[0]?.lines ?? [];

  const deletion = lines.find((line) => line.kind === "deletion");
  const additions = lines.filter((line) => line.kind === "addition");
  const context = lines.find((line) => line.kind === "context");

  assert.deepEqual(
    { old: deletion?.oldLine, next: deletion?.newLine },
    { old: 11, next: undefined },
  );
  assert.deepEqual(
    additions.map((line) => ({ old: line.oldLine, next: line.newLine })),
    [
      { old: undefined, next: 11 },
      { old: undefined, next: 12 },
    ],
  );
  assert.deepEqual(
    { old: context?.oldLine, next: context?.newLine },
    { old: 10, next: 10 },
  );
});
