import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import type {
  JavaJobModel,
  JavaPomVersionChange,
  JavaReportArtifact,
  JavaStage4OutputRevision,
  JavaTargetVersionRepairAttempt,
  JavaTargetVersionRow,
} from "../domain/run-types.ts";

const CURRENT_POM_VERSIONS: Record<string, string> = {
  "org.springframework.boot:spring-boot-dependencies": "3.5.0",
  "org.junit.jupiter:junit-jupiter": "5.12.2",
  "org.mockito:mockito-core": "5.18.0",
  "com.acme:legacy-broken-lib": "1.4.0",
};

type PomProjection = {
  lines: string[];
  dependencyStartLines: Map<string, number>;
  closingDependenciesLine: number;
};

function pomDependencyLines(
  groupId: string,
  artifactId: string,
  version: string,
): string[] {
  return [
    "    <dependency>",
    "      <groupId>" + groupId + "</groupId>",
    "      <artifactId>" + artifactId + "</artifactId>",
    "      <version>" + version + "</version>",
    "    </dependency>",
  ];
}

function canonicalPomProjection(): PomProjection {
  const lines = ["<project>", "  <dependencies>"];
  const dependencyStartLines = new Map<string, number>();

  for (const [coordinate, version] of Object.entries(CURRENT_POM_VERSIONS)) {
    const separator = coordinate.indexOf(":");
    if (separator < 1 || separator === coordinate.length - 1) {
      throw new Error("Invalid canonical POM dependency coordinate: " + coordinate);
    }

    const groupId = coordinate.slice(0, separator);
    const artifactId = coordinate.slice(separator + 1);
    dependencyStartLines.set(coordinate, lines.length + 1);
    lines.push(...pomDependencyLines(groupId, artifactId, version));
  }

  const closingDependenciesLine = lines.length + 1;
  lines.push("  </dependencies>", "</project>");

  return { lines, dependencyStartLines, closingDependenciesLine };
}

function dependencyKey(row: {
  groupId: string;
  artifactId: string;
}): string {
  return row.groupId + ":" + row.artifactId;
}

function parseCsvRow(line: string): string[] {
  const columns: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      columns.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (quoted) {
    throw new Error("Target-version CSV contains an unterminated quoted field.");
  }

  columns.push(current.trim());
  return columns;
}

export function parseJavaTargetVersionsCsv(
  csv: string,
): JavaTargetVersionRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Target-version CSV must include a header and at least one dependency row.");
  }

  const header = parseCsvRow(lines[0]!);

  if (
    header.length !== 3 ||
    header[0] !== "groupId" ||
    header[1] !== "artifactId" ||
    header[2] !== "targetVersion"
  ) {
    throw new Error(
      "Target-version CSV header must be groupId,artifactId,targetVersion.",
    );
  }

  const rows = lines.slice(1).map((line, index) => {
    const columns = parseCsvRow(line);
    if (
      columns.length !== 3 ||
      columns.some((column) => column.length === 0)
    ) {
      throw new Error(
        "Malformed target-version row " + (index + 2) + ".",
      );
    }

    return {
      groupId: columns[0]!,
      artifactId: columns[1]!,
      targetVersion: columns[2]!,
    };
  });

  const seen = new Set<string>();
  for (const row of rows) {
    const key = dependencyKey(row);
    if (seen.has(key)) {
      throw new Error("Duplicate target-version dependency: " + key + ".");
    }
    seen.add(key);
  }

  return rows;
}

export function compareJavaTargetVersions(
  rows: JavaTargetVersionRow[],
): JavaPomVersionChange[] {
  return rows.flatMap((row) => {
    const current = CURRENT_POM_VERSIONS[dependencyKey(row)] ?? "(not pinned)";
    if (current === row.targetVersion) return [];
    return [
      {
        groupId: row.groupId,
        artifactId: row.artifactId,
        currentVersion: current,
        targetVersion: row.targetVersion,
      },
    ];
  });
}

