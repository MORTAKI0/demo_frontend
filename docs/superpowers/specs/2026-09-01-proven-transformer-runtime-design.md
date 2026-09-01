# PROVEN Transformer Runtime Presentation Design

**Date:** 2026-09-01  
**Repository:** `MORTAKI0/demo_frontend`  
**Reference backend:** `Ali-Hamdaoui/angular-migration:v2.3`  
**Reference application:** `cornflourblue/angular-11-crud-example`  
**Status:** Design approved in chat; implementation not started.

## 1. Goal

Replace the current coarse Angular stage animation with a deterministic, event-driven presentation runtime that mirrors the production Transformer architecture in `angular-migration:v2.3`.

The current frontend proves the right high-level governance direction but still feels synthetic because a stage is represented by a few coarse steps whose durations are globally stretched. A build, install, discovery, migration, validation, or seal can therefore appear to complete in only a few seconds even though the real Transformer executes many durable backend nodes, commands, worker claims, evidence writes, validation steps, gates, repairs, and seal operations.

The target is not to connect this presentation frontend to the production backend. The target is to project the **same execution model** so the operator sees a believable migration process with source-backed data, deterministic timing, realistic command/event streams, and the correct human-governance boundaries.

## 2. Authority and truth model

### 2.1 Workflow authority

The Transformer workflow is derived from the current `v2.3` backend and evidence, especially:

- `evidence/ANGULAR_TRANSFORMER_E2E_WORKFLOW.md`
- `evidence/TRANSFORMER_E2E_IMPLEMENTATION_HANDOFF.md`
- `TRANSFORMER_PRODUCTION_IMPLEMENTATION_PLAN.md`
- `backend/app/domain/transformation.py`
- `backend/app/services/proven_stage_execution_service.py`
- `backend/app/services/transformation_continuation_service.py`
- `backend/app/services/stage_gate_service.py`
- `backend/app/services/command_executor_service.py`
- `backend/app/services/validation_runner.py`
- dependency transition, lockfile generation, repair, candidate promotion, and sealing services.

The presentation must follow `transformer-plan-v2.2-proven-1`, not the legacy one-shot `ng update` model.

### 2.2 Demo application authority

Application-specific source facts come from `cornflourblue/angular-11-crud-example`, including:

- Angular 11.0.4 / CLI 11.0.4
- single Angular CLI application
- lazy `UsersModule`
- Reactive Forms
- HttpClient + error interceptor
- CRUD service contract
- development fake backend/localStorage behavior
- TSLint/Codelyzer
- Protractor
- Karma/Jasmine harness with no source unit specs.

### 2.3 Timing truth

The backend provides strong workflow/runtime evidence but does not provide a reliable measured average duration for every individual node/command.

Therefore:

- **workflow structure, command kinds, gate semantics, data fields, repairs, runtime bindings, evidence, and seal behavior are source-backed;**
- **per-node timing envelopes are presentation-design values;**
- timing values must never be described as measured production averages unless actual backend evidence exists.

The primary E2E proof is useful as a scale reference: approximately 1h26m51s total for three stages with repairs, 49 command executions, 629 workflow events, 499 immutable artifacts, 7 repair attempts, and 18 LLM invocations.

## 3. Non-goals

This change will not:

- execute a real Angular migration;
- connect the presentation app to the production SQLite database;
- reproduce every backend table or API;
- expose raw shell authority;
- claim generic production support;
- claim every runtime profile is formally certified;
- claim a migrated application is delivered when only staged Transformer completion is proven;
- rerun Analysis and Planning between adjacent Angular stages;
- migrate the Java presentation runtime to the same event engine in this change.

The Java workflow remains intact. The new architecture is introduced specifically for Angular Transformer execution after G06/G07.

## 4. Core design decision

### 4.1 Replace coarse stage animation with a Transformer runtime

Current model:

```text
AngularLiveExecution
  -> LiveExecutionStep[]
  -> elapsed-time projection
  -> sliced logs[]
```

Target model:

```text
TransformerScenarioRuntime
  -> StageRuntimeState
  -> deterministic backend-node schedule
  -> CommandExecution lifecycle
  -> ordered TransformerEvent stream
  -> human-boundary cursor
  -> projection for operator UI
```

The presentation must stop "animating a migration" and instead simulate the durable Transformer continuation.

### 4.2 Keep the current generic LiveExecution system where it still fits

The current `LiveExecutionStep[]` model remains appropriate for:

- G03 baseline
- G04 Analysis
- G05 feasibility
- G06 Planning
- Java pre-transform workflow

It is removed as the authority for Angular stage transformation.

## 5. Runtime domain model

### 5.1 Transformer runtime

