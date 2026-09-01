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
          id: "plan-context",
          label: "Build planning context",
          node: "planning.context",
          detail: "Bind route, compatibility, runtime, and stage-knowledge evidence.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: ["Adjacent-major route bound.", "Stage knowledge and runtime catalogue attached."],
        },
        {
          id: "plan-proposer",
          label: "Planning Proposer",
          node: "planning.phase_proposer",
          detail: "Generate the structured migration and stage execution plan.",
          durationMs: 1800,
          kind: "LLM",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_proposer",
          logs: [
            "Azure OpenAI invocation started",
            "role=phase_proposer deployment=gpt-5-mini",
            "migration route plan generated",
            "stage execution contract generated",
          ],
        },
        {
          id: "plan-validate",
          label: "Validate structured plan",
          node: "planning.contract_validation",
          detail: "Validate route, commands, runtime bindings, and artifact references.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: ["Plan schema valid.", "Structured command references accepted."],
        },
        {
          id: "plan-reviewer",
          label: "Independent Planning Reviewer",
          node: "planning.phase_reviewer",
          detail: "Review the plan and execution contract before G06.",
          durationMs: 1600,
          kind: "REVIEWER",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_reviewer",
          logs: [
            "Azure OpenAI reviewer invocation started",
            "role=phase_reviewer deployment=gpt-5-mini",
            "review verdict=accept",
            "reviewer evidence finalized",
          ],
        },
        {
          id: "plan-finalize",
          label: "Finalize G06 package",
          node: "planning.g06.finalize",
          detail: "Persist plan revision, reviewer evidence, usage, and checksums.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: ["Plan revision #1 persisted.", "G06 review boundary opened."],
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

  if (kind === "REPAIR_VALIDATION") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "repair-apply",
          label: "Apply reviewed repair",
          node: "repair.apply",
          detail: "Apply the checksum-bound reviewed source patch in the stage workspace.",
          durationMs: 900,
          kind: "COMMAND",
          logs: ["Repair checksum verified.", "Reviewed source patch applied."],
        },
        {
          id: "repair-build",
          label: "Rebuild repaired candidate",
          node: "repair.validation.build",
          detail: "Run clean build validation after the bounded repair.",
          durationMs: 1100,
          kind: "COMMAND",
          command: "npm run build",
          logs: ["$ npm run build", "Build completed.", "exit code 0"],
        },
        {
          id: "repair-tests",
          label: "Retest repaired candidate",
          node: "repair.validation.test",
          detail: "Run the complete governed test target.",
          durationMs: 1100,
          kind: "COMMAND",
          command: "npm test -- --watch=false",
          logs: ["$ npm test -- --watch=false", "All governed tests passed."],
        },
        {
          id: "repair-finalize",
          label: "Finalize G11 evidence",
          node: "repair.g11.finalize",
          detail: "Bind repaired validation evidence for human acceptance.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: ["Repair effects verified.", "G11 repair-validation package finalized."],
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