export function renderJavaPomVersionDiff(
  changes: JavaPomVersionChange[],
): string {
  if (changes.length === 0) return "";

  const projection = canonicalPomProjection();
  const knownChanges: Array<{
    change: JavaPomVersionChange;
    startLine: number;
  }> = [];
  const unpinnedChanges: JavaPomVersionChange[] = [];

  for (const change of changes) {
    const key = dependencyKey(change);
    const startLine = projection.dependencyStartLines.get(key);
    if (startLine === undefined) {
      unpinnedChanges.push(change);
    } else {
      knownChanges.push({ change, startLine });
    }
  }

  knownChanges.sort((left, right) => left.startLine - right.startLine);

  const hunks = knownChanges.map(({ change, startLine }) => {
    const oldLines = pomDependencyLines(
      change.groupId,
      change.artifactId,
      change.currentVersion,
    );
    const newLines = pomDependencyLines(
      change.groupId,
      change.artifactId,
      change.targetVersion,
    );

    return [
      "@@ -" + startLine + ",5 +" + startLine + ",5 @@",
      " " + oldLines[0],
      " " + oldLines[1],
      " " + oldLines[2],
      "-" + oldLines[3],
      "+" + newLines[3],
      " " + oldLines[4],
    ].join("\n");
  });

  if (unpinnedChanges.length > 0) {
    const additions = unpinnedChanges.flatMap((change) =>
      pomDependencyLines(
        change.groupId,
        change.artifactId,
        change.targetVersion,
      ).map((line) => "+" + line),
    );
    const newCount = additions.length + 1;
    hunks.push(
      [
        "@@ -" +
          projection.closingDependenciesLine +
          ",1 +" +
          projection.closingDependenciesLine +
          "," +
          newCount +
          " @@",
        ...additions,
        "   </dependencies>",
      ].join("\n"),
    );
  }

  return [
    "diff --git a/pom.xml b/pom.xml",
    "--- a/pom.xml",
    "+++ b/pom.xml",
    ...hunks,
  ].join("\n");
}

function assertTerminalStage4(job: JavaJobModel): void {
  if (
    job.currentStage !== 4 ||
    !job.terminalStage4.active ||
    job.currentPhase !== "TERMINAL_STAGE_4"
  ) {
    throw new Error("Target Dependency Versions are available only in terminal Java Stage 4.");
  }
}

export function analyzeJavaTargetVersions(
  job: JavaJobModel,
  csv: string,
  now = "2026-08-31T21:00:00+01:00",
): JavaJobModel {
  assertTerminalStage4(job);
  const rows = parseJavaTargetVersionsCsv(csv);
  const changes = compareJavaTargetVersions(rows);
  const diff = renderJavaPomVersionDiff(changes);

  return {
    ...job,
    currentAction:
      changes.length === 0
        ? "Validate terminal Stage 4 target dependency state"
        : "Review proposed Stage 4 POM version changes",
    terminalStage4: {
      ...job.terminalStage4,
      targetVersions: {
        rows,
        changes,
        status: "PROPOSED",
        diff,
        repairAttempts: [],
      },
    },
    evidence: [
      ...job.evidence,
      {
        id: job.id + "-target-version-analysis",
        category: "STAGE",
        title: "Target dependency versions analyzed",
        summary:
          changes.length +
          " POM version changes were derived from the supplied target-version authority.",
        timestamp: now,
        checksum: stableDisplayChecksum(
          job.id + ":target-versions:" + JSON.stringify(rows),
        ),
      },
    ],
  };
}

function requiresTargetVersionRepair(
  changes: JavaPomVersionChange[],
): boolean {
  return changes.some(
    (change) =>
      change.artifactId === "legacy-broken-lib" &&
      change.targetVersion.startsWith("2."),
  );
}