```ts
interface TransformerRuntime {
  id: string;
  runId: string;
  stageId: string;
  sourceMajor: number;
  targetMajor: number;
  profile: TransformerTimingProfileId;
  scenario: TransformerScenarioId;

  status:
    | "RUNNING"
    | "WAITING_GATE"
    | "WAITING_REPAIR"
    | "WAITING_PROMPT"
    | "BLOCKED"
    | "SEALED"
    | "COMPLETED"
    | "CANCELLED";

  startedAtMs: number;
  accumulatedMs: number;

  cursor: {
    phaseId: TransformerPhaseId;
    nodeId: string;
    nodeIndex: number;
    eventSequence: number;
    stateVersion: number;
    wakeSequence: number;
  };

  activeCommand?: TransformerCommandRuntime;
  currentGate?: TransformerGateRuntime;
  currentRepair?: TransformerRepairRuntime;

  routeContext: TransformerRouteContext;
}
```

### 5.2 Event schema

The runtime does not progressively reveal prewritten log arrays by fraction. It emits deterministic events on a schedule.

```ts
type TransformerEventKind =
  | "WORKER"
  | "STATE"
  | "COMMAND_AUTHORIZATION"
  | "COMMAND_STATUS"
  | "STDOUT"
  | "STDERR"
  | "ARTIFACT"
  | "FINGERPRINT"
  | "CHECKPOINT"
  | "VERSION_PROOF"
  | "DEPENDENCY"
  | "MIGRATION_LEDGER"
  | "VALIDATION"
  | "DIAGNOSTIC"
  | "GATE"
  | "REPAIR"
  | "LLM"
  | "REVIEWER"
  | "PROMOTION"
  | "SEAL";

interface TransformerEvent {
  id: string;
  sequence: number;
  offsetMs: number;
  occurredAtMs: number;

  kind: TransformerEventKind;
  phaseId: TransformerPhaseId;
  nodeId: string;

  label: string;
  message: string;

  executionId?: string;
  commandId?: string;
  templateId?: string;
  stream?: "stdout" | "stderr";

  artifactId?: string;
  artifactType?: string;
  checksum?: string;

  workspaceFingerprint?: string;
  checkpointId?: string;

  stateVersion: number;
  wakeSequence: number;

  metadata?: Record<string, string | number | boolean | string[]>;
}
```

### 5.3 Command runtime

```ts
type TransformerCommandStatus =
  | "QUEUED"
  | "AUTHORIZED"
  | "CLAIMED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "TIMED_OUT"
  | "CANCELLED"
  | "INTERRUPTED";

interface TransformerCommandRuntime {
  executionId: string;
  commandId: string;
  templateId: string;
  label: string;
  argv: string[];
  status: TransformerCommandStatus;

  queuedAtMs: number;
  startedAtMs?: number;
  finishedAtMs?: number;

  runtimeProfileId: string;
  workspaceAlias: string;
  networkProfile: string;
  shell: false;
  timeoutMs: number;

  authorizationChecksum: string;
  resultChecksum?: string;
  exitCode?: number;
}
```

### 5.4 Phase groups

The dozens of backend nodes are grouped for human readability:

1. Stage Preparation & Start
2. Source Baseline
3. Discovery
4. Target Authority & Materialization
5. Migration Owners & Transformation Review
6. Clean Validation
7. Post-validation Authority & Seal

Repair becomes a contextual eighth group when needed.

The operator sees seven meaningful sections, while the active section expands into the actual backend node sequence.

## 6. PROVEN node mapping

### 6.1 Stage Preparation & Start

Backend-aligned nodes:

- `select_run_mode`
- `prepare_stage_layout`
- runtime/stage-plan binding
- G07 package creation and approval boundary

Displayed facts:

- stage source/target
- exact source/target cohort
- run mode
- current runtime profile
- observed/certified evidence terminology
- input authority
- previous seal/checkpoint
- mutable workspace fingerprint
- G07 package checksum

G07 approval starts governed mutation.

### 6.2 Source Baseline

Nodes:

- `create_source_baseline`
- `construct_dependency_intent`
- `bind_npm_lock_authority_policy`
- `select_source_lock_authority`
- `read_source_resolved_lock`
- `prove_source_manifest_vs_resolution`
- `source_install_same_authority`
- `source_tree`
- `source_version_proof`
- `source_build`
- `source_test`
- `source_diagnostic_capture`
- `freeze_source_baseline`

Important visible commands/evidence:

- source `npm ci`
- dependency tree
- version proof
- configured source build
- configured source test
- diagnostic baseline
- source baseline artifact/checksum
- workspace fingerprint

### 6.3 Discovery

Nodes:

- `create_discovery_generation`
- `prepare_discovery_toolchain`
- `prove_discovery_cli_authority`
- `run_discovery`
- `assess_discovery`
- `persist_target_intent`
- `discard_discovery`

Discovery is explicitly disposable.

The UI must show:

- temporary generation ID
- CLI authority proof
- target exact version
- Angular update discovery command
- migration metadata discovered
- optional decisions discovered
- discovery result artifact
- disposal of scratch generation

### 6.4 Target Authority & Materialization

Nodes:

- `create_authoritative_target`
- `apply_target_intent`
- `dependency_plan`
- `select_target_lock_authority`
- `lock_resolution`
- `create_materialization`
- `target_install_same_authority`
- `target_tree`
- `target_version_proof`

Visible operations:

- target cohort application
- lockfile generation
- target `npm ci`
- dependency tree
- target version proof
- manifest/lock/installed consistency

The lockfile generation command is shown as a real execution, not a summary line.

### 6.5 Migration Owners & Transformation Review

Nodes:

- `inspect_migration_metadata`
- `build_migration_ledger`
- `execute_migration_owner`
- `compare_dependency_authority`
- `freeze_target_authority`

The UI contains a migration ledger:

```text
discovered package owner #1         PASSED
discovered package owner #2         RUNNING
remaining discovered owner          PENDING
```

For each owner, the package identity comes from the persisted/discovered migration metadata rather than a hardcoded frontend list.

Display:

- package
- from version
- to version
- command execution
- applied/skipped migrations
- artifact/checksum
- remaining owner count

After dependency comparison and target evidence are frozen, G08 opens when the current policy requires it.

### 6.6 Clean Validation

Nodes:

- `create_validation_generation`
- `validation_install`
- `validation_tree`
- `validation_version_proof`
- `validation_build`
- `validation_test`
- `diagnostic_delta`
- `aggregate_proven_validation`

Displayed separately:

- clean validation generation
- validation `npm ci`
- dependency tree
- target version proof
- production build
- test command
- diagnostic delta
- validation summary

Build/test duration must be meaningful and individually visible.

### 6.7 Post-validation authority & seal

This phase is **policy-selected**. There are two source-backed paths and the frontend must not merge them into one universal sequence.

#### Reference E2E G11 path

The persisted 18→21 proof used:

```text
G07
→ transformation
→ G08
→ final validation
→ G11
→ seal
```

No candidate-promotion record is required to represent this observed route.

#### G09/G12 candidate-promotion path

The V2 candidate-promotion service is a separate policy path. `promote_validated_generation()` explicitly requires:

- a PASS ValidationSummary;
- an approved G12 package;
- the same bound workspace generation;
- fingerprint equality between G12, the validation summary, and the live candidate.

Only then may the generation be promoted.

Visible evidence when this path is selected:

- G09/G12 package lineage as required by the plan;
- validation-summary binding;
- candidate generation;
- promotion decision;
- blockers if rejected;
- promoted generation ID;
- promotion artifact.

Both paths then converge on sealing:

- clean sealing context;
- output manifest;
- seal checkpoint;
- previous seal hash;
- stage seal hash;
- chain checksum;
- immutable sealed output;
- next-stage input authority.

The UI must never render candidate promotion on the reference G11-direct-seal path unless the selected plan actually requires it.

## 7. Gate policy

The UI must not blindly force one universal sequence.

Supported gate vocabulary remains:

- G07 Stage start
- G08 Transformation review
- G09 Validation acceptance
- G10 Repair proposal
- G11 Repaired/validated state acceptance
- G12 Stage completion/seal acceptance

The scenario declares the required gate policy.

The primary reference E2E projection uses the route actually demonstrated by the latest proof:

- G07
- G08
- G10 when repair is required
- G11
- seal

G09/G12 remain available for plans/policies that require those alternate boundaries.

The current UI must therefore project gates from scenario policy, not assume that every stage always follows the same gate list.

## 8. Timing model

### 8.1 Timing profiles

Two internal profiles:

```ts
type TransformerTimingProfileId =
  | "PRESENTATION_REALISTIC"
  | "REFERENCE_E2E_SCALE";
```

These identifiers are internal only.

### 8.2 Presentation-realistic profile

Goal: a clean stage should feel like real migration engineering work.

Target clean-stage envelope:

**approximately 4–8 minutes**, depending on stage/runtime/tooling.

Representative command envelopes:

| Operation | Presentation envelope |
|---|---:|
| stage layout/runtime binding | 10–20s |
| source npm ci | 35–60s |
| source dependency tree/version proof | 12–25s |
| source build | 25–45s |
| source tests | 20–40s |
| discovery CLI authority + discovery | 30–55s |
| target lock generation | 25–45s |
| target npm ci | 35–65s |
| target dependency tree/version proof | 15–30s |
| migration owner command | 20–45s each |
| clean validation npm ci | 35–65s |
| validation build | 30–55s |
| validation tests | 25–50s |
| diagnostic delta + aggregate | 10–20s |
| post-validation authority + seal | 20–40s |

The exact deterministic value is derived from:

```text
run ID
+ stage ID
+ node ID
+ attempt number
+ timing profile
```

No randomness is used.

### 8.3 Reference-E2E-scale profile

Used for a seeded 18→21 scenario that mirrors the order of magnitude of the persisted proof.

It may run approximately 75–95 minutes in total when all repair lineages execute.

This profile is useful for:

- long-running unattended presentation
- screenshot/video capture at realistic scale
- resume/reload demonstrations
- terminal-state metrics

It is not the default operator presentation path.

### 8.4 No fake exact ETA

Individual commands do not receive a fake percentage.

Example:

```text
npm ci
RUNNING
Elapsed 00:42
Typical presentation window 35–60s
latest event 14:53:18
```

Stage progress is based on completed weighted nodes, not elapsed wall-clock percentage.

## 9. Weighted stage progress

