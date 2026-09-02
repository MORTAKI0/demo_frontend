# Original Source Reference Matrix

This file maps presentation behavior to the two audited source snapshots.

## Source locks

| Stack | Snapshot |
|---|---|
| Angular | `02e4c75e4dc15ad1d54bd2df35ed511043700abd` |
| Java | `47d206874b494d8064cc88d5b146361564d18871` |

## Angular

| Presentation behavior | Original source |
|---|---|
| architecture / frontend presentation-only | `AGENT.md` |
| current post-G07 presentation contract | `docs/superpowers/specs/2026-09-01-proven-transformer-runtime-design.md` |
| modern PROVEN semantics | `backend/app/domain/transformation.py`, `backend/app/orchestration/transformer_graph.py` |
| proven 11→15 behavior | `ANGULAR_MIGRATION_FACTORY_RUN_4E1DCAD22CFE.md` |
| G01 | `backend/app/domain/preflight.py`, `backend/app/api/routes/preflights.py` |
| source validation/analysis | `backend/app/api/routes/sources.py`, `source_analysis.py` |
| environment/runtime readiness | `backend/app/api/routes/environment.py`, runtime/execution-profile routes |
| G02 | `backend/app/domain/g02.py`, `backend/app/api/routes/g02.py` |
| baseline/G03 | `baseline.py`, `baseline_matrix.py`, `baseline_parity.py`, `baseline_g03.py`, `domain/baseline_qualification.py` |
| G04 analysis | `domain/analysis.py`, `api/routes/analysis.py` |
| G05 compatibility | `api/routes/compatibility.py`, compatibility contracts/services |
| G06 planning | `domain/planning_review.py`, `api/routes/planning_review.py` |
| dynamic route | `api/routes/migration_route.py` |
| runtime certification | `api/routes/runtime_certification.py`, `stage_runtime.py` |
| PROVEN execution | `services/proven_stage_execution_service.py` |
| gate successors | `services/stage_gate_service.py` |
| policy-selected post-validation authority | `proven_stage_execution_service.py`, `candidate_promotion_service.py`, `stage_gate_service.py`, persisted run evidence |
| sealing | `services/stage_sealing_service.py`, `orchestration/transformer_sealing_flow.py` |
| repair/causal policy | repair services, `domain/repair_lifecycle.py`, proven run evidence |
| commands/logs | `api/routes/run_commands.py`, command domain/services |
| rollback | `api/routes/stage_rollback.py` |
| partial delivery | `api/routes/partial_delivery.py` |
| terminal recovery | `terminal_lifecycle.py`, `terminal_operation.py` |
| audit/quality | `execution_audit.py`, `quality_metrics.py` |
| assistant/LLM | `assistant.py`, `llm.py` |
| current hardcoded route debt | `frontend/src/presentation/runJourney.ts`, `currentAction.ts` |

### Angular discrepancy rule

For the locked v2.3 snapshot, the approved 2026-09-01 Transformer spec and the exact audited backend/evidence sources override older presentation prose that treated one gate route as universal.

- Gate order is scenario-policy driven; G08 is supported as a real transformation-review boundary.
- Persisted reference route: G07 → transformation → G08 → final validation → G11 direct seal, with G10 when repair is required.
- Alternate promotion route: G09/G12 may be selected by the active plan/policy; G12 candidate promotion is not fabricated on the G11 direct-seal route.
- Historical reference evidence may show its observed governed Angular-update command, but the current PROVEN presentation authority is source baseline → disposable discovery → target authority/materialization → migration-owner ledger → validation → policy-selected post-validation authority → seal.

## Java

| Presentation behavior | Original source |
|---|---|
| Control Tower rules | `AGENTS.md` |
| visual architecture | `DESIGN.md` |
| API surface | `migration_factory/control_tower/adapters/fastapi/app.py` |
| job/stage states | `domain/states.py` |
| transitions | `domain/transitions.py` |
| gate phases/decisions | `schemas/phase_gate.py` |
| continuation policy/max repair | `schemas/run_configuration.py` |
| profiles | `schemas/profile_model.py`, `profile_validation.py` |
| route included/skipped/excluded | `application/v2_stage_progression.py` |
| stage jobs | `application/v2_job_service.py` |
| stage execution | `application/v2_worker_stage.py` |
| reviewed phases | `application/v2_orchestrator_runner.py` |
| gate lifecycle/actions | `v2_phase_gate_service.py`, `v2_gate_action_service.py` |
| Gate Assistant | `v2_gate_assistant.py` |
| repair | `v2_repair_flow.py`, `v2_reviewer_service.py`, `v2_repair_gate_service.py`, `v2_repair_projection.py` — normal repair attempts are scoped to route stages 1–3 |
| Repair Assistant | `repair_assistant_service.py` |
| target versions/POM | `target_version_update.py`, `target_version_validation_coordinator.py`, POM proposer/editor/review/validator/xml patcher — CSV/XLSX target authorities are parsed before comparison |
| Stage 4 terminal behavior | `v2_stage_progression.py`, `v2_orchestrator_runner.py`, `schemas/phase_gate.py` |
| final report | `v2_final_report_service.py` |
| LLM activity | `v2_llm_invocation_ledger.py` |
| New Migration UI | `web/control-tower/app/migrations/new/*` |
| Cockpit UI | `web/control-tower/app/migrations/[jobId]/MigrationCockpit.tsx` and components |
| target-version UI | `Stage4TargetVersionComparison.tsx` |

### Java terminal rule

Route Stage 4 is terminal-special. The PhaseGate schema is limited to stage indices 1–3; do not fabricate Stage-4 analysis/planning/stage-completion gates. Normal repair-attempt accounting is also stage-scoped to stages 1–3; terminal AMF-252 target-version repair remains separate Stage-4 workflow state.

## Maintenance rule

Any future workflow change in this presentation app must update this matrix in the same commit and cite the original stack source that authorizes the change.

## Angular presentation source application

The primary Angular presentation scenario is grounded in the real demo application:

- Repository: `cornflourblue/angular-11-crud-example`
- Branch: `master`
- Revision: `eda3cf6278c02e4fb65f91ec73a9281d4325514e`
- Source: Angular 11.0.4 / Angular CLI 11.0.4 / build-angular 0.1100.4 / TypeScript 4.0.2 / RxJS 6.6.x
- Workspace: one Angular CLI application (`angular-crud-example`) with one lazy `UsersModule`
- Preserved behavior: Reactive Forms, five UserService CRUD HTTP operations, interceptor-based local development API, routing, production budgets, Karma/Jasmine configuration, TSLint/Codelyzer, and Protractor E2E intent

This repository supplies presentation **application evidence only**. Angular workflow/governance authority remains `Ali-Hamdaoui/angular-migration:v2.3`.
