import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const agents = readFileSync("AGENTS.md", "utf8");
const matrix = readFileSync(
  "docs/architecture/source-reference-matrix.md",
  "utf8",
);

test("post-G07 Angular authority points to the approved PROVEN Transformer spec", () => {
  assert.match(
    agents,
    /2026-09-01-proven-transformer-runtime-design\.md/,
  );
  assert.match(
    matrix,
    /2026-09-01-proven-transformer-runtime-design\.md/,
  );
});

test("Angular gate documentation is scenario-policy driven", () => {
  assert.match(agents, /G08.*scenario|scenario.*G08/i);
  assert.match(matrix, /G08.*scenario|scenario.*G08/i);

  assert.match(agents, /G11.*direct.*seal|direct.*seal.*G11/i);
  assert.match(matrix, /G11.*direct.*seal|direct.*seal.*G11/i);

  assert.match(agents, /G12.*candidate.*promotion|candidate.*promotion.*G12/i);
  assert.match(matrix, /G12.*candidate.*promotion|candidate.*promotion.*G12/i);

  assert.doesNotMatch(
    agents,
    /Angular modern PROVEN clean completion for the locked snapshot is G12 → promotion → seal/,
  );
  assert.doesNotMatch(
    matrix,
    /clean:\s*G12 → promotion → seal/i,
  );
  assert.doesNotMatch(
    agents,
    /Do not add mandatory G08 to modern Angular presentation/,
  );
});

test("Java workflow constraints remain protected while Angular authority changes", () => {
  assert.match(agents, /Java has exactly five PhaseGate types/);
  assert.match(agents, /Java Stage 4 is terminal-special/);
  assert.match(matrix, /Java terminal rule/);
});
