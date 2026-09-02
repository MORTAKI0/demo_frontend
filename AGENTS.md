<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework-sensitive code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Migration Factory project rules

- Read `docs/superpowers/specs/2026-08-31-migration-factory-presentation-frontend-design.md` before general workflow work.
- For post-G07 Angular Transformer work, read `docs/superpowers/specs/2026-09-01-proven-transformer-runtime-design.md`; it is the current implementation contract.
- Read `docs/architecture/source-reference-matrix.md` before changing stack behavior.
- Shared UI is presentation-only; never infer next workflow state in shared components.
- Angular and Java have independent domain models/state engines.
- Angular PROVEN gate order is scenario-policy driven; G08 is a real review boundary when the active scenario/plan requires it.
- The persisted reference route uses G07 → transformation → G08 → final validation → G11 direct seal, with G10 only when repair is required.
- G12 candidate promotion belongs only to the policy path that selects candidate promotion; never fabricate promotion on the G11 direct-seal path.
- Java has exactly five PhaseGate types; there is no assessment_review.
- Java Stage 4 is terminal-special and has no normal PhaseGate.
- Never hardcode Angular 18→21 or an always-full Java route.
- Visible UI must not expose mock/fake/demo/simulation/fixture terminology.
- Preserve revision/evidence history; do not overwrite accepted/superseded evidence in scenario state.
- Every wave requires scenario tests, lint/typecheck/build in CI before proceeding.