function createTargetVersionRepair(
  job: JavaJobModel,
  now: string,
): JavaTargetVersionRepairAttempt {
  const attempt =
    job.terminalStage4.targetVersions.repairAttempts.length + 1;
  return {
    id: job.id + "-amf252-repair-" + attempt,
    attempt,
    status: "READY_FOR_APPLY",
    diagnosis:
      "Target dependency validation found com.acme:legacy-broken-lib 2.x incompatible with the accepted terminal Spring Boot 4 profile.",
    diff: renderJavaPomVersionDiff([
      {
        groupId: "com.acme",
        artifactId: "legacy-broken-lib",
        currentVersion: "2.0.0",
        targetVersion: "1.9.9",
      },
    ]),
    checksum: stableDisplayChecksum(
      job.id + ":amf252:" + attempt + ":legacy-broken-lib:1.9.9",
    ),
    createdAt: now,
  };
}

export function applyJavaTargetVersionProposal(
  job: JavaJobModel,
  now = "2026-08-31T21:01:00+01:00",
): JavaJobModel {
  assertTerminalStage4(job);
  const target = job.terminalStage4.targetVersions;

  if (target.status !== "PROPOSED") {
    throw new Error("A proposed target-version comparison is required before applying POM changes.");
  }

  if (requiresTargetVersionRepair(target.changes)) {
    const repair = createTargetVersionRepair(job, now);
    return {
      ...job,
      status: "ACTION_REQUIRED",
      currentGate: null,
      currentAction: "Review AMF-252 target-version repair",
      terminalStage4: {
        ...job.terminalStage4,
        validation: "FAILED",
        targetVersions: {
          ...target,
          status: "REPAIR_READY",
          repairAttempts: [...target.repairAttempts, repair],
        },
      },
      evidence: [
        ...job.evidence,
        {
          id: job.id + "-target-version-validation-failure",
          category: "FAILURE",
          title: "Stage 4 target dependency validation failed",
          summary:
            "POM changes were applied to the terminal workspace, but a target dependency is incompatible and requires AMF-252 repair.",
          timestamp: now,
          checksum: stableDisplayChecksum(
            job.id + ":target-version-validation:failed",
          ),
        },
        {
          id: repair.id,
          category: "REPAIR",
          title: "AMF-252 target-version repair prepared",
          summary:
            "A bounded terminal Stage 4 dependency repair was prepared without creating a normal Stage-4 PhaseGate.",
          timestamp: now,
          checksum: repair.checksum,
        },
      ],
    };
  }

  return {
    ...job,
    status: "RUNNING",
    currentGate: null,
    currentAction: "Create Stage 4 output revision",
    terminalStage4: {
      ...job.terminalStage4,
      validation: "PASS",
      targetVersions: {
        ...target,
        status: "PASS",
      },
    },
    evidence: [
      ...job.evidence,
      {
        id: job.id + "-target-version-validation-pass",
        category: "STAGE",
        title: "Stage 4 target dependency validation passed",
        summary:
          "Proposed POM dependency versions were applied and validated against the terminal Spring Boot 4 profile.",
        timestamp: now,
        checksum: stableDisplayChecksum(
          job.id + ":target-version-validation:pass",
        ),
      },
    ],
  };
}

