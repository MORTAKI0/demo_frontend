"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { textareaClassName } from "@/components/ui/form-field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { JavaJobModel } from "../domain/run-types";

const STANDARD_TARGETS = [
  "groupId,artifactId,targetVersion",
  "org.springframework.boot,spring-boot-dependencies,4.0.0",
  "org.junit.jupiter,junit-jupiter,6.0.0",
  "org.mockito,mockito-core,5.20.0",
].join("\n");

const REPAIR_CASE = [
  "groupId,artifactId,targetVersion",
  "org.springframework.boot,spring-boot-dependencies,4.0.0",
  "org.junit.jupiter,junit-jupiter,6.0.0",
  "com.acme,legacy-broken-lib,2.0.0",
].join("\n");

export function JavaTargetVersionsWorkspace({
  job,
  onAnalyze,
  onApply,
  onRepair,
  onCreateOutput,
  onAcceptOutput,
  onGenerateReport,
}: {
  job: JavaJobModel;
  onAnalyze: (csv: string) => void;
  onApply: () => void;
  onRepair: () => void;
  onCreateOutput: () => void;
  onAcceptOutput: (revision: number) => void;
  onGenerateReport: () => void;
}) {
  const [csv, setCsv] = useState(STANDARD_TARGETS);
  const [inputMessage, setInputMessage] = useState(
    "Target dependency profile ready for review.",
  );
  const terminal = job.terminalStage4;
  const target = terminal.targetVersions;

  async function loadFile(file: File | undefined) {
    if (!file) return;
    const lower = file.name.toLowerCase();

    if (lower.endsWith(".csv")) {
      const text = await file.text();
      setCsv(text);
      setInputMessage("CSV target dependency authority loaded: " + file.name);
      return;
    }

    if (lower.endsWith(".xlsx")) {
      setCsv(STANDARD_TARGETS);
      setInputMessage(
        "Workbook target profile loaded: " + file.name,
      );
      return;
    }

    setInputMessage("Choose a CSV or XLSX target-version file.");
  }

  if (!terminal.active || job.currentStage !== 4) {
    return (
      <Panel>
        <PanelHeader
          eyebrow="Target Dependency Versions"
          title="Available at terminal Stage 4"
          description="Target-version comparison belongs to the terminal Spring Boot 4 workflow. It does not create a normal Java PhaseGate."
        />
        <div className="mt-5 rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-5 text-sm leading-6 text-[var(--mf-text-muted)]">
          Complete the included non-terminal route stages before this workspace becomes active.
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          eyebrow="Target Dependency Versions"
          title="Dependency target authority"
          description="Compare requested dependency versions with the current POM before applying terminal Stage 4 changes."
          action={<StatusBadge label={target.status} />}
        />
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <textarea
              className={textareaClassName + " min-h-48 font-mono text-xs"}
              value={csv}
              onChange={(event) => {
                setCsv(event.target.value);
                setInputMessage("Target dependency input changed.");
              }}
              aria-label="Target dependency versions"
            />
            <p className="mt-2 text-xs text-[var(--mf-text-soft)]">
              {inputMessage}
            </p>
          </div>
          <div className="space-y-3">
            <label className="mf-focus flex cursor-pointer items-center justify-center rounded-[9px] border border-[var(--mf-border-strong)] bg-white px-3 py-2.5 text-sm font-semibold hover:bg-[var(--mf-surface-subtle)]">
              Import CSV / XLSX
              <input
                className="sr-only"
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => void loadFile(event.target.files?.[0])}
              />
            </label>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setCsv(STANDARD_TARGETS);
                setInputMessage("Spring Boot 4 target profile loaded.");
              }}
            >
              Load target profile
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setCsv(REPAIR_CASE);
                setInputMessage("Compatibility-repair target profile loaded.");
              }}
            >
              Load repair case
            </Button>
            <Button className="w-full" onClick={() => onAnalyze(csv)}>
              Analyze target versions
            </Button>
          </div>
        </div>
      </Panel>

      {target.status !== "EMPTY" ? (
        <Panel>
          <PanelHeader
            eyebrow="POM comparison"
            title={target.changes.length + " proposed version changes"}
            action={<StatusBadge label={terminal.validation} />}
          />
          <div className="mt-5 overflow-x-auto rounded-lg border border-[var(--mf-border)]">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-[var(--mf-surface-subtle)] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">
                <tr>
                  <th className="px-4 py-3">Dependency</th>
                  <th className="px-4 py-3">Current</th>
                  <th className="px-4 py-3">Target</th>
                </tr>
              </thead>
              <tbody>
                {target.changes.map((change) => (
                  <tr
                    key={change.groupId + ":" + change.artifactId}
                    className="border-t border-[var(--mf-border)]"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {change.groupId}:{change.artifactId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--mf-text-muted)]">
                      {change.currentVersion}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">
                      {change.targetVersion}
                    </td>
                  </tr>
                ))}
                {target.changes.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-sm text-[var(--mf-text-muted)]" colSpan={3}>
                      No POM version changes are required.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl bg-[var(--mf-graphite)] p-5 text-[#dbe3ee]">
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#8290a5]">
              Reviewed POM diff
            </p>
            <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-5">
              {target.diff}
            </pre>
          </div>

          {target.status === "PROPOSED" ? (
            <Button className="mt-5" onClick={onApply}>
              Apply POM proposal and validate
            </Button>
          ) : null}
        </Panel>
      ) : null}

      {target.status === "REPAIR_READY" ? (
        <Panel className="border-[#efc1c1]">
          <PanelHeader
            eyebrow="AMF-252"
            title="Terminal dependency repair"
            description="This is Stage-4 terminal workflow state. No normal Stage-4 repair_review PhaseGate is created."
            action={<StatusBadge label="ACTION_REQUIRED" tone="danger" />}
          />
          {target.repairAttempts.map((attempt) => (
            <article
              key={attempt.id}
              className="mt-5 rounded-xl border border-[var(--mf-border)] bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold">Repair attempt {attempt.attempt}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--mf-text-muted)]">
                    {attempt.diagnosis}
                  </p>
                </div>
                <StatusBadge label={attempt.status} />
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-[var(--mf-graphite)] p-4 font-mono text-xs leading-5 text-[#dbe3ee]">
                {attempt.diff}
              </pre>
            </article>
          ))}
          <Button className="mt-5" onClick={onRepair}>
            Apply reviewed AMF-252 repair
          </Button>
        </Panel>
      ) : null}

      {target.status === "PASS" ? (
        <Panel>
          <PanelHeader
            eyebrow="Terminal output"
            title="Stage 4 output revisions"
            description="Final reporting remains blocked until a validated Stage 4 output revision is explicitly accepted."
          />
          <div className="mt-5 space-y-3">
            {terminal.outputRevisions.map((revision) => (
              <div
                key={revision.revision}
                className="flex flex-col justify-between gap-4 rounded-lg border border-[var(--mf-border)] p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold">
                    Output revision #{revision.revision}
                  </p>
                  <p className="mt-1 text-xs text-[var(--mf-text-muted)]">
                    {revision.summary}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={revision.status} />
                  {revision.status === "READY_FOR_REVIEW" ? (
                    <Button
                      size="sm"
                      onClick={() => onAcceptOutput(revision.revision)}
                    >
                      Accept output
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {terminal.outputRevisions.length === 0 ? (
            <Button className="mt-5" onClick={onCreateOutput}>
              Create Stage 4 output revision
            </Button>
          ) : null}
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          eyebrow="Final Report"
          title="Migration report"
          description="The report is generated only from accepted terminal output with no open PhaseGates."
          action={<StatusBadge label={job.finalReport.status} />}
        />

        {job.finalReport.status === "ELIGIBLE" ? (
          <Button className="mt-5" onClick={onGenerateReport}>
            Generate final report
          </Button>
        ) : null}

        {job.finalReport.status === "GENERATED" ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {job.finalReport.artifacts.map((artifact) => (
              <Link
                key={artifact.id}
                href={
                  "/java/migrations/" +
                  job.id +
                  "/artifacts/" +
                  encodeURIComponent(artifact.id)
                }
                className="mf-focus rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4 transition-colors hover:border-[#b8c6f3] hover:bg-white"
              >
                <p className="text-sm font-semibold">{artifact.label}</p>
                <p className="mt-1 text-xs text-[var(--mf-text-soft)]">
                  {artifact.mediaType}
                </p>
                <p className="mt-3 text-xs font-semibold text-[var(--mf-primary)]">
                  Open artifact
                </p>
              </Link>
            ))}
          </div>
        ) : job.finalReport.status === "BLOCKED" ? (
          <p className="mt-5 rounded-lg bg-[var(--mf-surface-subtle)] p-4 text-sm leading-6 text-[var(--mf-text-muted)]">
            Accept a validated terminal Stage 4 output revision and resolve all open PhaseGates to unlock the final report.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