Each node receives a workflow weight.

Example phase weights:

| Phase | Weight |
|---|---:|
| Stage Preparation | 5 |
| Source Baseline | 20 |
| Discovery | 12 |
| Target Authority & Materialization | 22 |
| Migration Owners | 15 |
| Clean Validation | 20 |
| Post-validation authority & seal | 6 |

Within a phase, weight is distributed across nodes.

Stage percentage means **workflow completion**, not "estimated command completion."

Route progress is separate:

```text
Route: 3 / 10 stages sealed
Current stage: Angular 14 → 15
Stage work: 62% workflow complete
Current command: validation build
```

## 10. Event streaming behavior

### 10.1 Event schedule

Every runtime node owns an ordered event template.

Example `npm ci`:

```text
WORKER          continuation claimed
COMMAND_AUTH    command accepted by structured registry policy
COMMAND_STATUS  QUEUED
COMMAND_STATUS  CLAIMED
COMMAND_STATUS  RUNNING
STDOUT          npm ci
STDOUT          lockfile authority package-lock.json
STDOUT          materializing dependency tree
STDOUT          added/changed package evidence
ARTIFACT        command log finalized
FINGERPRINT     workspace fingerprint verified
COMMAND_STATUS  SUCCEEDED exit=0
STATE           continuation woken
```

Events are emitted at explicit offsets, not evenly sliced.

### 10.2 Burst behavior

Long commands receive realistic quiet periods and output bursts.

This avoids a fake "one log every exactly 2 seconds" appearance.

### 10.3 Log viewport

The live log region auto-follows new events.

Page scrolling and log scrolling are independent.

## 11. Follow-live UX

### 11.1 Default behavior

`Follow live` is enabled when a stage starts.

The page keeps the active phase/current command in view.

### 11.2 Human inspection override

If the operator:

- scrolls away,
- expands a historical phase,
- opens evidence,
- opens a previous stage,

auto-follow pauses.

A compact control appears:

```text
Live updates continue
[ Resume follow ]
```

The page never fights manual inspection.

### 11.3 Gate focus

When a command sequence reaches a human boundary:

- execution panel stops following commands;
- current action/gate becomes the focus target;
- page scrolls to G08/G10/G11/G12 as appropriate.

After approval, focus returns to the execution launched by that decision.

## 12. Active-stage layout

The Angular Cockpit gets a first-class **Current Stage** surface.

It shows:

- Angular source → target
- exact source and target
- CLI target
- runtime profile
- runtime evidence class
- stage elapsed time
- current phase
- current backend node
- active execution ID
- current command
- latest event
- route position
- next governed boundary
- commands finalized
- events emitted
- artifacts finalized
- repair attempts
- workspace generation/fingerprint

It is the primary operator truth surface while transformation is active.

## 13. Phase disclosure rules

### Active phase

Fully expanded.

Shows:

- backend nodes
- current command
- event stream
- command authorization
- artifacts/evidence
- node-level elapsed time

### Completed phase

Collapsed by default.

Summary:

```text
Source Baseline
PASS · 13 operations · 02:14
2 commands · 7 artifacts
[ reopen ]
```

### Previous sealed stage

More compact:

```text
Angular 13 → 14
SEALED · 06:43
build PASS · tests PASS
1 repair · G07/G08/G10/G11
seal sha256:…
```

## 14. Evidence feed

The active stage exposes a compact evidence stream.

Examples:

- source-dependency-intent.json
- source baseline summary
- discovery result
- target dependency intent
- lockfile verification
- dependency tree proof
- target version proof
- migration ledger
- transformation evidence
- failure evidence
- repair proposal
- repair review
- apply ledger
- dependency closure
- validation summary
- policy-selected post-validation authority result
- candidate-promotion evidence when required by G12
- output manifest
- seal.json

Each row shows:

- artifact type
- producer
- status
- checksum fragment
- stage
- sequence/time

## 15. Version proof

Target Angular cannot become PASS from one field.

The UI presents the backend-style multi-authority proof:

- package.json requested target
- package-lock resolved target
- installed `@angular/core`
- installed `@angular/cli`
- installed `@angular-devkit/build-angular`
- local Angular CLI output
- runtime profile
- TypeScript/RxJS/Zone cohort where available

The result can be:

- PROVEN
- OBSERVED
- BLOCKED
- NOT PROVEN

Do not incorrectly label every catalogue entry as certified.

## 16. Workspace lineage

The presentation visibly distinguishes:

```text
sealed previous-stage input
   ↓
source baseline generation
   ↓
discovery generation (disposable)
   ↓
authoritative target generation
   ↓
validation generation
   ↓
post-validation authority
   ↓
[optional G12 candidate promotion]
   ↓
sealed output
```

Each generation has:

- ID
- source
- fingerprint
- lifecycle status
- checkpoint/evidence

## 17. Failure classification

Before repair, deterministic evidence-first ownership runs.

The current V2.3 source contract is phase-first. The persisted `FailureDecision` uses these proven phases:

- `HARNESS`
- `RUNTIME`
- `DEPENDENCY`
- `LOCKFILE`
- `DETERMINISTIC_SOURCE`
- `MAIN_REPAIR`

The deterministic phase-to-owner mapping is:

| Phase | Owner |
|---|---|
| HARNESS | PLATFORM_RECOVERY |
| RUNTIME | RUNTIME_RESOLVER |
| DEPENDENCY | COMPATIBILITY_PLANNER |
| LOCKFILE | LOCK_RESOLVER |
| DETERMINISTIC_SOURCE | DETERMINISTIC_REPAIR |
| MAIN_REPAIR | MAIN_REPAIR_LLM |

Structured evidence codes decide ownership before free-form stderr/message interpretation. Source-backed examples include:

- `PACKAGE_LOCK_MALFORMED_PARSER`, `COMMAND_WORKER_LOST` → HARNESS;
- `ANGULAR_CLI_AUTHORITY_MISMATCH`, `RUNTIME_DESCRIPTOR_MISMATCH`, `ENGINES_INCOMPATIBLE` → RUNTIME;
- `ETARGET`, `PEER_CONFLICT_FROM_NPM`, `NPM_SOLVER_FAILURE`, `NPM_TREE_INVALID` → DEPENDENCY;
- `PACKAGE_LOCK_MISSING`, `LOCK_CONVERGENCE_EXHAUSTED`, `NPM_CI_REJECTED_CONVERGED_LOCK` → LOCKFILE.

The non-source-repair phases `HARNESS`, `RUNTIME`, `DEPENDENCY`, and `LOCKFILE` must **not** be routed to the source Repair LLM.

Only a failure owned by `MAIN_REPAIR_LLM` enters the Main Repair LLM path. `DETERMINISTIC_SOURCE` stays backend-owned. Unknown/unmatched structured evidence may fall back to `MAIN_REPAIR` with the upstream low-confidence/human-escalation semantics preserved.

No-progress detection remains a separate repair-loop safety mechanism; it is not a failure-owner phase.

Failure evidence and the persisted ownership decision appear before any LLM activity.

## 18. Repair workflow

### 18.1 Normal cadence

```text
command fails
→ freeze failure evidence
→ deterministic classification
→ build bounded context
→ Main LLM proposer
→ proposal schema validation
→ causal review
→ independent reviewer
→ G10
→ deterministic apply
→ verify post-state
→ affected validation
→ full validation replay
→ G11
```

### 18.2 Repair types

Distinct UI/runtime paths:

1. text/source repair
2. dependency transition
3. dependency add
4. manifest/dependency normalization

### 18.3 Dependency transition

Rendered phases:

- blocker identified
- detach/uninstall
- Angular transition
- normalization
- lockfile generation
- dependency reattach
- npm ci
- closure verification
- affected validation
- full validation

### 18.4 Dependency add

Rendered phases:

- package intent
- governed manifest change
- lockfile generation
- npm ci
- observed exact installed version
- closure proof
- affected validation
- full validation

### 18.5 Source patch

Show:

- source file
- preimage checksum
- reviewed unified diff
- deterministic apply
- postimage checksum
- apply ledger
- validation targets

## 19. Repair scenarios

Use source-backed failures where possible.

### 19→20

Use the real dependency-conflict family demonstrated in v2.3:

- peer/dependency blocker
- explicit dependency transition
- Angular package normalization
- clean npm ci
- dependency closure
- build/test proof

### 20→21

Use the real E2E repair families:

- missing `jest-environment-jsdom` through `dependency_add`
- legacy Jest setup import through source repair
- request-changes lineage where appropriate

### Earlier 11→18 stages

Prefer clean or tooling-transition stages unless source-backed evidence justifies repair.

Do not inject arbitrary failures merely to create drama.

## 20. Repair lineage and budget

The UI shows:

- immutable attempt number
- parent attempt
- reviewer status
- human request changes
- superseded attempt
- applied attempt
- validation result
- whether the attempt consumes the repair budget
- no-progress fingerprint

A repeated causal fingerprint can stop the loop as `NO_PROGRESS`.

## 21. Validation behavior

### 21.1 Clean stage

Validation generation:

- npm ci
- dependency tree
- target version proof
- configured build
- configured tests
- optional configured lint
- diagnostic delta
- aggregate summary

### 21.2 Repaired stage

Required order:

```text
repair apply
→ dependency materialization if needed
→ affected validation
→ full clean validation
→ post-repair gate
```

Historical failed commands remain visible.

## 22. Diagnostic delta

Validation presents:

- new diagnostics
- resolved diagnostics
- unchanged known baseline diagnostics

Known G03 baseline conditions are not mislabeled as new migration regressions.

## 23. Post-validation authority

A validated workspace does not become the next-stage source immediately.

The exact authority path is selected by the active plan/gate policy.

### G11 direct-seal path

For the persisted reference route, G11 approves the validated post-state and the stage proceeds to sealing once the sealing preconditions still match.

No candidate-promotion record is invented for this path.

### G12 candidate-promotion path

When the active plan selects candidate promotion, the UI shows:

- candidate generation;
- validation-summary binding;
- approved G12 package binding;
- live fingerprint equality;
- promotion decision;
- blockers if rejected;
- promoted generation ID;
- promotion artifact.

In both paths, the next stage remains blocked until the current stage has sealed.

## 24. Stage sealing

Sealing visibly executes:

1. verify no active command
2. verify no active prompt
3. reconcile repair lifecycle
4. verify current workspace fingerprint
5. verify validation binding
6. generate output manifest
7. create seal checkpoint
8. bind previous seal
9. calculate chain checksum
10. finalize immutable sealed output

The stage is not marked SEALED before this sequence completes.

## 25. Next-stage materialization

After seal:

- read sealed output
- record input authority
- inspect exact observed versions
- derive next exact StageExecutionPlan
- resolve runtime
- prepare next stage
- create next G07 package

Analysis and Planning do not rerun.

## 26. Completion versus delivery

Final state must distinguish:

### Transformer completion

```text
STAGED MIGRATION COMPLETE
all route stages sealed
final validation current
no active work
```

### Delivery

Only claim delivered if an explicit delivery/materialization record exists.

The reference v2.3 proof demonstrated sealed staged completion but did **not** prove a materialized `migrated-app` or delivery candidate.

The presentation must preserve this distinction.

## 27. Scenario catalogue

### 27.1 Primary Angular 11→21 scenario

Source:

`cornflourblue/angular-11-crud-example`

Route:

```text
11→12
12→13
13→14
14→15
15→16
16→17
17→18
18→19
19→20
20→21
```

Each stage uses the same PROVEN execution mechanics.

Later exact stage plans are derived from the preceding sealed output.

### 27.2 Reference 18→21 E2E scenario

Purpose:

- deepest Transformer presentation;
- real repair lineage;
- actual gate route evidence;
- final operational statistics;
- seal chain;
- long-run persistence/reload.

Reference metrics:

- 3 sealed stages;
- 49 command executions;
- 629 workflow events;
- 499 immutable artifacts;
- 7 repair attempts;
- 18 completed LLM invocations;
- approximately 1h26m51s elapsed in the persisted proof.

Reference gate route:

- G07 and G08 on every stage;
- G10 when repair was required;
- G11 on every stage;
- no latest-run G09/G12 rows.

#### Historical-trace versus current-PROVEN rule

The persisted proof is historical runtime evidence. Its command history includes a governed Angular-update execution in the stage trace.

That historical fact must remain available when the UI shows **reference-run evidence**.

It must **not** become the execution authority for the current default Transformer scenario.

The default current scenario follows the present PROVEN semantic model described in this spec: source baseline, disposable discovery, target intent/materialization, migration-owner ledger, clean validation, policy-selected gates, and sealing.

Therefore:

- historical-reference panels may display the actual observed Angular-update command as historical evidence;
- current-PROVEN execution panels must not collapse an entire stage into one generic `ng update Angular X → Y` command;
- reference metrics/repair lineage may be reused only where they are explicitly labeled as reference-run evidence;
- a future exact historical-replay mode would require its own scenario definition rather than silently mixing historical command traces with the current PROVEN node catalogue.

These metrics are reference-run evidence, not universal averages.

## 28. Stage-specific runtime/cohort data

Exact cohorts come from the current compatibility/planning evidence.

The scenario registry stores per-stage:

- source exact Angular
- target exact Angular
- target CLI
- Node
- npm
- TypeScript
- RxJS
- Zone
- builder
- runtime evidence provenance

Example:

```text
11 → 12
source Angular 11.0.4
target Angular 12.2.17
CLI 12.2.18
Node 12.22.12
npm 8.19.4
TypeScript 4.3.5
RxJS 6.6.7
Zone 0.11.8
```

The UI says `observed runtime proof` where that is the correct authority.

## 29. Persistence and refresh

The scenario store must persist only durable runtime identity/cursor state, not a giant mutable event array.

Persist:

- run ID
- stage ID
- runtime ID
- timing profile
- scenario ID
- runtime startedAt
- accumulated elapsed time
- cursor/human boundary
- accepted gate decisions
- repair lineage
- cancellation state

Events are deterministically regenerated from the scenario definition.

Benefits:

- stable refresh
- smaller browser storage
- reproducible event sequence
- no random divergence
- easier schema migration

Angular scenario storage must bump to a new schema key.

## 30. Cancellation and restart

Cancellation is not instantaneous UI disappearance.

Presentation flow:

```text
cancel requested
→ current command receives cancellation
→ worker/process termination
→ command result finalized
→ reconstruction requirement checked
→ continuation moves cancelled/blocked
```

Restart/recovery:

- same continuation ID
- same stage
- same durable cursor
- valid finalized evidence reused
- interrupted mutating step reconstructs from safe checkpoint
- first incomplete valid node resumes

## 31. State projection hygiene

The reference backend proof exposed stale projection debt, including stale:

- `waiting_execution_id`
- `last_error_code/message`
- top-level run phase

The presentation should not copy known projection bugs.

Rule:

