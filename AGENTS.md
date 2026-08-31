<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework-sensitive code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Migration Factory project rules

- Read `docs/superpowers/specs/2026-08-31-migration-factory-presentation-frontend-design.md` before workflow work.
- Read `docs/architecture/source-reference-matrix.md` before changing stack behavior.
- Shared UI is presentation-only; never infer next workflow state in shared components.
- Angular and Java have independent domain models/state engines.
- Angular modern PROVEN clean completion for the locked snapshot is G12 → promotion → seal.
- Angular repaired completion is G10 → revalidate → G11 → G09 → G12 → promotion → seal.
- Do not add mandatory G08 to modern Angular presentation.
- Java has exactly five PhaseGate types; there is no assessment_review.
- Java Stage 4 is terminal-special and has no normal PhaseGate.
- Never hardcode Angular 18→21 or an always-full Java route.
- Visible UI must not expose mock/fake/demo/simulation/fixture terminology.
- Preserve revision/evidence history; do not overwrite accepted/superseded evidence in scenario state.
- Every wave requires scenario tests, lint/typecheck/build in CI before proceeding.
