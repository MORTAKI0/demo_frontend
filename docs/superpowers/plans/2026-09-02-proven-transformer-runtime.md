# PROVEN Transformer Runtime — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` when subagents are available; otherwise use `superpowers:executing-plans`. Every behavior change follows `superpowers:test-driven-development`, and every completion claim follows `superpowers:verification-before-completion`.

**Goal:** Replace the coarse post-G07 Angular stage animation with the deterministic, event-driven PROVEN Transformer presentation runtime approved in the 2026-09-01 design, while preserving the existing pre-transform Angular workflow and the Java workflow.

**Architecture:** Introduce an Angular-only `src/stacks/angular/transformer/` domain/data/runtime/component boundary. Durable browser state stores only runtime identity, cursor, gate decisions, repair lineage, and cancellation state. Ordered events, command state, workflow progress, and operator projections are regenerated deterministically from the scenario definition. The existing generic `LiveExecution` remains authoritative for G03/G04/G05/G06, stage preparation, and Java; it stops being Angular transformation authority only after the new runtime vertical slice is proven.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, TypeScript 5.x, Node built-in test runner with `--experimental-strip-types`, ESLint 9, browser localStorage scenario persistence, GitHub Actions CI on Node 24.

**Spec:** `docs/superpowers/specs/2026-09-01-proven-transformer-runtime-design.md`

**Frontend baseline:** `MORTAKI0/demo_frontend@1deeb38dd24e2c6606f33995871aa7bcc7c205bb`

**Backend authority:** `Ali-Hamdaoui/angular-migration@02e4c75e4dc15ad1d54bd2df35ed511043700abd` on branch `v2.3`

**Demo application evidence:** `cornflourblue/angular-11-crud-example@eda3cf6278c02e4fb65f91ec73a9281d4325514e`

## Global constraints

- Work only on `feat/proven-transformer-runtime` until integration is explicitly chosen.
- Never perform a migration against the CRUD source repository and never mutate its source authority.
- Do not connect this presentation frontend to the production Migration Factory or its SQLite database.
- Do not run arbitrary commands from scenario/LLM data. Commands are structured catalogue data only and always expose `shell: false`.
- LLMs are evidence-producing/review actors, never execution authority.
- Keep generic `LiveExecution` for G03/G04/G05/G06, Angular stage preparation, and all Java behavior.
- Do not collapse current PROVEN execution into one generic `ng update Angular X → Y` command.
- Discovery generations are disposable; authoritative target/validation/sealed generations are distinct.
- Stage progress is node-weighted. Route progress is sealed-stage based. Commands never receive invented percentage completion.
- Wall-clock catch-up can advance ordinary nodes but cannot cross G07/G08/G09/G10/G11/G12 without a persisted decision.
- Gate routes are scenario-policy-driven. G11 direct-seal must not fabricate candidate promotion. G12 promotion must satisfy its promotion preconditions before seal.
- Failure evidence precedes failure ownership. Dependency/lock/runtime/platform failures do not default to Main Repair LLM.
- Sealed Transformer completion is not delivery.
- Do not persist hundreds of generated events; regenerate them deterministically.
- Update `docs/architecture/source-reference-matrix.md` whenever stack behavior changes.
- Avoid new abstraction layers unless they have a current concrete use.

## Source-truth precondition

The current `AGENTS.md` and `docs/architecture/source-reference-matrix.md` still contain an older Angular rule that says G08 is not part of modern PROVEN presentation and treats G12 promotion as universal. That conflicts with the later approved spec and the locked v2.3 audit. Before runtime integration, correct those two documents so contributors cannot follow stale gate semantics.

---

# Wave 1 — Runtime foundation

## Task 1: Align repository instructions with the approved Transformer authority

**Files**
- Modify: `AGENTS.md`
- Modify: `docs/architecture/source-reference-matrix.md`
- Create: `tests/angular-transformer-source-truth.test.ts`

**RED**
1. Add a test that reads both files and asserts:
   - the 2026-09-01 PROVEN Transformer spec is the current post-G07 authority;
   - G08 is supported as a real scenario-policy boundary;
   - G11 direct-seal and G12 candidate-promotion are separate policy paths;
   - no text states that G12 promotion is universally required;
   - Java rules remain unchanged.
