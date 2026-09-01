import type {
  AngularLiveExecution,
  AngularLiveExecutionKind,
} from "../domain/run-types.ts";
import type { AngularMajor } from "../domain/types.ts";

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
          id: "baseline-workspace",
          label: "Create isolated baseline workspace",
          node: "baseline.workspace.create",
          detail: "Copy the immutable source snapshot into a governed baseline workspace.",
          durationMs: 900,
          kind: "SYSTEM",
          logs: [
            "Resolving approved source snapshot...",
            "Creating isolated baseline workspace...",
            "Workspace fingerprint recorded.",
          ],
        },
        {
          id: "baseline-prequalify",
          label: "Prequalify source baseline",
          node: "baseline.prequalify",
          detail: "Validate project structure and runtime eligibility before installation.",
          durationMs: 800,
          kind: "SYSTEM",
          logs: [
            "Reading angular.json and package metadata...",
            "Source family Angular 11 confirmed.",
            "Baseline prequalification passed.",
          ],
        },
        {
          id: "baseline-install",
          label: "Clean lockfile install",
          node: "command.baseline_install",
          detail: "Execute the authorized install against package-lock.json.",
          durationMs: 1200,
          kind: "COMMAND",
          command: "npm ci --include=optional",
          logs: [
            "$ npm ci --include=optional",
            "Lockfile authority: package-lock.json",
            "added 1287 packages",
            "exit code 0",
          ],
        },
        {
          id: "baseline-build",
          label: "Build baseline",
          node: "command.baseline_build",
          detail: "Prove the source application builds before migration.",
          durationMs: 1200,
          kind: "COMMAND",
          command: "npm run build",
          logs: [
            "$ npm run build",
            "Angular compilation started...",
            "Browser application bundle generation complete.",
            "exit code 0",
          ],
        },
        {
          id: "baseline-tests",
          label: "Run baseline tests",
          node: "command.baseline_test",
          detail: "Capture source test behavior and known failures.",
          durationMs: 1200,
          kind: "COMMAND",
          command: "npm test -- --watch=false",
          logs: [
            "$ npm test -- --watch=false",
            "ChromeHeadless connected",
            "1 known source warning classified",
            "baseline test evidence finalized",
          ],
        },
        {
          id: "baseline-parity",
          label: "Generate parity evidence",
          node: "baseline.parity.aggregate",
          detail: "Compare build/test behavior with the immutable source snapshot.",
          durationMs: 800,
          kind: "SYSTEM",
          logs: [
            "Aggregating install, build, and test evidence...",
            "Known source warning preserved as baseline fact.",
            "Parity evidence checksum finalized.",
          ],
        },
        {
          id: "baseline-qualification",
          label: "Qualify baseline for G03",
          node: "baseline.qualification.complete",
          detail: "Classify the baseline before human acceptance.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: [
            "Baseline outcome: qualified with known failures.",
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
          detail: "Bind registered source/baseline artifacts to the analysis attempt.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: [
            "Selecting registered evidence references...",
            "Sanitizing deterministic context...",
            "Input manifest checksum finalized.",
          ],
        },
        {
          id: "analysis-proposer",
          label: "Analysis Proposer",
          node: "analysis.phase_proposer",
          detail: "Generate structured interpretation from bounded evidence.",
          durationMs: 1800,
          kind: "LLM",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_proposer",
          logs: [
            "Azure OpenAI invocation started",
            "role=phase_proposer deployment=gpt-5-mini",
            "structured response received",
            "analysis schema validation passed",
          ],
        },
        {
          id: "analysis-reviewer-input",
          label: "Bind proposer output",
          node: "analysis.reviewer_input",
          detail: "Checksum the proposer result before independent review.",
          durationMs: 500,
          kind: "SYSTEM",
          logs: [
            "Proposer output checksum recorded.",
            "Reviewer evidence package prepared.",
          ],
        },
        {
          id: "analysis-reviewer",
          label: "Independent Phase Reviewer",
          node: "analysis.phase_reviewer",
          detail: "Review proposer reasoning and evidence coverage independently.",
          durationMs: 1600,
          kind: "REVIEWER",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_reviewer",
          logs: [
            "Azure OpenAI reviewer invocation started",
            "role=phase_reviewer deployment=gpt-5-mini",
            "review verdict=accept",
            "reviewer checksum finalized",
          ],
        },
        {
          id: "analysis-finalize",
          label: "Finalize G04 evidence package",
          node: "analysis.g04.finalize",
          detail: "Persist sanitized provenance, usage, reviewer result, and immutable evidence.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: [
            "Usage ledger recorded.",
            "Analysis package finalized.",
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
