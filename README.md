# Migration Factory Frontend

Standalone Next.js presentation frontend for the Angular and Java / Spring Boot Migration Factory experiences.

## Development

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Architecture

The product shares visual primitives but intentionally keeps Angular and Java workflow state machines independent.

Read:

- `docs/superpowers/specs/2026-08-31-migration-factory-presentation-frontend-design.md`
- `docs/architecture/source-reference-matrix.md`
- `docs/superpowers/plans/2026-08-31-migration-factory-presentation-frontend.md`

The presentation data is deterministic and local to this standalone frontend. Product copy remains normal Migration Factory language; implementation-storage terminology is not exposed in the visible UI.