2. Run the focused test and confirm it fails against the stale docs.

**GREEN**
3. Update `AGENTS.md` minimally:
   - require reading the 2026-09-01 Transformer spec for post-G07 Angular work;
   - preserve the old design spec for general product/Java context;
   - replace the stale universal gate statements with scenario-policy wording;
   - retain every Java constraint.
4. Update the Angular discrepancy section in the source-reference matrix to point at the newer locked source audit and distinguish:
   - persisted reference route: G07 → G08 → [G10 when needed] → G11 → seal;
   - alternate G09/G12 promotion path selected only by plan/policy.
5. Run the focused test, then full `npm test`.

**Commit:** `docs: align Transformer gate authority`

## Task 2: Define closed Transformer domain contracts and the complete PROVEN node catalogue

**Files**
- Create: `src/stacks/angular/transformer/domain/types.ts`
- Create: `src/stacks/angular/transformer/domain/events.ts`
- Create: `src/stacks/angular/transformer/domain/gates.ts`
- Create: `src/stacks/angular/transformer/domain/scenarios.ts`
- Create: `src/stacks/angular/transformer/data/node-catalogue.ts`
- Create: `tests/angular-transformer-domain.test.ts`

**Contracts**
- `TransformerTimingProfileId = "PRESENTATION_REALISTIC" | "REFERENCE_E2E_SCALE"`
- `TransformerPhaseId` for seven main groups plus contextual `REPAIR`.
- `TransformerGateId = "G07" | "G08" | "G09" | "G10" | "G11" | "G12"`.
- `TransformerRuntimeStatus` includes running/waiting-gate/waiting-repair/blocked/sealed/completed/cancelled.
- `TransformerCommandStatus` exactly covers QUEUED → AUTHORIZED → CLAIMED → RUNNING → terminal.
- `TransformerEventKind` exactly matches the approved event vocabulary.
- `TransformerRuntime` stores durable cursor/state and references, not an event array.
- Scenario gate policy explicitly represents direct-seal vs candidate-promotion routes.

**Node catalogue**
Represent each locked `ProvenTransformationNode` exactly once:
- stage/start: select_run_mode, prepare_stage_layout
- source baseline: create_source_baseline through freeze_source_baseline
- discovery: create_discovery_generation through discard_discovery
- target/materialization: create_authoritative_target through target_version_proof
- migration owners: inspect_migration_metadata through freeze_target_authority
- validation: create_validation_generation through aggregate_proven_validation
- post-validation: promotion_pending, promote_validated

Every entry has: id, phase, label, workflow weight, operation kind, and optional command reference. No duplicate node IDs.

**RED**
1. Test exact node set equality against a frozen expected list from the locked backend.
2. Test every node maps to exactly one phase.
3. Test phase weights total 100 across the seven primary groups.
4. Test scenario policy can express G11 direct-seal without G12 and G12 promotion without inventing candidate promotion on the direct path.

**GREEN**
5. Implement the minimum closed types and catalogue needed for those tests.

**Commit:** `feat: add Transformer domain and node catalogue`

## Task 3: Add the structured command catalogue and deterministic timing/identity primitives

**Files**
- Create: `src/stacks/angular/transformer/data/command-catalogue.ts`
- Create: `src/stacks/angular/transformer/domain/timing.ts`
- Create: `src/stacks/angular/transformer/runtime/identity.ts`
- Create: `tests/angular-transformer-timing.test.ts`

**Command catalogue**
Include only structured commands needed by current PROVEN nodes, using source-backed IDs such as:
- npm-ci-bootstrap / npm-ci-final
- npm-dependency-tree
- npm-lockfile-generate
- angular-update-discovery
- angular-cli-authority-version
- angular-version-verify
- angular-migrate-installed / angular-migrate-range
- npm-script-build-production
- npm-script-test-ci
- npm-script-lint when configured
- dependency materialize/install/uninstall commands for later repair use