export function applyJavaTargetVersionRepair(
  job: JavaJobModel,
  now = "2026-08-31T21:02:00+01:00",
): JavaJobModel {
  assertTerminalStage4(job);
  const target = job.terminalStage4.targetVersions;
  if (target.status !== "REPAIR_READY") {
    throw new Error("No terminal AMF-252 target-version repair is ready to apply.");
  }

  const latest = target.repairAttempts.at(-1);
  if (!latest || latest.status !== "READY_FOR_APPLY") {
    throw new Error("Latest terminal target-version repair is not ready to apply.");
  }

  const repairedRows = target.rows.map((row) =>
    row.groupId === "com.acme" &&
    row.artifactId === "legacy-broken-lib" &&
    row.targetVersion.startsWith("2.")
      ? { ...row, targetVersion: "1.9.9" }
      : row,
  );
  const repairedChanges = compareJavaTargetVersions(repairedRows);
  const repairedDiff = renderJavaPomVersionDiff(repairedChanges);
  const repairedAttempts = target.repairAttempts.map(
    (attempt, index, all) =>
      index === all.length - 1
        ? { ...attempt, status: "VALIDATED" as const }
        : attempt,
  );

  return {
    ...job,
    status: "RUNNING",
    currentGate: null,
    currentAction: "Create Stage 4 output revision",
    terminalStage4: {
      ...job.terminalStage4,
      validation: "PASS",
      targetVersions: {
        rows: repairedRows,
        changes: repairedChanges,
        status: "PASS",
        diff: repairedDiff,
        repairAttempts: repairedAttempts,
      },
    },
    evidence: [
      ...job.evidence,
      {
        id: latest.id + "-validated",
        category: "REPAIR",
        title: "AMF-252 target-version repair validated",
        summary:
          "The reviewed terminal dependency repair was applied and Stage 4 target validation passed.",
        timestamp: now,
        checksum: stableDisplayChecksum(latest.checksum + ":validated"),
      },
    ],
  };
}

export function createJavaStage4OutputRevision(
  job: JavaJobModel,
  now = "2026-08-31T21:03:00+01:00",
): JavaJobModel {
  assertTerminalStage4(job);
  if (job.terminalStage4.validation !== "PASS") {
    throw new Error("Stage 4 output revision requires passing terminal validation.");
  }

  const revision = job.terminalStage4.outputRevisions.length + 1;
  const output: JavaStage4OutputRevision = {
    revision,
    status: "READY_FOR_REVIEW",
    summary:
      "Terminal Spring Boot 4 / Java 21 output validated with accepted target dependency versions.",
    checksum: stableDisplayChecksum(
      job.id + ":stage4-output:" + revision,
    ),
    createdAt: now,
  };

  return {
    ...job,
    status: "ACTION_REQUIRED",
    currentAction: "Review terminal Stage 4 output revision #" + revision,
    terminalStage4: {
      ...job.terminalStage4,
      outputRevisions: [...job.terminalStage4.outputRevisions, output],
    },
    evidence: [
      ...job.evidence,
      {
        id: job.id + "-stage4-output-" + revision,
        category: "STAGE",
        title: "Stage 4 output revision " + revision + " ready",
        summary: output.summary,
        timestamp: now,
        checksum: output.checksum,
      },
    ],
  };
}

function hasOpenJavaGate(job: JavaJobModel): boolean {
  return job.phaseGates.some((gate) => gate.status === "PENDING");
}

export function isJavaFinalReportEligible(job: JavaJobModel): boolean {
  return (
    job.currentStage === 4 &&
    job.terminalStage4.active &&
    job.terminalStage4.validation === "PASS" &&
    job.terminalStage4.acceptedOutputRevision !== null &&
    !hasOpenJavaGate(job)
  );
}

export function acceptJavaStage4Output(
  job: JavaJobModel,
  revision: number,
  now = "2026-08-31T21:04:00+01:00",
): JavaJobModel {
  assertTerminalStage4(job);
  const output = job.terminalStage4.outputRevisions.find(
    (item) => item.revision === revision,
  );
  if (!output || output.status !== "READY_FOR_REVIEW") {
    throw new Error("Requested Stage 4 output revision is not ready for acceptance.");
  }

  const next: JavaJobModel = {
    ...job,
    status: "RUNNING",
    currentGate: null,
    currentAction: "Prepare final migration report",
    terminalStage4: {
      ...job.terminalStage4,
      acceptedOutputRevision: revision,
      outputRevisions: job.terminalStage4.outputRevisions.map((item) =>
        item.revision === revision
          ? { ...item, status: "ACCEPTED" as const }
          : item,
      ),
    },
    evidence: [
      ...job.evidence,
      {
        id: job.id + "-stage4-output-accepted-" + revision,
        category: "DECISION",
        title: "Terminal Stage 4 output accepted",
        summary:
          "Output revision #" +
          revision +
          " is the accepted terminal migration result.",
        timestamp: now,
        checksum: stableDisplayChecksum(
          output.checksum + ":accepted",
        ),
      },
    ],
  };

  return {
    ...next,
    finalReport: {
      ...next.finalReport,
      status: isJavaFinalReportEligible(next)
        ? "ELIGIBLE"
        : "BLOCKED",
    },
  };
}

