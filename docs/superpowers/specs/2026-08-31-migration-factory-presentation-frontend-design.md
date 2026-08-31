# Migration Factory Presentation Frontend — Design Freeze

Status: **approved implementation authority**  
Date: 2026-08-31

## Purpose

Build a standalone Next.js presentation frontend for two existing migration factories:

- Angular Migration Factory
- Java / Spring Boot Migration Factory

The application is scenario-backed for presentation reliability. Visible product copy must never use the words `mock`, `fake`, `demo backend`, `simulation`, or `fixture`.

## Audited source snapshots

- Angular: `02e4c75e4dc15ad1d54bd2df35ed511043700abd`
- Java / Spring Boot: `47d206874b494d8064cc88d5b146361564d18871`

## Product principle

> One visual product family, two independent workflows.

Shared UI may format status, evidence, logs, diffs, dialogs, tables, tabs, timelines, and assistant messages. Shared UI must never decide a business transition.

Forbidden:

- mapping Angular G-gates to Java phase gates;
- inventing a Java `assessment_review`;
- treating Java route stages as Analysis/Planning phases;
- making Java Stage 4 a normal PhaseGate stage;
- making Angular G08 mandatory in the modern PROVEN path;
- hardcoding Angular 18→19→20→21;
- hardcoding every Java route stage as included;
- adding Angular production auto-approval;
- allowing generic components to infer next workflow state.

## Authority hierarchy

### Angular

1. executable V2.3 backend code/domain contracts;
2. executable tests;
3. persisted proven-run evidence;
4. `AGENT.md`;
5. current API contracts/current frontend behavior;
6. README prose only where consistent;
7. legacy transformer semantics only for historical context.

### Java

1. current V2 executable code/schemas;
2. executable tests;
3. `AGENTS.md`;
4. `DESIGN.md`;
5. current `web/control-tower`;
6. compatible README background;
7. legacy `/v1/jobs/*` only for history.

## Critical source discrepancies frozen into this frontend

### Angular clean PROVEN completion

README prose conflicts with current executable behavior. Current code plus run evidence wins.

Presentation behavior for the audited source snapshot:

```text
Clean stage:
G07
 ↓
PROVEN execution + validation
 ↓
G12
 ↓
Candidate promotion
 ↓
Seal

Repaired stage:
G10
 ↓
Apply + revalidate
 ↓
G11
 ↓
G09
 ↓
G12
 ↓
Candidate promotion
 ↓
Seal
```

G08 is not a mandatory modern PROVEN gate.

### Java route stages vs phases

These are different dimensions.

Route:
```text
Spring Boot profile A → profile B → profile C ...
```

Execution phases:
```text
Preflight
Cancellation
Analysis Agent
Planning Agent
Assessment Agent
Human Approval
Transform Agent
Build Agent
Test Validation
Repair/Failure
Result Contract
Final Report
Stage Report
```

Java Stage 4 is terminal-special. Do not fabricate normal Stage-4 PhaseGates.

## Visible routes

```text
/

/angular/migrations/new
/angular/preflights/[preflightId]
/angular/migrations/[runId]

/java/migrations/new
/java/migrations/[jobId]
```

## Visual direction

Use the Java Control Tower `DESIGN.md` as the visual baseline:

- page background: #F5F7FA
- surfaces: #FFFFFF
- primary text: #172033
- dark execution surface: #0B0E14
- primary action: #3157D5
- semantic green / amber / red / slate
- white-first enterprise engineering control plane
- no decorative marketing gradients
- no generic AI-dashboard aesthetic
- dark treatment reserved for current execution, logs, and diff-heavy surfaces

## Angular workflow

### Setup

```text
Project configuration
→ Path validation
→ Environment diagnostics
→ Source analysis
→ Production preflight
→ G01 Production Readiness
```

Target route is dynamic for Angular 11–21.

### G01

Separate screen. Decisions:

- Approve
- Approve with comment
- Request modification
- Reject

A valid G01 approval creates/starts the authoritative run.

### Control Tower workspaces

- Overview
- Pipeline
- Evidence
- Diagnostics

### G02–G06

```text
G02 Source Snapshot
→ baseline workspace / install / build / test / lint / parity / qualification
→ G03 Baseline Acceptance
→ Analysis Agent + Independent Reviewer
→ G04 Analysis Review
→ Feasibility / compatibility
→ G05 Migration Readiness
→ Planning + review + revisions
→ G06 Migration Plan
```

### Modern PROVEN stage preparation

```text
Prepare workspace
→ Resolve runtime
→ Certify runtime
→ Dependency preflight
→ Known decisions
→ G07
```