- current state derives from the active runtime/cursor;
- stale failures remain in historical diagnostics only;
- terminal state clears active-command/waiting indicators;
- final route projection reflects sealed/completed truth.

## 32. UI component design

New Angular Transformer-specific components:

```text
features/angular-transformer/
├── current-stage-card.tsx
├── stage-phase-stack.tsx
├── phase-disclosure.tsx
├── backend-node-row.tsx
├── command-execution-card.tsx
├── command-authorization.tsx
├── transformer-event-stream.tsx
├── follow-live-control.tsx
├── evidence-feed.tsx
├── workspace-lineage.tsx
├── version-proof.tsx
├── dependency-closure.tsx
├── migration-ledger.tsx
├── diagnostic-delta.tsx
├── repair-timeline.tsx
├── repair-operation.tsx
├── post-validation-authority-panel.tsx
└── seal-summary.tsx
```

The existing Angular Control Tower composes them.

## 33. Runtime module design

```text
src/stacks/angular/transformer/
├── domain/
│   ├── types.ts
│   ├── events.ts
│   ├── timing.ts
│   ├── gates.ts
│   └── scenarios.ts
├── data/
│   ├── cohorts.ts
│   ├── node-catalogue.ts
│   ├── command-catalogue.ts
│   └── reference-e2e.ts
├── runtime/
│   ├── create-runtime.ts
│   ├── event-schedule.ts
│   ├── projector.ts
│   ├── reducer.ts
│   ├── gate-boundaries.ts
│   ├── repair-runtime.ts
│   ├── sealing-runtime.ts
│   └── persistence.ts
└── components/
    └── ...
```

## 34. Integration boundaries

### Angular workflow

`applyAngularStageGateDecision(G07)` will no longer create one coarse `STAGE_EXECUTION` live object.

It creates a `TransformerRuntime`.

The stage workflow consumes Transformer terminal/boundary outcomes:

- WAITING_G08
- WAITING_G10
- WAITING_G11
- WAITING_G09
- WAITING_G12
- SEALED
- BLOCKED
- CANCELLED

### Pre-transform workflow

No change to G03/G04/G05/G06 authority.

### Java workflow

No change in this implementation.

## 35. Migration from current LiveExecution stage model

Remove Angular stage authority from:

- `STAGE_EXECUTION`
- coarse `REPAIR_VALIDATION`
- generic stage-wide `paceLiveExecution(..., 30_000)`

Keep generic live execution for pre-transform phases.

Existing saved Angular transformation state is invalidated by a storage schema bump rather than silently coerced.

## 36. Testing strategy

### 36.1 Domain tests

Verify:

- every PROVEN node exists in the scenario catalogue;
- phase grouping contains no duplicate/missing node;
- timing is deterministic;
- same seed gives same command/event IDs;
- different stage/node can produce different timing;
- stage progress is weight-based;
- route progress is seal-based;
- event sequences are monotonic;
- state/wake sequences are monotonic.

### 36.2 Runtime tests

Verify:

- G07 starts Stage Preparation/Source Baseline;
- G08 pauses after target authority/migration evidence;
- G08 approval starts clean validation;
- clean stage reaches post-validation policy boundary;
- repair failure enters classifier before LLM;
- G10 starts deterministic apply;
- dependency repair materializes before tests;
- affected validation precedes full validation;
- candidate promotion precedes seal when the selected G12 policy requires promotion;
- seal precedes next-stage materialization;
- later stage consumes previous seal;
- final target does not rerun Analysis/Planning.

### 36.3 Command tests

Verify lifecycle:

```text
QUEUED
→ AUTHORIZED
→ CLAIMED
→ RUNNING
→ terminal
```

Verify:

- `shell=false`
- registry/template IDs exist
- workspace alias exists
- execution ID stable
- logs are event-timed
- command completion never occurs before its final event.

### 36.4 UX tests

Verify:

- active phase expanded
- completed phase collapsed
- previous sealed stages compact
- Follow Live defaults on
- user historical inspection pauses Follow Live
- Resume Follow restores focus
- log viewport follows independently
- gate focus occurs at boundaries
- no fake command percentage
- elapsed time remains visible
- route and stage progress are separate.

### 36.5 Repair tests

Verify:

- failure evidence appears before proposer
- proposer appears before reviewer
- reviewer cannot apply
- G10 required before mutation
- request changes creates child attempt
- no-progress stops loop
- failed command remains in history after repair success
- dependency-add and dependency-transition use different projections.

### 36.6 Persistence tests

Verify:

- refresh reconstructs exact current runtime
- current command/event sequence resumes
- no event duplication
- gate decision persists
- sealed previous stage persists
- storage schema migration invalidates incompatible old state safely.

### 36.7 Truth tests

Protect critical source facts:

- no generic one-shot `ng update Angular X → Y` is used as stage authority;
- PROVEN node vocabulary is represented;
- G08 exists;
- G10 occurs only when repair is needed;
- delivery is not claimed from seal completion;
- formal certification wording is not used for merely observed runtime evidence.

## 37. CI verification

The final branch must pass:

```text
Scenario/domain tests
→ ESLint
→ TypeScript
→ production Next.js build
→ production HTTP route smoke
```

Additional Transformer-focused scenario tests must run in the normal test stage.

## 38. Implementation waves

### Wave 1 — Runtime foundation

- domain types
- node catalogue
- timing profiles
- deterministic IDs
- event schedule
- projector
- persistence schema bump

No UI replacement yet.

### Wave 2 — PROVEN clean stage

- stage preparation
- source baseline
- discovery
- target authority/materialization
- migration ledger
- G08
- validation
- policy-selected post-validation authority/seal

Wire one clean 11→12 stage end-to-end.

### Wave 3 — Operator UI

- Current Stage card
- phase grouping
- command lifecycle
- event stream
- Follow Live
- evidence feed
- version proof
- workspace lineage

### Wave 4 — Route integration

- 11→21 adjacent stages
- stage-specific cohorts/runtime
- previous seal as next input
- route/stage progress split
- compact previous stages

### Wave 5 — Repair runtime

- classification
- failure evidence
- proposer/reviewer
- G10
- source repair
- dependency transition
- dependency add
- request changes
- repair lineage/budget
- affected/full validation

### Wave 6 — Authentic late-stage scenarios

- 19→20 dependency transition scenario
- 20→21 dependency-add/source-repair scenario
- reference 18→21 proof scenario

### Wave 7 — Post-validation authority/sealing/completion hardening

- chain hashes
- stage seal summaries
- final completion invariants
- delivery distinction
- final operational metrics

### Wave 8 — Adversarial review

Compare the presentation runtime back against:

- TransformationNode/ProvenTransformationNode
- stage gate policy
- validation runner
- repair lifecycle
- command authority
- E2E evidence handoff

Fix omissions before merge.

## 39. Acceptance criteria

The work is complete only when all of the following are true:

1. A stage no longer completes in ~30 seconds by generic scaling.
2. A clean stage takes several minutes in the normal presentation timing profile.
3. Build/test/install commands have individually meaningful durations.
4. The live UI is driven by ordered deterministic events, not fractional log slicing.
5. The current command has a real lifecycle and execution identity.
6. Worker/state/event metadata advances visibly.
7. The full PROVEN node structure is represented under readable phase groups.
8. Discovery is disposable and visible.
9. Lockfile generation is a first-class command.
10. Target materialization is distinct from discovery and migration.
11. Migration owners/ledger are visible.
12. G08 is supported as a real transformation review boundary.
13. Validation uses a clean generation and separate install/build/test nodes.
14. Repair begins only from frozen failure evidence.
15. Dependency-transition, dependency-add, and source-patch repairs are distinct.
16. Repair validation shows materialization, affected checks, and full replay.
17. Candidate promotion happens before sealing only on plans that select the G12 promotion path; the reference G11 route seals without fabricating promotion.
18. Seal lineage is visible and becomes the next stage input.
19. Route progress and stage progress are separate.
20. Active work dominates the page; completed work collapses.
21. Follow Live does not fight manual historical inspection.
22. Refresh resumes the exact runtime state.
23. Historical failures remain auditable after success.
24. Stale active errors/waiters do not appear as current after completion.
25. Final Transformer completion does not falsely claim delivery.
26. The Angular 11 CRUD application facts remain source-grounded.
27. Runtime evidence terminology distinguishes observed/proven from formally certified.
28. Full CI passes on the feature branch and again after integration into `main`.

## 40. Design invariants

These are non-negotiable:

- backend/workflow semantics beat visual convenience;
- no raw shell authority;
- no direct source mutation;
- no one-shot generic Angular update representation as current stage authority; historical reference evidence may show the observed governed Angular-update command from the persisted proof;
- no progress fabricated from unsupported command percentages;
- no gate invented by frontend state;
- no repair before real failure evidence;
- proposer, reviewer, human, and deterministic apply remain separate authorities;
- no stage considered reusable before sealing; when the plan selects G12 candidate promotion, that promotion must succeed before sealing/materialization;
- no next stage sourced from an unsealed mutable workspace;
- no delivery claim from Transformer completion alone;
- historical evidence is append-only in the presentation;
- timing is deterministic and clearly presentation-designed;
- active state must never be inferred from stale historical failure fields.

## 41. Expected operator experience

A real-looking active stage should read approximately:

```text
Angular 13 → 14
Stage 3 of 10
Elapsed 03:47

Current phase
Target Authority & Materialization

Current backend node
target_install_same_authority

Active command
npm-ci-final
RUNNING · 00:41

Worker
factory-runtime / continuation transform-...
state_version 182 · wake_sequence 26

Latest events
14:54:12 COMMAND_STATUS RUNNING
14:54:18 STDOUT lockfile authority verified
14:54:27 STDOUT materializing target dependency tree
14:54:36 ARTIFACT command-log finalized
...

Route progress
2 / 10 stages sealed

Stage progress
47% workflow complete

Next governed boundary
G08 Transformation Review
```

That is the presentation target: operational, durable, evidence-driven, and recognizably derived from the real Transformer rather than a progress animation.