function renderFinalMarkdown(job: JavaJobModel): string {
  const accepted = job.terminalStage4.acceptedOutputRevision;
  const targetRows = job.terminalStage4.targetVersions.rows;
  const repairCount =
    job.repair.attempts.length +
    job.terminalStage4.targetVersions.repairAttempts.length;

  return [
    "# Migration Factory Final Report",
    "",
    "## Job",
    "",
    "- Job: " + job.name,
    "- Job ID: " + job.id,
    "- Target: Spring Boot 4.0 / Java 21",
    "- Accepted Stage 4 output revision: #" + accepted,
    "- Continuation policy: " + job.configuration.continuationPolicy,
    "",
    "## Route",
    "",
    ...job.route.map(
      (stage) =>
        "- Stage " +
        stage.stage +
        ": " +
        stage.label +
        " — " +
        stage.disposition,
    ),
    "",
    "## Validation",
    "",
    "- Terminal validation: " + job.terminalStage4.validation,
    "- Target dependency rows: " + targetRows.length,
    "- Governed repair attempts: " + repairCount,
    "- Open PhaseGates: 0",
  ].join("\n");
}

function renderTargetVersionCsv(job: JavaJobModel): string {
  return [
    "groupId,artifactId,targetVersion",
    ...job.terminalStage4.targetVersions.rows.map(
      (row) =>
        row.groupId + "," + row.artifactId + "," + row.targetVersion,
    ),
  ].join("\n");
}

function reportArtifacts(job: JavaJobModel): JavaReportArtifact[] {
  return [
    {
      id: "migration-report.md",
      label: "Final migration report",
      mediaType: "text/markdown",
      content: renderFinalMarkdown(job),
    },
    {
      id: "stage-4-evidence.json",
      label: "Stage 4 evidence",
      mediaType: "application/json",
      content: JSON.stringify(
        {
          acceptedOutputRevision:
            job.terminalStage4.acceptedOutputRevision,
          validation: job.terminalStage4.validation,
          targetVersions: job.terminalStage4.targetVersions,
          evidence: job.evidence.filter(
            (item) =>
              item.category === "STAGE" ||
              item.category === "REPAIR" ||
              item.category === "FAILURE",
          ),
        },
        null,
        2,
      ),
    },
    {
      id: "target-version-report.csv",
      label: "Target dependency versions",
      mediaType: "text/csv",
      content: renderTargetVersionCsv(job),
    },
  ];
}

export function generateJavaFinalReport(
  job: JavaJobModel,
  now = "2026-08-31T21:05:00+01:00",
): JavaJobModel {
  if (!isJavaFinalReportEligible(job)) {
    throw new Error(
      "Final report is blocked until terminal Stage 4 output is accepted and no PhaseGates remain open.",
    );
  }

  return {
    ...job,
    status: "COMPLETED",
    currentPhase: "FINAL_REPORT",
    currentAction: "Migration completed · final report generated",
    finalReport: {
      status: "GENERATED",
      generatedAt: now,
      artifacts: reportArtifacts(job),
    },
  };
}

export function getJavaReportArtifact(
  job: JavaJobModel,
  artifactId: string,
): JavaReportArtifact {
  if (job.finalReport.status !== "GENERATED") {
    throw new Error("Final report artifacts are not generated yet.");
  }
  const artifact = job.finalReport.artifacts.find(
    (item) => item.id === artifactId,
  );
  if (!artifact) {
    throw new Error("Unknown final-report artifact: " + artifactId + ".");
  }
  return artifact;
}