### PROVEN grouped execution

1. Source Proof
2. Discovery
3. Dependency Resolution
4. Migration
5. Target Proof
6. Validation

### Repair

```text
Failure
→ Classification
→ Causal policy
→ Freeze evidence
→ Main Repair LLM
→ Independent Reviewer
→ G10
→ Apply bounded repair
→ clean revalidation
→ G11
→ G09
→ G12
→ promotion
→ seal
```

The primary Angular scenario must show a rejected unrelated dependency mutation via `REPAIR_CAUSAL_KIND_MISMATCH`.

### Angular recovery depth

Diagnostics may expose:

- governed commands/logs;
- runtime certification;
- LLM activity;
- stage rollback;
- resume from sealed;
- re-execution / restart;
- partial delivery from the furthest valid sealed stage;
- terminal lifecycle / resume;
- execution audit / timing / quality.

## Java workflow

### Setup

Keep Java's original V2 model:

- Project & Paths
- environment import
- Java 11 / 17 / 21
- Maven
- AI/Azure smoke readiness
- proof level
- source/target profiles
- included/skipped/excluded route
- continuation policy
- precise pre-transform approval mode
- readiness sidebar

Profiles include Spring Boot 2.1/J11, 2.7/J11, 3.5/J17, 3.5/J21, 4.0/J21.

### Gate phases

Exactly:

- `analysis_review`
- `planning_review`
- `approval_review`
- `repair_review`
- `stage_completion_review`

No `assessment_review`.

Decisions:

- analysis: Continue / Reanalyze / Override Source Profile
- planning: Continue / Revise
- approval: Approve / Reject
- repair: Continue / Reanalyze / Revise / Reject
- stage completion: Continue

### Continuation policies

- Auto on green
- Manual
- Manual on warning or failure

### Gate Assistant

Must support explain → preview exact action/checksum → explicit confirmation. A checksum/revision change invalidates pending confirmation.

### Repair

```text
Build/Test failure
→ failure evidence/diagnosis
→ Repair Proposer
→ Reviewer
→ reviewed diff
→ repair_review
→ apply
→ build/test revalidation
→ stage progression or next repair attempt
```

Default max attempts: 3.

### Target Dependency Versions

Dedicated Java Job Details tab:

```text
CSV/XLSX target versions
→ compare with current POM
→ proposed POM change
→ diff
→ apply
→ validation
→ PASS or AMF-252 repair
```

### Terminal Stage 4

```text
Terminal Stage 4
→ accepted Stage 4 output revision
→ no open gates
→ Final Report eligible
```

No normal Stage-4 PhaseGate.

## Scenario-engine rules

Angular and Java have separate deterministic state engines.

- stable IDs and SHA-256-shaped display checksums;
- browser-persisted presentation state;
- direct deep links to seeded states;
- deterministic timestamps;
- history is append-only;
- invalid actions fail visibly and preserve prior state;
- generic UI receives allowed actions from stack state and never invents them;
- scenario reset exists for presenter use but is not labeled as demo/fake in visible product UI.

## Testing priorities

Angular tests must prove:

- G01 cannot be bypassed;
- route is dynamic;
- modern clean stage does not fabricate G08 or clean G09;
- clean completion is G12 → promotion → seal;
- repaired completion includes G10/G11/G09/G12;
- causal mismatch blocks unrelated repair;
- partial delivery uses furthest sealed stage.

Java tests must prove:

- route and pipeline are separate;
- included/skipped/excluded route works;
- exact gate decisions;
- no assessment gate;
- Stage 4 has no normal PhaseGate;
- continuation policy differs;
- stale assistant checksum invalidates confirmation;
- repair attempts stop at max;
- target-version validation can enter repair;
- final report remains blocked until terminal conditions.

## Implementation waves

0. Source lock and traceability
1. Foundation/design system/CI
2. Technology selector/navigation
3. Angular setup + G01
4. Angular Control Tower G02–G06
5. Angular PROVEN/repair/promotion/seal
6. Angular diagnostics/recovery/assistant
7. Java setup/route projection
8. Java Cockpit/phase governance
9. Java repair/assistants/cancellation
10. Java target versions/Stage 4/final report
11. Presentation hardening/browser QA

## Final engineering rules

- Original workflow wins over reuse.
- Angular and Java business state machines stay separate.
- Shared components are presentation-only.
- Evidence/revision history is immutable in projection.
- No external DB/auth/real migration integration is required.
- No broken controls: every visible action must update real local/scenario state or be correctly disabled.
- Every major scenario transition must be traceable in `docs/architecture/source-reference-matrix.md`.
