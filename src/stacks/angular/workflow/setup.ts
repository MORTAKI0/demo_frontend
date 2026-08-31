import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import {
  ANGULAR_MAJORS,
  type AngularG01Decision,
  type AngularMajor,
  type AngularPreflight,
  type AngularRouteStep,
  type AngularRunSeed,
} from "../domain/types.ts";

export interface PrepareAngularInput {
  runName: string;
  sourcePath: string;
  outputParent: string;
  sourceMajor: AngularMajor;
  targetMajor: AngularMajor;
}

function assertAngularMajor(value: number): asserts value is AngularMajor {
  if (!ANGULAR_MAJORS.includes(value as AngularMajor)) {
    throw new Error(`Angular ${value} is outside the supported 11–21 range.`);
  }
}

export function computeAngularRoute(
  sourceMajor: AngularMajor,
  targetMajor: AngularMajor,
): AngularRouteStep[] {
  assertAngularMajor(sourceMajor);
  assertAngularMajor(targetMajor);

  if (targetMajor <= sourceMajor) {
    throw new Error("Target Angular major must be greater than the detected source major.");
  }

  const route: AngularRouteStep[] = [];
  for (let source = sourceMajor; source < targetMajor; source += 1) {
    const target = source + 1;
    assertAngularMajor(source);
    assertAngularMajor(target);
    route.push({
      id: `angular-${source}-to-${target}`,
      source,
      target,
      status: "PENDING",
    });
  }
  return route;
}

function slugify(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "migration";
}

export function prepareAngularPreflight(
  input: PrepareAngularInput,
  now = "2026-08-31T19:30:00+01:00",
): AngularPreflight {
  const route = computeAngularRoute(input.sourceMajor, input.targetMajor);
  const blocked = input.sourcePath.toLowerCase().includes("blocked");
  const warnings =
    input.targetMajor - input.sourceMajor >= 3
      ? ["1 third-party package requires migration review before a later stage."]
      : [];
  const blockers = blocked ? ["Source path failed production-readiness validation."] : [];
  const id = `preflight-${slugify(input.runName)}-${input.sourceMajor}-${input.targetMajor}`;
  const checksum = stableDisplayChecksum(
    [id, input.sourcePath, input.outputParent, input.sourceMajor, input.targetMajor, 1].join("|"),
  );

  return {
    id,
    runName: input.runName,
    sourcePath: input.sourcePath,
    outputParent: input.outputParent,
    sourceMajor: input.sourceMajor,
    targetMajor: input.targetMajor,
    route,
    status: blocked ? "BLOCKED" : warnings.length > 0 ? "PASSED_WITH_WARNINGS" : "PASSED",
    reviewStatus: "PENDING",
    warnings,
    blockers,
    environment: [
      { id: "node", label: "Node runtime", value: "Certified profiles available", status: "READY" },
      { id: "npm", label: "npm", value: "10.9.8", status: "READY" },
      { id: "cli", label: "Angular CLI authority", value: "Resolvable per stage", status: "READY" },
      { id: "chrome", label: "Chrome / Karma", value: "Available", status: "READY" },
      { id: "catalogue", label: "Compatibility catalogue", value: "Certified", status: "READY" },
      { id: "llm", label: "LLM readiness", value: "Available", status: "READY" },
    ],
    sourceAnalysis: {
      detectedVersion: `${input.sourceMajor}.2.14`,
      packageManager: "npm",
      workspace: "Angular CLI workspace",
      projects: 3,
      builder: "@angular-devkit/build-angular",
      lockfile: "package-lock.json",
      dependencyCount: 71,
      thirdPartyPackages: 42,
      confidence: "HIGH",
    },
    evidence: [
      {
        id: `${id}-paths`,
        category: "READINESS",
        title: "Path boundary evidence",
        summary: blocked
          ? "Source path requires correction before run creation."
          : "Source and output boundaries are valid; source remains read-only.",
        checksum: stableDisplayChecksum(`${checksum}:paths`),
        timestamp: now,
      },
      {
        id: `${id}-source`,
        category: "SOURCE",
        title: "Source analysis",
        summary: `Angular ${input.sourceMajor} workspace detected with package-lock authority.`,
        checksum: stableDisplayChecksum(`${checksum}:source`),
        timestamp: now,
      },
    ],
    decisions: [],
    revision: 1,
    checksum,
  };
}

export function applyG01Decision(
  preflight: AngularPreflight,
  decision: AngularG01Decision,
  comment = "",
  now = "2026-08-31T19:34:00+01:00",
): AngularPreflight {
  const approving = decision === "APPROVE" || decision === "APPROVE_WITH_COMMENT";

  if (approving && !["PASSED", "PASSED_WITH_WARNINGS"].includes(preflight.status)) {
    throw new Error(`G01 cannot be approved while production readiness is ${preflight.status}.`);
  }
  if (preflight.reviewStatus === "STALE") {
    throw new Error("G01 evidence is stale and must be regenerated before a decision.");
  }
  if (decision === "APPROVE_WITH_COMMENT" && comment.trim().length === 0) {
    throw new Error("Approve with comment requires a comment.");
  }

  const record = {
    id: `g01-decision-${preflight.decisions.length + 1}`,
    gate: "G01" as const,
    decision,
    comment: comment.trim() || undefined,
    timestamp: now,
    checksum: preflight.checksum,
  };

  const reviewStatus =
    decision === "APPROVE" || decision === "APPROVE_WITH_COMMENT"
      ? "APPROVED"
      : decision === "REQUEST_MODIFICATION"
        ? "MODIFICATION_REQUESTED"
        : "REJECTED";

  return {
    ...preflight,
    reviewStatus,
    decisions: [...preflight.decisions, record],
    evidence: [
      ...preflight.evidence,
      {
        id: `${preflight.id}-decision-${preflight.decisions.length + 1}`,
        category: "DECISION",
        title: "G01 Production Readiness decision",
        summary: decision.replaceAll("_", " "),
        checksum: stableDisplayChecksum(`${preflight.checksum}:${decision}:${record.id}`),
        timestamp: now,
      },
    ],
  };
}

export function createRunFromApprovedPreflight(
  preflight: AngularPreflight,
  now = "2026-08-31T19:35:00+01:00",
): AngularRunSeed {
  if (preflight.reviewStatus !== "APPROVED") {
    throw new Error("An authoritative Angular run requires an approved G01 decision.");
  }

  const accepted = preflight.decisions.at(-1);
  if (!accepted || !["APPROVE", "APPROVE_WITH_COMMENT"].includes(accepted.decision)) {
    throw new Error("The latest G01 decision is not an approval.");
  }

  return {
    id: `run-${slugify(preflight.runName)}-${preflight.sourceMajor}-${preflight.targetMajor}`,
    name: preflight.runName,
    sourceMajor: preflight.sourceMajor,
    targetMajor: preflight.targetMajor,
    route: preflight.route,
    state: "STAGE_CREATED",
    currentGate: "G02",
    currentAction: "Review immutable source snapshot",
    g01DecisionId: accepted.id,
    createdAt: now,
  };
}
