# Migration Factory Presentation Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use Superpowers executing-plans or subagent-driven-development. Every wave ends in an independently reviewable commit.

**Goal:** Implement the approved standalone Next.js presentation frontend for the Angular and Java migration factories with source-faithful independent workflows and deterministic scenario-backed interactions.

**Architecture:** Shared visual primitives render stack-owned projections. Angular and Java each own their domain types, scenario state machine, allowed actions, and workflow projections. Route Handlers are optional API-shaped facades; browser persistence keeps the live presentation deterministic and refresh-safe.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2.8, TypeScript strict, Tailwind CSS 4, Node 24 scenario tests using built-in TypeScript stripping, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-31-migration-factory-presentation-frontend-design.md`

## Global constraints

- Do not display mock/fake/demo/simulation terminology.
- Do not normalize Angular and Java workflow semantics.
- Do not add external dependencies unless the current stack cannot implement the requirement without them.
- Shared components must contain no next-state logic.
- Angular route supports adjacent majors 11–21.
- Angular production auto-approval is absent.
- Angular modern clean completion: G12 → promotion → seal.
- Angular repaired completion: G10 → G11 → G09 → G12 → promotion → seal.
- Java has exactly five PhaseGate types and no assessment gate.
- Java Stage 4 is terminal-special.
- Java route and pipeline remain separate.
- History/revisions remain visible.
- All visible controls work or are intentionally disabled with an explanation.

---

## Task/Wave 0 — Source lock and traceability

**Files**
- Create `docs/superpowers/specs/2026-08-31-migration-factory-presentation-frontend-design.md`
- Create `docs/superpowers/plans/2026-08-31-migration-factory-presentation-frontend.md`
- Create `docs/architecture/source-reference-matrix.md`
- Modify `AGENTS.md`

**Produces**
- frozen source snapshots;
- workflow discrepancy rules;
- source mapping used by later stack engines.

**Verification**
- grep plan/spec for forbidden universal workflow terms;
- source matrix contains Angular gate-order discrepancy and Java Stage-4 rule.

## Task/Wave 1 — Foundation, test harness, CI, design system

**Files**
- Modify `package.json`, `src/app/layout.tsx`, `src/app/globals.css`, `README.md`
- Create `.github/workflows/ci.yml`
- Create `src/components/ui/*`
- Create `src/components/shared/*`
- Create `src/lib/display.ts`
- Create scenario invariant smoke tests.

**Interfaces**
- `StatusBadge({label,tone})`
- `Panel`, `Button`, `Tabs`, `Drawer`, `Dialog`, `Timeline`
- visual-only shared display types.

**TDD**
1. Add Node scenario smoke test command and make it fail on missing modules.
2. Add minimal display helpers/types.
3. Run test; expect pass.
4. Run `npm run lint`, `npm run typecheck`, `npm run build` in CI.
5. Commit Wave 1.

## Task/Wave 2 — Technology selector

**Files**
- Replace `src/app/page.tsx`
- Create `src/components/shared/ProductHeader.tsx`
- Create `src/data/recent-migrations.ts`

**Behavior tests**
- landing model includes Angular and Java cards;
- links point to stack-owned setup routes;
- recent migration links deep-link to valid seeded states.

## Task/Wave 3 — Angular setup + G01

**Files**
- Create `src/stacks/angular/domain/types.ts`
- Create `src/stacks/angular/workflow/setup.ts`
- Create `src/stacks/angular/scenarios/angular-store.ts`
- Create `src/stacks/angular/components/AngularSetupPage.tsx`
- Create `src/stacks/angular/components/AngularG01Page.tsx`
- Create Angular route pages and tests.

**Interfaces**
- `computeAngularRoute(source,target): AngularRouteStep[]`
- `prepareAngularMigration(input): AngularPreflight`
- `applyG01Decision(state, decision): AngularScenarioState`

**TDD cases**
- 11→15 computes 4 adjacent steps;
- invalid/backward target rejected;
- blocked preflight cannot approve;
- approved G01 creates run;
- request modification retains decision history.

## Task/Wave 4 — Angular Control Tower G02–G06

**Files**
- Create Angular run engine/projections.
- Create Overview/Pipeline/Evidence/Diagnostics shell.
- Create gate/baseline/analysis/feasibility/planning components.

**TDD cases**
- G02 staleness invalidates bound approval;
- baseline outcome keeps known-failure classification;
- gate decisions are gate-specific;
- plan revision supersedes old revision without deleting history;
- route timeline has no hardcoded 18→21 assumption.

## Task/Wave 5 — Angular PROVEN execution + repair

**Files**
- Create `src/stacks/angular/workflow/proven.ts`
- Create `src/stacks/angular/workflow/repair.ts`
- Create PROVEN phase/repair components.

**TDD cases**
- runtime certification precedes G07;
- six grouped PROVEN subphases appear;
- clean pass opens G12;
- G12 approval promotes then seals;
- clean path does not require G08/G09;
- causal mismatch rejects attempt without mutating stage;
- repaired pass requires G11 then G09 then G12;
- sealed stage materializes next adjacent stage.

## Task/Wave 6 — Angular diagnostics/recovery/assistant

**Files**
- Create command log/evidence projections;
- create recovery controls;
- create Angular assistant response engine.

**TDD cases**
- partial delivery selects furthest sealed stage only;
- rollback targets sealed predecessor;
- command records preserve authorization/status/log evidence;
- assistant status answer follows current scenario state.

## Task/Wave 7 — Java setup + route

**Files**
- Create Java domain/profile/route/state files.
- Create Java New Migration page/components.

**TDD cases**
- supported profile route returns included/skipped/excluded stages;
- source/target constraints enforced;
- continuation policy enum exact;
- approval mode is scoped to pre-transform approval.

## Task/Wave 8 — Java Cockpit + phase governance

**Files**
- Create Java cockpit state/projection/components.
- Create phase-gate workflow.

**TDD cases**
- route timeline separate from phase pipeline;
- exact five gate types;
- exact per-gate decisions;
- no assessment gate;
- source-profile override creates revision;
- plan revise creates revision;
- continuation policy changes post-stage behavior;
- Stage 4 cannot create a normal PhaseGate.

## Task/Wave 9 — Java repair/assistants/cancellation

**Files**
- Create Java repair engine/components;
- Gate Assistant and Repair Assistant engines;
- cancellation transitions.

**TDD cases**
- gate assistant preview binds checksum;
- checksum change invalidates pending confirmation;
- max repair attempts = 3;
- reviewer/history retained;
- cancellation appears as pipeline phase and cancels active work.

## Task/Wave 10 — Java target versions + terminal report

**Files**
- Create target-version parser/comparison model;
- POM diff/validation presentation;
- terminal Stage 4/final report engine.

**TDD cases**
- CSV target versions parse deterministically;
- changed target version creates POM proposal;
- validation failure enters repair;
- Stage 4 stays terminal-special;
- report blocked until Stage 4 accepted output and no open gates;
- report artifact links return content.

## Task/Wave 11 — Hardening

**Files**
- Add deep-link scenario seeds;
- add reset/reseed control;
- add presenter flow tests;
- improve responsive/accessibility styles;
- add error boundaries/loading states where required.

**Verification**
- full scenario tests;
- lint;
- TypeScript;
- production build;
- browser smoke at desktop widths;
- no console errors;
- no forbidden visible terminology;
- Angular and Java scripts complete repeatedly after reset.

## Commit policy

One wave = one meaningful commit on `feat/presentation-frontend-v1`. Push after each wave. Do not merge to `main` until full CI verification is green.
