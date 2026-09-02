import { paceLiveExecution } from "../../../domain/live-execution.ts";
import type {
  AngularLiveExecution,
  AngularLiveExecutionKind,
} from "../domain/run-types.ts";
import type { AngularMajor } from "../domain/types.ts";
import { ANGULAR11_CRUD_SOURCE } from "../domain/demo-source.ts";

function id(kind: AngularLiveExecutionKind, startedAtMs: number) {
  return "angular-" + kind.toLowerCase().replaceAll("_", "-") + "-" + startedAtMs;
}

export function createAngularLiveExecution(
  kind: AngularLiveExecutionKind,
  startedAtMs: number,
  context: {
    source?: AngularMajor;
    target?: AngularMajor;
  } = {},
): AngularLiveExecution {
  const raw = createAngularLiveExecutionRaw(kind, startedAtMs, context);
  const minimumDurationMs =
    kind === "PLANNING"
      ? 45_000
      : kind === "REPAIR_REVIEW"
        ? 45_000
        : kind === "REPAIR_VALIDATION"
          ? 120_000
          : 30_000;
  return paceLiveExecution(raw, minimumDurationMs);
}

function createAngularLiveExecutionRaw(
  kind: AngularLiveExecutionKind,
  startedAtMs: number,
  context: {
    source?: AngularMajor;
    target?: AngularMajor;
  } = {},
): AngularLiveExecution {
  const source = context.source ?? 11;
  const target = context.target ?? 12;

  if (kind === "BASELINE") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "baseline-source-identity",
          label: "Bind source repository identity",
          node: "baseline.source_identity",
          detail:
            "Bind the approved Angular 11 CRUD source revision and immutable source fingerprint.",
          durationMs: 1600,
          kind: "SYSTEM",
          logs: [
            "Repository: cornflourblue/angular-11-crud-example",
            "Revision: eda3cf6278c02e4fb65f91ec73a9281d4325514e",
            "Source application: angular-crud-example",
            "Immutable source fingerprint recorded.",
          ],
        },
        {
          id: "baseline-manifest",
          label: "Inspect Angular workspace manifests",
          node: "baseline.manifest_inspection",
          detail:
            "Read package.json, angular.json, TypeScript configuration, and lockfile authority.",
          durationMs: 1700,
          kind: "SYSTEM",
          logs: [
            "package.json: Angular 11.0.4 · Angular CLI 11.0.4",
            "build-angular 0.1100.4 · TypeScript 4.0.2",
            "RxJS 6.6.x · zone.js 0.10.x",
            "angular.json: 1 application project · angular-crud-example",
            "builder=@angular-devkit/build-angular:browser · AOT enabled",
            "package-lock.json authority confirmed.",
          ],
        },
        {
          id: "baseline-workspace",
          label: "Create isolated baseline workspace",
          node: "baseline.workspace.create",
          detail:
            "Copy the immutable source snapshot into a governed baseline workspace.",
          durationMs: 1500,
          kind: "SYSTEM",
          logs: [
            "Creating isolated baseline workspace...",
            "Read-only source boundary preserved.",
            "Workspace fingerprint bound to approved source revision.",
          ],
        },
        {
          id: "baseline-install",
          label: "Clean lockfile install",
          node: "command.baseline_install",
          detail: "Install exactly from the committed package-lock.json.",
          durationMs: 3000,
          kind: "COMMAND",
          command: "npm ci",
          logs: [
            "$ npm ci",
            "Lockfile authority: package-lock.json",
            "28 manifest package entries resolved.",
            "Angular 11 dependency tree materialized.",
            "exit code 0",
          ],
        },
        {
          id: "baseline-build",
          label: "Production baseline build",
          node: "command.baseline_build",
          detail:
            "Build the Angular 11 application with its production configuration and budgets.",
          durationMs: 3000,
          kind: "COMMAND",
          command: "npm run build -- --prod",
          logs: [
            "$ npm run build -- --prod",
            "Builder: @angular-devkit/build-angular:browser",
            "AOT compilation enabled.",
            "Production file replacement: environment.prod.ts",
            "Initial bundle budget: warning 500kb · error 1mb",
            "Browser application bundle generation complete.",
            "exit code 0",
          ],
        },
        {
          id: "baseline-tests",
          label: "Karma/Jasmine baseline test discovery",
          node: "command.baseline_test",
          detail:
            "Start the configured Karma/Jasmine/Chrome harness and freeze the source test-coverage fact.",
          durationMs: 2500,
          kind: "COMMAND",
          command: "npm test -- --watch=false --browsers=ChromeHeadless",
          logs: [
            "$ npm test -- --watch=false --browsers=ChromeHeadless",
            "Karma 5.1 · Jasmine 3.6 · Chrome launcher configured.",
            "src/test.ts recursively searches for src/**/*.spec.ts.",
            "No src/**/*.spec.ts unit specs discovered in the source revision.",
            "Unit-test coverage gap recorded as known baseline evidence.",
          ],
        },
        {
          id: "baseline-lint",
          label: "TSLint/Codelyzer baseline lint",
          node: "command.baseline_lint",
          detail:
            "Run the source lint authority exactly as configured by Angular 11.",
          durationMs: 1800,
          kind: "COMMAND",
          command: "npm run lint",
          logs: [
            "$ npm run lint",
            "TSLint 6.1 configuration loaded.",
            "Codelyzer 6 Angular rules loaded.",
            "Application/spec/e2e TypeScript configs included.",
            "Baseline lint evidence finalized.",
          ],
        },
        {
          id: "baseline-parity",
          label: "Freeze baseline behavior and test topology",
          node: "baseline.parity.aggregate",
          detail:
            "Aggregate build, lint, routing, and test evidence before G03 qualification.",
          durationMs: 1500,
          kind: "SYSTEM",
          logs: [
            "Protractor 7 E2E configuration detected.",
            "e2e/src/app.e2e-spec.ts present.",
            "Chrome direct-connect E2E authority recorded.",
            "Build/lint/test topology evidence aggregated.",
          ],
        },
        {
          id: "baseline-qualification",
          label: "Qualify baseline for G03",
          node: "baseline.qualification.complete",
          detail:
            "Classify reproducibility and known coverage gaps for human baseline acceptance.",
          durationMs: 1400,
          kind: "SYSTEM",
          logs: [
            "Baseline reproducibility: qualified.",
            "Known gap: Karma harness configured with no source unit specs.",
            "Legacy E2E authority: Protractor 7.",
            "G03 evidence package finalized.",
          ],
        },
      ],
    };
  }

  if (kind === "ANALYSIS") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "analysis-inputs",
          label: "Freeze deterministic analysis inputs",
          node: "analysis.input_manifest",
          detail:
            "Bind the accepted baseline, source revision, manifests, and code-context evidence.",
          durationMs: 1000,
          kind: "SYSTEM",
          logs: [
            "Binding repository revision " + ANGULAR11_CRUD_SOURCE.revision,
            "Accepted G03 baseline evidence attached.",
            "package.json · angular.json · tsconfig.json registered.",
            "Analysis input manifest checksum finalized.",
          ],
        },
        {
          id: "analysis-topology",
          label: "Scan application/module topology",
          node: "analysis.topology_scan",
          detail:
            "Classify NgModules, components, feature boundaries, and lazy loading.",
          durationMs: 2400,
          kind: "SYSTEM",
          logs: [
            "Reading src/app/app.module.ts",
            "AppModule: BrowserModule · ReactiveFormsModule · HttpClientModule",
            "Reading src/app/app-routing.module.ts",
            "Lazy feature boundary detected: UsersModule",
            "Reading src/app/users/users.module.ts",
            "UsersModule declares LayoutComponent · ListComponent · AddEditComponent",
            "Topology: 1 Angular CLI application · 1 lazy feature module.",
          ],
        },
        {
          id: "analysis-route-service",
          label: "Extract routes and CRUD service contract",
          node: "analysis.route_service_scan",
          detail:
            "Map user-facing routes and HTTP operations that must remain behaviorally equivalent.",
          durationMs: 2500,
          kind: "SYSTEM",
          logs: [
            "Route / → HomeComponent",
            "Route /users → lazy UsersModule",
            "Route /users/add → AddEditComponent",
            "Route /users/edit/:id → AddEditComponent",
            "Reading src/app/_services/user.service.ts",
            "UserService CRUD contract: GET collection · GET by id · POST · PUT · DELETE",
            "Environment API base URL: http://localhost:4000/users",
          ],
        },
        {
          id: "analysis-forms-http",
          label: "Inspect forms, HTTP, and interceptor behavior",
          node: "analysis.forms_http_scan",
          detail:
            "Identify Reactive Forms validation and HTTP/interceptor semantics that migrations must preserve.",
          durationMs: 2500,
          kind: "SYSTEM",
          logs: [
            "Reading src/app/users/add-edit.component.ts",
            "ReactiveFormsModule · Validators.required · Validators.email · Validators.minLength(6)",
            "Cross-field MustMatch(password, confirmPassword) validator detected.",
            "HttpClientModule and ErrorInterceptor registered in AppModule.",
            "Development HTTP interceptor persists CRUD users in localStorage.",
            "Development API responses intentionally delayed by 500ms.",
            "Legacy RxJS throwError(value) call shape detected in error handling.",
          ],
        },
        {
          id: "analysis-tooling",
          label: "Inspect test and legacy tooling",
          node: "analysis.tooling_scan",
          detail:
            "Classify source testing/lint tools that require governed transitions on later Angular majors.",
          durationMs: 1700,
          kind: "SYSTEM",
          logs: [
            "Karma 5.1 + Jasmine 3.6 + Chrome launcher configured.",
            "No src/**/*.spec.ts unit specs found in source tree.",
            "TSLint 6.1 + Codelyzer 6 lint authority detected.",
            "Protractor 7 E2E suite detected.",
            "strict=true · strictTemplates=true in TypeScript/Angular compiler configuration.",
          ],
        },
        {
          id: "analysis-proposer",
          label: "Analysis Proposer",
          node: "analysis.phase_proposer",
          detail:
            "Interpret the deterministic repository evidence and produce structured migration findings.",
          durationMs: 3500,
          kind: "LLM",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_proposer",
          logs: [
            "Azure OpenAI invocation started.",
            "role=phase_proposer deployment=gpt-5-mini",
            "Repository evidence: modules · routes · services · forms · tooling.",
            "NgModule preservation and lazy-route invariants classified.",
            "RxJS/tooling modernization findings generated.",
            "Structured analysis response received.",
          ],
        },
        {
          id: "analysis-reviewer-input",
          label: "Bind proposer output",
          node: "analysis.reviewer_input",
          detail:
            "Checksum the proposer result and bind source evidence before independent review.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: [
            "Proposer output checksum recorded.",
            "Finding-to-source evidence links validated.",
            "Independent reviewer package prepared.",
          ],
        },
        {
          id: "analysis-reviewer",
          label: "Independent Phase Reviewer",
          node: "analysis.phase_reviewer",
          detail:
            "Review migration findings for source fidelity, unsupported claims, and evidence coverage.",
          durationMs: 3400,
          kind: "REVIEWER",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_reviewer",
          logs: [
            "Azure OpenAI reviewer invocation started.",
            "role=phase_reviewer deployment=gpt-5-mini",
            "Verified Angular 11.0.4 / CLI 11.0.4 source identity.",
            "Verified UsersModule lazy routing and Reactive Forms invariants.",
            "Verified TSLint/Codelyzer and Protractor migration-required findings.",
            "review verdict=accept",
          ],
        },
        {
          id: "analysis-finalize",
          label: "Finalize G04 evidence package",
          node: "analysis.g04.finalize",
          detail:
            "Persist application profile, migration findings, LLM provenance, usage, and immutable evidence.",
          durationMs: 1300,
          kind: "SYSTEM",
          logs: [
            "Application profile persisted.",
            "Migration findings persisted with evidence references.",
            "Proposer/reviewer usage ledger recorded.",
            "G04 review boundary opened.",
          ],
        },
      ],
    };
  }

  if (kind === "FEASIBILITY") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "compat-core",
          label: "Evaluate Angular compatibility",
          node: "compatibility.core",
          detail: "Check Angular/TypeScript/RxJS compatibility for the requested route.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: ["Angular family compatibility supported.", "TypeScript/RxJS envelope accepted."],
        },
        {
          id: "compat-runtime",
          label: "Resolve runtime compatibility",
          node: "compatibility.runtime",
          detail: "Check certified Node/npm profiles across adjacent-major stages.",
          durationMs: 800,
          kind: "SYSTEM",
          logs: ["Runtime catalogue loaded.", "Certified stage runtime candidates resolved."],
        },
        {
          id: "compat-third-party",
          label: "Scan third-party compatibility",
          node: "compatibility.third_party",
          detail: "Classify compatible, migration-required, and review-required dependencies.",
          durationMs: 900,
          kind: "SYSTEM",
          logs: ["42 third-party packages inspected.", "2 migration-required · 1 review-required."],
        },
        {
          id: "compat-finalize",
          label: "Finalize G05 readiness",
          node: "compatibility.g05.finalize",
          detail: "Bind compatibility and lockfile evidence for human review.",
          durationMs: 600,
          kind: "SYSTEM",
          logs: ["Lockfile authority confirmed.", "G05 readiness package finalized."],
        },
      ],
    };
  }

  if (kind === "PLANNING") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "planning-inputs",
          label: "Resolve deterministic Planning inputs",
          node: "planning.inputs.resolve",
          detail:
            "Bind the accepted G05 package, source exact version, route, catalogue, runtime facts, builder, scripts, baseline results, and physical workspace fingerprint.",
          durationMs: 3200,
          kind: "SYSTEM",
          logs: [
            "G05 accepted compatibility evidence bound.",
            "Source exact: Angular 11.0.4.",
            "Workspace: angular-crud-example · builder=@angular-devkit/build-angular:browser.",
            "Package manager: npm · lockfile authority: package-lock.json.",
            "Catalogue authority: catalog-v4.",
            "Physical workspace fingerprint attached.",
          ],
        },
        {
          id: "planning-route",
          label: "Build deterministic MigrationPlan",
          node: "planning.route.build",
          detail:
            "Generate the full adjacent-major route and immutable migration-level policies without authorizing execution.",
          durationMs: 3600,
          kind: "SYSTEM",
          logs: [
            "Mode: strict_compatibility.",
            "Route: angular-11.x → 12.x → 13.x → 14.x → 15.x → 16.x → 17.x → 18.x → 19.x → 20.x → 21.x.",
            "stage_plan_strategy=resolve_exact_before_each_stage",
            "approval_policy=mandatory-human-v1",
            "command_policy=structured-registry-v1",
            "artifact_policy=immutable-stage-scoped-v1",
            "transformer_semantic_version=transformer-plan-v2.2-proven-1",
            "run_mode=PRODUCTION",
          ],
        },
        {
          id: "planning-first-stage",
          label: "Resolve exact first StageExecutionPlan",
          node: "planning.first_stage.resolve",
          detail:
            "Materialize only the first exact adjacent-major stage from catalog-v4; later stages resolve from each sealed predecessor.",
          durationMs: 4200,
          kind: "SYSTEM",
          logs: [
            "Stage: angular-11.x → angular-12.x.",
            "Exact cohort: 11.0.4 → 12.2.17 · CLI 12.2.18.",
            "Runtime proof: Node 12.22.12 · npm 8.19.4.",
            "Target cohort: TypeScript 4.3.5 · RxJS 6.6.7 · zone.js 0.11.8.",
            "Observed proof source: dev-runtimes-real-e2e.",
            "execution_profile_id bound to exact runtime authority.",
          ],
        },
        {
          id: "planning-command-contract",
          label: "Build structured command contract",
          node: "planning.command_contract",
          detail:
            "Bind registry-backed command groups, working-directory aliases, timeouts, network profiles, cancellation policy, and parameter bindings; never raw shell authority.",
          durationMs: 4500,
          kind: "SYSTEM",
          logs: [
            "Structured command references use shell=false.",
            "Working directory alias bound to governed stage workspace.",
            "Cancellation policy: terminate_process_tree.",
            "Bootstrap/final-install/build/test/lint authorities resolved from registered scripts and builder targets.",
            "PROVEN semantics forbid prebinding legacy combined angular_update and migrate_packages groups.",
            "Command contract checksum finalized.",
          ],
        },
        {
          id: "planning-policy-contract",
          label: "Bind validation, recovery, repair, and forbidden-change policies",
          node: "planning.policy_contract",
          detail:
            "Bind the policy set that limits what Transformer and governed repair may execute after G06.",
          durationMs: 3600,
          kind: "SYSTEM",
          logs: [
            "validation_policy=angular-stage-standard-v2",
            "recovery_policy=safe-boundary-v1",
            "repair_policy=proposer-reviewer-human-v1",
            "Repair requires proposer + reviewer + human apply approval.",
            "Forbidden: force dependency resolution.",
            "Forbidden optional migrations: standalone · signals · control-flow · zoneless.",
            "Build system decision: preserve @angular-devkit/build-angular:browser.",
          ],
        },
        {
          id: "planning-checksums",
          label: "Freeze deterministic plan bindings",
          node: "planning.checksum_binding",
          detail:
            "Checksum MigrationPlan, first StageExecutionPlan, prerequisite artifact set, and workspace binding before LLM explanation.",
          durationMs: 2800,
          kind: "SYSTEM",
          logs: [
            "MigrationPlan checksum finalized.",
            "StageExecutionPlan checksum finalized.",
            "Artifact-set checksum finalized.",
            "Workspace fingerprint preserved.",
            "Deterministic plan binding ready for Planning Proposer.",
          ],
        },
        {
          id: "planning-proposer",
          label: "Planning Proposer",
          node: "planning.phase_proposer",
          detail:
            "Explain only the deterministic migration and stage plans, including rationale, risks, and unresolved questions; the LLM cannot change commands, versions, checksums, or approvals.",
          durationMs: 7200,
          kind: "LLM",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_proposer",
          logs: [
            "Azure OpenAI invocation started.",
            "role=phase_proposer task=plan_rationale prompt=planning_agent_v1",
            "Trusted context: MigrationPlan + StageExecutionPlan + deterministic checksum binding.",
            "Generated rationale for adjacent-major execution and exact-first-stage strategy.",
            "Material risks documented: legacy lint/E2E transition, sparse unit coverage, runtime drift, third-party compatibility.",
            "Unresolved questions bounded to later governed validation.",
            "Structured PlanningNarrative schema validation PASS.",
          ],
        },
        {
          id: "planning-reviewer-input",
          label: "Bind proposer output for independent review",
          node: "planning.reviewer_input",
          detail:
            "Persist the proposer checksum and expose the narrative as untrusted reviewer context while preserving trusted deterministic bindings.",
          durationMs: 2200,
          kind: "SYSTEM",
          logs: [
            "Planning proposer output checksum recorded.",
            "Deterministic plan checksum copied into reviewer package.",
            "Proposer output marked untrusted reviewer context.",
            "Reviewer binding package finalized.",
          ],
        },
        {
          id: "planning-reviewer",
          label: "Independent Planning Reviewer",
          node: "planning.phase_reviewer",
          detail:
            "Review explanation accuracy, evidence coverage, material risks, policy consistency, and checksum bindings without authoring or replacing the deterministic plan.",
          durationMs: 6800,
          kind: "REVIEWER",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_reviewer",
          logs: [
            "Azure OpenAI reviewer invocation started.",
            "role=phase_reviewer task=planning_review prompt=planning_reviewer_v1",
            "Verified full route and resolve_exact_before_each_stage strategy.",
            "Verified first-stage exact cohort and runtime evidence.",
            "Verified validation/recovery/repair/forbidden-change policies.",
            "No unsupported execution claim detected.",
            "review decision=accept · confidence=HIGH",
          ],
        },
        {
          id: "planning-package",
          label: "Finalize immutable G06 Planning package",
          node: "planning.package.finalize",
          detail:
            "Persist plan version, stage-plan binding, proposer/reviewer outputs and checksums, usage, revision count, and workspace fingerprint before opening G06.",
          durationMs: 3900,
          kind: "SYSTEM",
          logs: [
            "PlanningPackage review_status=accepted.",
            "Plan version=1 · revision_count=0.",
            "Proposer/reviewer usage ledger recorded.",
            "Package checksum bound to plan + stage plan + artifact set + workspace fingerprint.",
            "G06 Migration Plan review boundary opened.",
          ],
        },
      ],
    };
  }

  if (kind === "STAGE_PREPARATION") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "runtime-resolve",
          label: "Resolve stage runtime",
          node: "stage.runtime.resolve",
          detail: `Resolve Node/npm/Angular CLI authority for Angular ${source} → ${target}.`,
          durationMs: 900,
          kind: "SYSTEM",
          logs: ["Compatibility catalogue consulted.", "Exact runtime candidate selected."],
        },
        {
          id: "runtime-certify",
          label: "Certify runtime binding",
          node: "stage.runtime.certify",
          detail: "Verify the selected runtime profile is certified for this transition.",
          durationMs: 900,
          kind: "SYSTEM",
          logs: ["Runtime checksum verified.", "Runtime certification PASS."],
        },
        {
          id: "workspace-materialize",
          label: "Materialize stage workspace",
          node: "stage.workspace.prepare",
          detail: "Create the contained stage sandbox from the accepted source authority.",
          durationMs: 900,
          kind: "SYSTEM",
          logs: ["Stage sandbox copied.", "Workspace fingerprint bound."],
        },
        {
          id: "stage-preflight",
          label: "Run dependency preflight",
          node: "stage.dependency_preflight",
          detail: "Validate dependency and command authority before G07.",
          durationMs: 800,
          kind: "SYSTEM",
          logs: ["Dependency preflight PASS.", "G07 stage-start evidence finalized."],
        },
      ],
    };
  }

  if (kind === "REPAIR_REVIEW") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "repair-failure-freeze",
          label: "Freeze failure evidence",
          node: "repair.failure_evidence.freeze",
          detail:
            "Bind the failed test execution, normalized diagnostics, workspace fingerprint, and immutable failure checksum before any model sees context.",
          durationMs: 5000,
          kind: "SYSTEM",
          logs: [
            "Failed validation execution bound to one immutable command result.",
            "Failure evidence fingerprint finalized.",
            "Relevant source target: setup-jest.ts.",
            "Historical dependency and request-changes lineage attached.",
          ],
        },
        {
          id: "repair-owner-route",
          label: "Bind Main Repair ownership",
          node: "repair.failure_owner.bind",
          detail:
            "Route only the explicit source-repair failure to MAIN_REPAIR; dependency and lock failures remain with deterministic owners.",
          durationMs: 3000,
          kind: "SYSTEM",
          logs: [
            "failure_phase=MAIN_REPAIR",
            "failure_owner=MAIN_REPAIR_LLM",
            "Prior attempt 3 review=request_changes.",
            "Child repair lineage prepared from current workspace authority.",
          ],
        },
        {
          id: "repair-context-pack",
          label: "Build bounded repair context",
          node: "repair.context_pack.freeze",
          detail:
            "Expose only bounded failure evidence and authoritative relevant files; previous proposals remain reference-only.",
          durationMs: 5000,
          kind: "SYSTEM",
          logs: [
            "Bounded context pack created.",
            "Current workspace preimage is authoritative.",
            "Arbitrary shell, lockfile edits, path escapes, and policy bypasses are forbidden.",
          ],
        },
        {
          id: "repair-proposer",
          label: "Main Repair LLM · Repair Proposer",
          node: "repair.propose_repair",
          detail:
            "Author one minimal typed candidate from the frozen source failure context. The model does not execute or apply it.",
          durationMs: 12000,
          kind: "LLM",
          provider: "azure_openai",
          role: "repair_proposer",
          logs: [
            "role=repair_proposer task=repair_diagnosis",
            "Current authoritative target: setup-jest.ts",
            "operation=replace_text",
            "Legacy setup-jest import identified as the causal source surface.",
            "Candidate replaces the legacy import with setupZoneTestEnv from jest-preset-angular/setup-env/zone.",
            "Structured repair proposal received.",
          ],
        },
        {
          id: "repair-causal-bind",
          label: "Validate and bind candidate",
          node: "repair.causal_review",
          detail:
            "Schema-check the proposal, bind the exact preimage/postimage and candidate diff, then verify causal fit before review.",
          durationMs: 5000,
          kind: "SYSTEM",
          logs: [
            "Proposal schema validation PASS.",
            "replace_text preimage is unique in setup-jest.ts.",
            "Candidate diff checksum finalized.",
            "Causal review PASS.",
          ],
        },
        {
          id: "repair-reviewer",
          label: "Independent Reviewer",
          node: "repair.review_repair",
          detail:
            "Critique causal fit, policy compliance, risk, and required validation targets without changing or applying the candidate.",
          durationMs: 10000,
          kind: "REVIEWER",
          provider: "azure_openai",
          role: "repair_reviewer",
          logs: [
            "role=repair_reviewer task=repair_review",
            "Verified candidate targets the recorded source failure.",
            "No command authority or unrelated dependency mutation detected.",
            "Required validation: affected test, clean install, full build, full tests.",
            "review decision=accept · risk=LOW",
          ],
        },
        {
          id: "repair-g10-package",
          label: "Finalize G10 repair package",
          node: "repair.create_g10",
          detail:
            "Bind failure, proposal, diff, review, workspace fingerprint, parent lineage, and validation targets into the human approval package.",
          durationMs: 5000,
          kind: "SYSTEM",
          logs: [
            "Proposal checksum bound.",
            "Reviewer checksum bound.",
            "Parent request-changes lineage bound.",
            "G10 package finalized.",
            "No workspace mutation has occurred.",
          ],
        },
      ],
    };
  }

  if (kind === "REPAIR_VALIDATION") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "repair-apply-prepare",
          label: "Verify approved G10 package",
          node: "repair.apply_prepare",
          detail:
            "Recheck proposal/review checksums, expected workspace fingerprint, parent lineage, and exact preimage before mutation.",
          durationMs: 7000,
          kind: "SYSTEM",
          logs: [
            "G10 decision=APPROVE verified.",
            "Approved package checksum matches the persisted repair candidate.",
            "Workspace fingerprint unchanged since review.",
            "Exact setup-jest.ts preimage verified.",
          ],
        },
        {
          id: "repair-apply",
          label: "Apply typed source repair",
          node: "repair.apply_repair",
          detail:
            "PatchApplyService applies only the approved replace_text operation; no model or UI supplies execution authority.",
          durationMs: 8000,
          kind: "SYSTEM",
          logs: [
            "Applying replace_text to setup-jest.ts.",
            "Unique preimage match confirmed.",
            "Approved postimage written inside the governed stage workspace.",
            "Apply ledger finalized.",
          ],
        },
        {
          id: "repair-postimage",
          label: "Verify repair post-state",
          node: "repair.verify_repair",
          detail:
            "Verify the expected postimage, workspace fingerprint change, and apply ledger before any validation command runs.",
          durationMs: 9000,
          kind: "SYSTEM",
          logs: [
            "setup-jest.ts postimage checksum verified.",
            "Workspace fingerprint advanced exactly once.",
            "No unrelated file mutation detected.",
            "Repair post-state verification PASS.",
          ],
        },
        {
          id: "repair-install",
          label: "Materialize clean dependency closure",
          node: "repair.final_install",
          detail:
            "Run the governed clean install against the already approved manifest and lock authority before tests.",
          durationMs: 26000,
          kind: "COMMAND",
          command: "npm ci",
          logs: [
            "$ npm ci",
            "package-lock.json authority accepted.",
            "Installed dependency closure materialized.",
            "exit code 0",
          ],
        },
        {
          id: "repair-affected-validation",
          label: "Run affected validation first",
          node: "repair.revalidate_affected",
          detail:
            "Re-run the Jest validation target that exposed the legacy setup import before the full replay.",
          durationMs: 18000,
          kind: "COMMAND",
          command: "npm test -- --watch=false",
          logs: [
            "$ npm test -- --watch=false",
            "Jest environment loaded.",
            "setupZoneTestEnv initialized.",
            "Affected validation PASS.",
          ],
        },
        {
          id: "repair-full-build",
          label: "Replay full production build",
          node: "repair.validation.build",
          detail:
            "Run the full governed production build against the repaired clean generation.",
          durationMs: 23000,
          kind: "COMMAND",
          command: "npm run build -- --configuration production",
          logs: [
            "$ npm run build -- --configuration production",
            "Angular production compilation completed.",
            "Build validation PASS.",
            "exit code 0",
          ],
        },
        {
          id: "repair-full-test",
          label: "Replay full test validation",
          node: "repair.validation.test",
          detail:
            "Run the complete configured test authority after the affected target has passed.",
          durationMs: 22000,
          kind: "COMMAND",
          command: "npm test -- --watch=false",
          logs: [
            "$ npm test -- --watch=false",
            "Complete governed test target executed.",
            "Full validation PASS.",
            "exit code 0",
          ],
        },
        {
          id: "repair-finalize",
          label: "Finalize G11 post-state evidence",
          node: "repair.create_g11",
          detail:
            "Bind apply verification, clean install, affected validation, full build/test results, and final workspace fingerprint for human G11 acceptance.",
          durationMs: 7000,
          kind: "SYSTEM",
          logs: [
            "Repair validation summary finalized.",
            "Final workspace fingerprint bound.",
            "Repair attempt status=validation_passed.",
            "G11 package ready for human review.",
          ],
        },
      ],
    };
  }

  return {
    id: id(kind, startedAtMs),
    kind,
    status: "RUNNING",
    startedAtMs,
    steps: [
      {
        id: "source-proof",
        label: "Source Proof",
        node: "transformer.source_proof",
        detail: `Freeze source authority for Angular ${source} → ${target}.`,
        durationMs: 1200,
        kind: "COMMAND",
        logs: ["Source install verified.", "Source build/tests captured.", "Source baseline frozen."],
      },
      {
        id: "discovery",
        label: "Discovery",
        node: "transformer.discovery",
        detail: "Run disposable Angular CLI migration discovery.",
        durationMs: 1200,
        kind: "COMMAND",
        logs: ["Disposable discovery workspace created.", "Angular CLI authority proven.", "Migration discovery evidence frozen."],
      },
      {
        id: "dependency-resolution",
        label: "Dependency Resolution",
        node: "transformer.dependency_resolution",
        detail: "Resolve target dependency intent using preserve-first lockfile policy.",
        durationMs: 1300,
        kind: "COMMAND",
        logs: ["Target dependency plan generated.", "Lockfile authority preserved.", "Dependency resolution completed."],
      },
      {
        id: "migration",
        label: "Migration",
        node: "transformer.migration",
        detail: "Execute package-owner migration commands inside the governed workspace.",
        durationMs: 1700,
        kind: "COMMAND",
        command: `ng update Angular ${source} → ${target}`,
        logs: ["Target workspace materialized.", "Migration ledger opened.", "Owner migration commands executed.", "Target authority frozen."],
      },
      {
        id: "target-proof",
        label: "Target Proof",
        node: "transformer.target_proof",
        detail: "Prove target versions, dependency tree, and candidate identity.",
        durationMs: 1100,
        kind: "COMMAND",
        logs: ["Target dependency tree captured.", `Angular ${target} version proof PASS.`, "Candidate fingerprint recorded."],
      },
      {
        id: "validation",
        label: "Validation",
        node: "transformer.validation",
        detail: "Run clean install, build, tests, and diagnostic delta aggregation.",
        durationMs: 1800,
        kind: "COMMAND",
        logs:
          source === 13 && target === 14
            ? [
                "Clean validation generation created.",
                "npm ci --include=optional completed.",
                "Build completed.",
                "Karma test validation started.",
                "OrderService compatibility expectation failed.",
                "Failure evidence frozen for governed repair.",
              ]
            : [
                "Clean validation generation created.",
                "npm ci --include=optional completed.",
                "Build completed.",
                "Tests completed.",
                "Diagnostic delta aggregated.",
              ],
      },
    ],
  };
}