Each command records commandId, templateId, display label, `shell: false`, timeout, workspace alias class, network policy, and timing operation class. Scenario content never provides a free-form executable.

**Timing**
- Freeze the approved presentation envelopes.
- Deterministic duration input is exactly `runId + stageId + nodeId + attempt + timingProfile`.
- Use a pure deterministic hash suitable for browser and Node tests; no `Math.random`, dates, or process state.
- Non-command orchestration nodes receive bounded deterministic control-plane durations so the entire clean stage remains several minutes.
- Expose typical range separately from chosen deterministic duration.

**RED**
1. Same seed returns same duration and IDs.
2. Changing stage/node/attempt may change output while remaining inside the correct envelope.
3. npm ci/build/test each have independent meaningful windows.
4. All commands have `shell === false` and non-empty template IDs.
5. Default clean-stage command windows cannot collapse to ~30 seconds.

**GREEN**
6. Implement timing and identity primitives only.

**Commit:** `feat: add deterministic Transformer timing and commands`

## Task 4: Generate ordered deterministic command/event schedules

**Files**
- Create: `src/stacks/angular/transformer/runtime/event-schedule.ts`
- Create: `tests/angular-transformer-events.test.ts`

**Behavior**
- Generate explicit events with deterministic offsets, sequence, stateVersion, wakeSequence, executionId, commandId/templateId, and metadata.
- Commands visibly emit QUEUED → AUTHORIZED → CLAIMED → RUNNING → terminal.
- STDOUT/STDERR/artifact/fingerprint events occur at non-uniform offsets with quiet intervals.
- Terminal command status occurs only after the final command output/artifact event.
- No event derives visibility from elapsed-percent log slicing.

**RED**
1. Identical inputs generate byte-for-byte equivalent schedules.
2. Sequence, offsets, stateVersion, and wakeSequence are monotonic.
3. Command lifecycle ordering is exact.
4. Final command status follows all output.
5. Different nodes cannot reuse execution IDs.
6. Authorization events include shell=false/template/workspace/runtime/timeout/checksum metadata.

**GREEN**
7. Implement the smallest event-template builder supporting orchestration nodes and structured command nodes.

**Commit:** `feat: add deterministic Transformer event schedules`

## Task 5: Create runtime, reducer, gate boundaries, and time projector

**Files**
- Create: `src/stacks/angular/transformer/runtime/create-runtime.ts`
- Create: `src/stacks/angular/transformer/runtime/reducer.ts`
- Create: `src/stacks/angular/transformer/runtime/gate-boundaries.ts`
- Create: `src/stacks/angular/transformer/runtime/projector.ts`
- Create: `tests/angular-transformer-runtime.test.ts`

**Behavior**
- `createTransformerRuntime()` creates durable runtime identity/cursor with G07 already persisted when invoked from the eventual post-G07 integration.
- Reducer accepts persisted human decisions, cancellation, and deterministic runtime cursor transitions.
- Projector calculates visible events and current node from `startedAtMs + accumulatedMs + nowMs`.
- The projector advances through ordinary nodes but hard-stops at the next required unresolved human boundary.
- Stage progress uses completed node weights, not elapsed percentage.
- Route progress uses sealed stage count supplied by route context.
- Current command is derived from projected events and command lifecycle, not separately invented state.

**RED**
1. A far-future `nowMs` cannot project beyond unresolved G08.
2. Persisting G08 approval allows projection to continue.
3. Same durable runtime + same `nowMs` yields the same projection after recreation.
4. Node-weighted stage progress differs from elapsed-time percentage.
5. No gate is generated when scenario policy does not require it.
6. State/wake/event counters remain monotonic across projection.

**GREEN**
7. Implement pure reducer/projector functions. No React or browser storage yet.

**Commit:** `feat: add Transformer runtime projector and human boundaries`

## Task 6: Persist durable Transformer state and bump the Angular storage schema

**Files**
- Create: `src/stacks/angular/transformer/runtime/persistence.ts`
- Modify: `src/stacks/angular/scenarios/angular-store.ts`
- Modify: `tests/storage-schema-version.test.ts`
- Create: `tests/angular-transformer-persistence.test.ts`

