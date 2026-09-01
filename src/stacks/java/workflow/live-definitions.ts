import { paceLiveExecution } from "../../../domain/live-execution.ts";
import type {
  JavaLiveExecution,
  JavaLiveExecutionKind,
} from "../domain/run-types.ts";

function id(kind: JavaLiveExecutionKind, startedAtMs: number) {
  return "java-" + kind.toLowerCase().replaceAll("_", "-") + "-" + startedAtMs;
}

export function createJavaLiveExecution(
  kind: JavaLiveExecutionKind,
  startedAtMs: number,
  stage: number | null,
): JavaLiveExecution {
  const raw = createJavaLiveExecutionRaw(kind, startedAtMs, stage);
  return paceLiveExecution(raw, kind === "PLANNING_AGENT" ? 45_000 : 30_000);
}

function createJavaLiveExecutionRaw(
  kind: JavaLiveExecutionKind,
  startedAtMs: number,
  stage: number | null,
): JavaLiveExecution {
  const stageLabel = stage ? "Stage " + stage : "current stage";

  if (kind === "PREFLIGHT") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "preflight-setup",
          label: "Validate migration setup",
          node: "preflight.validate_setup",
          detail: "Validate project path, output boundary, profile route, and proof policy.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: [
            "Migration setup loaded.",
            "Project and output boundaries accepted.",
            "Profile route validation PASS.",
          ],
        },
        {
          id: "preflight-java",
          label: "Probe Java toolchains",
          node: "preflight.java_toolchains",
          detail: "Verify Java 11, Java 17, and Java 21 runtime availability.",
          durationMs: 900,
          kind: "COMMAND",
          command: "java -version",
          logs: [
            "JAVA11_HOME available",
            "JAVA17_HOME available",
            "JAVA21_HOME available",
            "toolchain readiness PASS",
          ],
        },
        {
          id: "preflight-maven",
          label: "Probe Maven",
          node: "preflight.maven",
          detail: "Verify the configured Maven execution authority.",
          durationMs: 800,
          kind: "COMMAND",
          command: "mvn -version",
          logs: [
            "$ mvn -version",
            "Apache Maven 3.9.15",
            "Maven execution authority READY",
          ],
        },
        {
          id: "preflight-ai",
          label: "Check AI role readiness",
          node: "preflight.ai_readiness",
          detail: "Verify proposer, reviewer, and fallback role configuration.",
          durationMs: 900,
          kind: "SYSTEM",
          logs: [
            "phase_proposer: gpt-5-mini READY",
            "phase_reviewer: Llama-3.3-70B-Instruct READY",
            "reviewer fallback: gpt-5-mini READY",
          ],
        },
      ],
    };
  }

  if (kind === "CANCELLATION") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "cancellation-check",
          label: "Check cancellation state",
          node: "orchestrator.cancellation_check",
          detail: "Confirm no cancellation request is pending before agent execution.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: [
            "No active cancellation request.",
            "Execution lease remains valid.",
            "Pipeline may continue.",
          ],
        },
      ],
    };
  }

  if (kind === "ANALYSIS_AGENT") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "analysis-context",
          label: "Build analysis context",
          node: "analysis.context_builder",
          detail: "Bind project facts, source profile, dependencies, and evidence checksums.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: [
            "Source profile evidence bound.",
            "POM and dependency context sanitized.",
            "Analysis context checksum finalized.",
          ],
        },
        {
          id: "analysis-proposer",
          label: "Analysis Proposer",
          node: "analysis.phase_proposer",
          detail: "Generate structured migration analysis from bounded evidence.",
          durationMs: 1800,
          kind: "LLM",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_proposer",
          logs: [
            "Azure OpenAI invocation started",
            "role=phase_proposer model=gpt-5-mini",
            "structured analysis received",
            "schema validation PASS",
          ],
        },
        {
          id: "analysis-reviewer",
          label: "Independent Analysis Reviewer",
          node: "analysis.phase_reviewer",
          detail: "Review proposer conclusions with an independent reviewer model.",
          durationMs: 1700,
          kind: "REVIEWER",
          provider: "azure_foundry",
          deployment: "Llama-3.3-70B-Instruct",
          role: "phase_reviewer",
          logs: [
            "Azure Foundry reviewer invocation started",
            "role=phase_reviewer model=Llama-3.3-70B-Instruct",
            "review verdict=accept",
            "reviewer evidence finalized",
          ],
        },
        {
          id: "analysis-finalize",
          label: "Finalize analysis revision",
          node: "analysis.revision_finalize",
          detail: "Persist revision lineage, reviewer result, and analysis evidence.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: [
            "Analysis revision persisted.",
            "Invocation ledger completed.",
            "analysis_review opened.",
          ],
        },
      ],
    };
  }

  if (kind === "PLANNING_AGENT") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "planning-inputs",
          label: "Bind accepted analysis and route authority",
          node: "planning.inputs.resolve",
          detail:
            "Bind the reviewed source profile, selected Spring Boot route, Java toolchains, Maven authority, analysis checksum, and proof policy.",
          durationMs: 3400,
          kind: "SYSTEM",
          logs: [
            "Accepted analysis revision loaded.",
            "Source profile bound: Spring Boot 2.1 / Java 11.",
            "Target profile bound: Spring Boot 4.0 / Java 21.",
            "Route stages bound: 2.1→2.7 · 2.7→3.5/J17 · J17→J21 · 3.5→4.0.",
            "Maven execution authority and proof level bound.",
          ],
        },
        {
          id: "planning-route",
          label: "Derive governed route plan",
          node: "planning.route.build",
          detail:
            "Resolve included, skipped, and excluded route stages without allowing the LLM to change migration scope.",
          durationMs: 3800,
          kind: "SYSTEM",
          logs: [
            "Stage 1: Spring Boot 2.1 → 2.7 on Java 11.",
            "Stage 2: Spring Boot 2.7 → 3.5 on Java 17.",
            "Stage 3: Java 17 → Java 21 while Spring Boot 3.5 remains stable.",
            "Stage 4: Spring Boot 3.5 → 4.0 on Java 21.",
            "Continuation policy=AUTO_ON_GREEN.",
          ],
        },
        {
          id: "planning-execution-units",
          label: "Build stage execution units",
          node: "planning.execution_units",
          detail:
            "Bind analysis, assessment, human approval, transform, Maven build/test, result-contract, and stage-report responsibilities.",
          durationMs: 4300,
          kind: "SYSTEM",
          logs: [
            "Execution unit: Analysis Agent + independent review.",
            "Execution unit: Planning Agent + independent review.",
            "Execution unit: Assessment Agent.",
            "Execution unit: mandatory Human Approval.",
            "Execution unit: Transform Agent.",
            "Execution unit: Maven Build Agent.",
            "Execution unit: Test Validation + governed Repair on failure.",
            "Execution unit: Result Contract + Stage Report.",
          ],
        },
        {
          id: "planning-maven",
          label: "Resolve Maven and dependency strategy",
          node: "planning.maven_contract",
          detail:
            "Bind Java home, Maven execution, POM authority, dependency-target comparison, and build/test commands for each governed stage.",
          durationMs: 3800,
          kind: "SYSTEM",
          logs: [
            "JAVA11_HOME/JAVA17_HOME/JAVA21_HOME remain backend-owned toolchain inputs.",
            "pom.xml remains the dependency authority.",
            "Compile/package authority: mvn clean package -DskipTests.",
            "Validation authority: mvn test.",
            "Target dependency versions remain reviewed before Stage 4 finalization.",
          ],
        },
        {
          id: "planning-validation",
          label: "Bind validation and repair policy",
          node: "planning.validation_contract",
          detail:
            "Define build/test proof, failure capture, proposer/reviewer repair, human approval, bounded attempts, and rollback expectations.",
          durationMs: 3800,
          kind: "SYSTEM",
          logs: [
            "Every stage requires Maven build + test evidence.",
            "Build/test failure freezes logs, code context, and checksums.",
            "Repair Proposer authors the candidate; Reviewer cannot replace it.",
            "Human approval is mandatory before repair apply.",
            "Repair attempts are scoped per route stage and capped at 3.",
            "Validation reruns after every applied repair.",
          ],
        },
        {
          id: "planning-proposer",
          label: "Planning Proposer",
          node: "planning.phase_proposer",
          detail:
            "Produce the structured planning rationale from deterministic route, Maven, runtime, assessment, validation, and repair constraints.",
          durationMs: 7200,
          kind: "LLM",
          provider: "azure_openai",
          deployment: "gpt-5-mini",
          role: "phase_proposer",
          logs: [
            "Azure OpenAI invocation started.",
            "role=phase_proposer model=gpt-5-mini",
            "Route rationale generated.",
            "Java/Maven/runtime constraints explained.",
            "Validation and repair responsibilities explained.",
            "No raw command or source-path execution authority granted to the model.",
            "Structured planning output validated.",
          ],
        },
        {
          id: "planning-reviewer-input",
          label: "Freeze proposer output for review",
          node: "planning.reviewer_input",
          detail:
            "Checksum the planning narrative and bind it to deterministic route and execution-unit evidence before review.",
          durationMs: 2200,
          kind: "SYSTEM",
          logs: [
            "Planning proposer checksum recorded.",
            "Route and execution-unit bindings preserved.",
            "Independent reviewer package finalized.",
          ],
        },
        {
          id: "planning-reviewer",
          label: "Independent Planning Reviewer",
          node: "planning.phase_reviewer",
          detail:
            "Review route order, Java/Maven requirements, human gates, validation coverage, repair boundaries, and unsupported claims.",
          durationMs: 6800,
          kind: "REVIEWER",
          provider: "azure_foundry",
          deployment: "Llama-3.3-70B-Instruct",
          role: "phase_reviewer",
          logs: [
            "Azure Foundry reviewer invocation started.",
            "role=phase_reviewer model=Llama-3.3-70B-Instruct",
            "Route order verified.",
            "Maven build/test proof verified.",
            "Human approval and repair boundaries verified.",
            "No scope-expanding plan action detected.",
            "review verdict=accept",
          ],
        },
        {
          id: "planning-finalize",
          label: "Finalize reviewed planning revision",
          node: "planning.package.finalize",
          detail:
            "Persist route plan, execution units, validation targets, constraints, proposer/reviewer provenance, checksum, and planning_review gate evidence.",
          durationMs: 3900,
          kind: "SYSTEM",
          logs: [
            "Planning revision persisted.",
            "Validation targets: build · test.",
            "Reviewer notes and constraints persisted.",
            "Invocation ledger completed.",
            "planning_review opened.",
          ],
        },
      ],
    };
  }

  if (kind === "ASSESSMENT_AGENT") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "assessment-policy",
          label: "Assess execution readiness",
          node: "assessment.policy_check",
          detail: "Evaluate accepted plan, runtime profile, risk, and proof requirements.",
          durationMs: 900,
          kind: "SYSTEM",
          logs: [
            "Accepted plan revision bound.",
            "Risk and runtime policies evaluated.",
            "Assessment outcome PASS.",
          ],
        },
        {
          id: "assessment-evidence",
          label: "Finalize assessment evidence",
          node: "assessment.evidence_finalize",
          detail: "Prepare explicit pre-transform approval evidence.",
          durationMs: 700,
          kind: "SYSTEM",
          logs: [
            "Assessment evidence finalized.",
            "approval_review opened.",
          ],
        },
      ],
    };
  }

  if (kind === "TRANSFORM_AGENT") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "transform-workspace",
          label: "Prepare stage workspace",
          node: "transform.workspace_prepare",
          detail: "Materialize the isolated workspace for " + stageLabel + ".",
          durationMs: 800,
          kind: "SYSTEM",
          logs: [
            "Stage workspace fingerprint verified.",
            "Accepted plan revision bound.",
          ],
        },
        {
          id: "transform-apply",
          label: "Apply governed transformations",
          node: "transform.agent",
          detail: "Apply the accepted migration units inside the isolated workspace.",
          durationMs: 1800,
          kind: "COMMAND",
          logs: [
            "Transformation Agent started.",
            "OpenRewrite/profile transformations executing...",
            "POM/source changes recorded.",
            "Transformation evidence finalized.",
          ],
        },
      ],
    };
  }

  if (kind === "BUILD_AGENT") {
    return {
      id: id(kind, startedAtMs),
      kind,
      status: "RUNNING",
      startedAtMs,
      steps: [
        {
          id: "maven-build",
          label: "Maven build validation",
          node: "build.maven",
          detail: "Compile and package the transformed candidate.",
          durationMs: 1900,
          kind: "COMMAND",
          command: "mvn clean package -DskipTests",
          logs: [
            "$ mvn clean package -DskipTests",
            "[INFO] Compiling transformed sources",
            "[INFO] BUILD SUCCESS",
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
        id: "test-validation",
        label: "Test validation",
        node: "validation.maven_tests",
        detail: "Run the stage test contract and compare against accepted evidence.",
        durationMs: 2000,
        kind: "COMMAND",
        command: "mvn test",
        logs: [
          "$ mvn test",
          "[INFO] Running governed validation suite",
          stage === 2
            ? "[ERROR] OrderService compatibility assertion failed"
            : "[INFO] Tests run: 42, Failures: 0, Errors: 0",
          stage === 2
            ? "Failure evidence frozen for governed repair."
            : "[INFO] BUILD SUCCESS",
        ],
      },
    ],
  };
}