**Behavior**
- New Angular storage key: `migration-factory:angular:v4`.
- Persist only durable Transformer state: runtime/stage/scenario/profile IDs, started/accumulated time, cursor, gate decisions, repair lineage, cancellation, sealed-stage references.
- Generated event arrays are rejected/stripped from persistence.
- Existing v3 transformation state is intentionally not coerced into the new runtime.
- Pre-transform run seeds remain valid through normal model creation.

**RED**
1. Storage schema test expects Angular v4 while Java remains v3.
2. Serialized Transformer runtime contains no `events` collection.
3. Round-trip produces an equivalent projector result at the same nowMs.
4. Gate decisions survive round-trip.
5. Incompatible/unknown persisted runtime schema fails closed to a safe fresh runtime state.

**GREEN**
6. Implement serialization guards and minimal store integration without replacing Angular transformation UI yet.

**Verification checkpoint for Wave 1**
- Full `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- GitHub Actions must be green on the exact Wave 1 branch HEAD.
- Review diff against Sections 5, 8–10, 29, 33, 36.1, 36.3, 36.6, 39, 40 of the approved spec.

---

# Wave 2 — One clean PROVEN 11→12 stage end-to-end

## Task 7: Add the primary scenario/cohort and source-backed clean 11→12 stage definition

**Files**
- Create: `src/stacks/angular/transformer/data/cohorts.ts`
- Create: `src/stacks/angular/transformer/data/scenarios.ts`
- Modify: `src/stacks/angular/transformer/domain/scenarios.ts`
- Create: `tests/angular-transformer-clean-stage.test.ts`

**Behavior**
- Bind Angular 11.0.4 source facts and exact 11→12 target cohort from approved compatibility/planning evidence.
- Define discovered migration-owner metadata as scenario data, not component constants.
- Define direct-seal reference/current policy and alternate G12 promotion policy separately.
- Source baseline → disposable discovery → target materialization → migration ledger → G08 → validation → post-validation authority → seal.

**TDD assertions**
- G07 cannot instantly reach G08.
- Discovery generation is disposable and not target authority.
- Lock generation is a first-class command before target npm ci.
- G08 pauses after target/migration evidence.
- G08 approval starts validation.
- G11 direct-seal scenario produces no promotion event/artifact.
- Seal occurs only after sealing steps complete.

**Commit:** `feat: add clean Angular 11 to 12 Transformer scenario`

## Task 8: Integrate Transformer runtime into Angular run state without changing pre-transform authority

**Files**
- Modify: `src/stacks/angular/domain/run-types.ts`
- Modify: `src/stacks/angular/workflow/proven.ts`
- Modify: `src/stacks/angular/workflow/live.ts`
- Modify: `src/stacks/angular/workflow/run.ts`
- Modify: `src/stacks/angular/scenarios/angular-store.ts`
- Modify: `tests/angular-proven.test.ts`
- Modify: `tests/live-workflow.test.ts`

**Behavior**
- Add G08 to stage-gate vocabulary.
- Add optional `transformerRuntime` durable state to `AngularRunModel`.
- G07 approval creates Transformer runtime instead of `STAGE_EXECUTION` LiveExecution.
- Remove `STAGE_EXECUTION` and `REPAIR_VALIDATION` as Angular stage authority once all transformed call sites are migrated.
- Keep BASELINE/ANALYSIS/FEASIBILITY/PLANNING/STAGE_PREPARATION generic live execution unchanged.
- New advance function projects Transformer state and maps only actual boundaries back into Angular run currentGate/currentAction.
- Do not auto-approve gates.

**Commit:** `feat: route Angular G07 into Transformer runtime`

## Task 9: Complete clean-stage gate/seal state mapping

**Files**
- Create: `src/stacks/angular/transformer/runtime/sealing-runtime.ts`
- Modify: `src/stacks/angular/workflow/proven.ts`
- Modify: `src/stacks/angular/domain/run-types.ts`
- Create/modify tests for clean stage

**Behavior**
- G08 approval resumes validation.
- Direct-seal policy opens G11 and then performs explicit seal sequence.
- Alternate promotion policy can wait at G09/G12 but does not become default unless scenario says so.
- Sealed output records generation/fingerprint/checkpoint/previous chain hash/stage chain checksum.
- Only after seal can route status become SEALED.

**Commit:** `feat: map Transformer validation and seal boundaries`

**Wave 2 checkpoint:** full CI and targeted review; no UI redesign yet.

---

# Wave 3 — Operator UI

## Task 10: Build Current Stage and phase disclosure surfaces

**Files**
- Create under `src/stacks/angular/transformer/components/`:
  - `current-stage-card.tsx`
  - `stage-phase-stack.tsx`
  - `phase-disclosure.tsx`
  - `backend-node-row.tsx`
  - `command-execution-card.tsx`
  - `command-authorization.tsx`
- Modify: `src/stacks/angular/components/angular-proven-execution.tsx`
- Modify: `src/stacks/angular/components/angular-pipeline.tsx`
- Add source-text/domain projection tests before component implementation.

**Behavior**
Active phase expanded; completed phases collapsed; command shows lifecycle/elapsed/typical window but no percentage.

**Commit:** `feat: add Transformer current-stage operator surface`

## Task 11: Add event/evidence/version/workspace/migration projections

**Files**
- Create:
  - `transformer-event-stream.tsx`
  - `evidence-feed.tsx`
  - `workspace-lineage.tsx`
  - `version-proof.tsx`
  - `dependency-closure.tsx`
  - `migration-ledger.tsx`
  - `diagnostic-delta.tsx`
  - `post-validation-authority-panel.tsx`
  - `seal-summary.tsx`
- Modify Angular evidence/diagnostics workspaces only to consume projections, never infer state.

**Commit:** `feat: expose Transformer evidence and lineage`

## Task 12: Implement Follow Live without fighting user inspection

**Files**
- Create: `follow-live-control.tsx`
- Create: `src/stacks/angular/transformer/runtime/follow-live.ts`
- Modify: `angular-control-tower-page.tsx`
- Add UI behavior tests/source regressions.

**Behavior**
Follow Live on by default; manual history interaction pauses; resume targets current execution; log viewport follows independently; gate focus overrides command focus.

**Commit:** `feat: add Transformer follow-live behavior`

---

# Wave 4 — Full 11→21 route and sealed-stage chain

## Task 13: Populate adjacent-major cohorts and scenario stages

**Files**
- Extend: `data/cohorts.ts`, `data/scenarios.ts`
- Add route tests covering 11→12 through 20→21.

No hardcoded full route inside reusable runtime logic; route comes from scenario/run plan.

**Commit:** `feat: add Angular 11 to 21 Transformer cohorts`

## Task 14: Derive next stage from sealed predecessor

**Files**
- Create: `runtime/next-stage.ts`
- Modify: `workflow/proven.ts` and run state mapping
- Tests prove seal-before-next-stage, predecessor input authority, no Analysis/Planning rerun, route progress = sealed count.

**Commit:** `feat: chain Transformer stages from sealed outputs`

## Task 15: Compact historical sealed stages

**Files**
- Modify Transformer stage stack/pipeline components.
- Tests protect current-stage dominance and compact previous stage summaries.

**Commit:** `feat: compact sealed Transformer stage history`

---

# Wave 5 — Failure ownership and governed repair runtime

## Task 16: Add immutable failure evidence and deterministic ownership

**Files**
- Create: `domain/failures.ts`
- Create: `runtime/failure-routing.ts`
- Create: `tests/angular-transformer-failure-routing.test.ts`

**Behavior**
Persist failure evidence first, then ownership. Support locked phase/owner contract:
HARNESS→PLATFORM_RECOVERY, RUNTIME→RUNTIME_RESOLVER, DEPENDENCY→COMPATIBILITY_PLANNER, LOCKFILE→LOCK_RESOLVER, DETERMINISTIC_SOURCE→DETERMINISTIC_REPAIR, MAIN_REPAIR→MAIN_REPAIR_LLM.

Tests explicitly prove dependency/lock failures do not invoke Main Repair LLM.

**Commit:** `feat: add Transformer failure ownership routing`

## Task 17: Add Main Repair LLM proposer/reviewer/G10 lineage

**Files**
- Create: `runtime/repair-runtime.ts`
- Create: `components/repair-timeline.tsx`
- Create: `components/repair-operation.tsx`
- Modify run/gate mapping
- Tests prove failure→owner→proposer→reviewer→G10→apply order, reviewer cannot apply, G10 required.

**Commit:** `feat: add governed Main Repair runtime`

## Task 18: Add distinct repair operation families and validation replay

**Files**
- Extend command catalogue/runtime.
- Tests for source patch, dependency_transition, dependency_add, manifest normalization.
- Tests prove materialization where needed → affected validation → full clean validation.
- Preserve failed command history after success.
- Request changes creates immutable child attempt; no-progress stops loop.

**Commit:** `feat: add distinct Transformer repair operations`

---

# Wave 6 — Authentic late-stage/reference scenarios

## Task 19: Add 19→20 dependency-transition scenario
Use source-backed peer/dependency conflict family and deterministic compatibility ownership. No arbitrary LLM dependency mutation.

**Commit:** `feat: add Angular 19 to 20 dependency transition scenario`

## Task 20: Add 20→21 dependency-add/source-repair scenario
Use source-backed missing `jest-environment-jsdom`, legacy Jest setup import, and request-changes lineage.

**Commit:** `feat: add Angular 20 to 21 repair scenarios`

## Task 21: Add historical 18→21 reference-E2E projection

**Files**
- Create: `data/reference-e2e.ts`
- Tests label 49 commands / 629 events / 499 artifacts / 7 repairs / 18 completed LLM invocations / ~1h26m51s as reference-run evidence.
- Historical view may show observed governed Angular-update execution, but it never becomes default current-PROVEN authority.

**Commit:** `feat: add historical Transformer reference projection`

---

# Wave 7 — Post-validation authority, sealing, completion/delivery hardening

## Task 22: Implement alternate G12 candidate-promotion policy

**Files**
- Extend post-validation runtime and tests.

Require PASS validation, approved G12, same generation, and fingerprint equality before promotion. Direct G11 route remains promotion-free.

**Commit:** `feat: enforce policy-selected candidate promotion`

## Task 23: Harden sealing/checkpoint/chain projection

Implement explicit ten-step sealing sequence, chain hashes, output manifest, sealed generation, and stale-binding rejection tests.

**Commit:** `feat: harden Transformer stage sealing lineage`

## Task 24: Separate Transformer completion from delivery

**Files**
- Modify Angular overview/pipeline terminal projection.
- Tests prove all stages sealed => staged migration complete, but no “Delivered” status without explicit delivery record.

**Commit:** `fix: separate Transformer completion from delivery`

---

# Wave 8 — Adversarial source audit and final integration readiness

## Task 25: Source-truth audit against locked backend
Re-read and compare:
- ProvenTransformationNode / successor handling
- StageGateService
- command authority
- validation
- failure routing/repair
- promotion
- sealing
- continuation/event metadata
- persisted E2E evidence

Add/fix regression tests for any discrepancy. Do not change architecture merely for aesthetics.

## Task 26: Full verification and browser QA

Run fresh:
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- production route smoke via GitHub Actions
- visual/browser QA of active stage, long-running commands, gate focus, manual-history pause/resume, refresh, and terminal state.

Verify all 29 acceptance criteria one by one and record any not proven.

## Task 27: Final code review
Review feature branch against the exact base SHA and approved spec. Fix all Critical/Important findings, rerun full CI, then use `superpowers:finishing-a-development-branch` before any merge choice.

---

## TDD execution note for this session

The current container cannot resolve GitHub, so local cloning is unavailable. The repository CI already triggers on `feat/**`. For this execution:
1. commit the failing test to `feat/proven-transformer-runtime`;
2. wait for the branch CI and confirm the intended RED failure;
3. add only the minimum implementation;
4. wait for branch CI and confirm GREEN;
5. then continue to the next task.

No production-code commit may precede its failing regression test.
