"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { ProductHeader } from "@/components/shared/product-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import type {
  JavaGateAssistantPreview,
  JavaGateDecision,
  JavaJobModel,
  JavaPhaseGateType,
} from "../domain/run-types";
import type { JavaProfileId } from "../domain/types";
import { getJavaJob, putJavaJob } from "../scenarios/java-store";
import {
  advanceJavaPipeline,
  applyJavaGateDecision,
} from "../workflow/cockpit";
import { cancelJavaMigration } from "../workflow/cancellation";
import { applyJavaRepairDecision } from "../workflow/repair";
import {
  acceptJavaStage4Output,
  analyzeJavaTargetVersions,
  applyJavaTargetVersionProposal,
  applyJavaTargetVersionRepair,
  createJavaStage4OutputRevision,
  generateJavaFinalReport,
} from "../workflow/terminal";
import { JavaCurrentAction } from "./java-current-action";
import { JavaEvidenceWorkspace } from "./java-evidence-workspace";
import { JavaGateAssistantPanel } from "./java-gate-assistant-panel";
import { JavaGateDecisionPanel } from "./java-gate-decision-panel";
import { JavaOverview } from "./java-overview";
import { JavaPipeline } from "./java-pipeline";
import { JavaRepairWorkspace } from "./java-repair-workspace";
import { JavaTargetVersionsWorkspace } from "./java-target-versions-workspace";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "evidence", label: "Evidence" },
  { id: "target-versions", label: "Target Dependency Versions" },
];

const REPAIR_DECISIONS = [
  "CONTINUE",
  "REANALYZE",
  "REVISE",
  "REJECT",
] as const;

type RepairDecision = (typeof REPAIR_DECISIONS)[number];

export function JavaCockpitPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const [job, setJob] = useState<JavaJobModel>(() => getJavaJob(jobId));
  const [active, setActive] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  function persist(next: JavaJobModel) {
    putJavaJob(next);
    setJob(next);
  }

  function advance() {
    try {
      setError(null);
      persist(advanceJavaPipeline(job));
      setActive("pipeline");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to advance Java pipeline.",
      );
    }
  }

  function decide(
    type: JavaPhaseGateType,
    decision: JavaGateDecision,
    options: { comment?: string; overrideSourceProfile?: JavaProfileId },
  ) {
    try {
      setError(null);
      let next: JavaJobModel;
      if (type === "repair_review") {
        if (!REPAIR_DECISIONS.includes(decision as RepairDecision)) {
          throw new Error(decision + " is not valid for repair_review.");
        }
        next = applyJavaRepairDecision(
          job,
          decision as RepairDecision,
          options.comment,
        );
      } else {
        next = applyJavaGateDecision(job, type, decision, options);
      }
      persist(next);
      setActive("pipeline");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to apply Java PhaseGate decision.",
      );
    }
  }

  function confirmAssistant(preview: JavaGateAssistantPreview) {
    decide(preview.gateType, preview.decision, {
      comment: preview.comment,
      overrideSourceProfile: preview.overrideSourceProfile,
    });
  }

  function confirmCancellation() {
    try {
      setError(null);
      persist(cancelJavaMigration(job));
      setCancelOpen(false);
      setActive("pipeline");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to cancel Java migration.",
      );
      setCancelOpen(false);
    }
  }

  function applyTerminalAction(
    action:
      | { type: "analyze"; csv: string }
      | { type: "apply" }
      | { type: "repair" }
      | { type: "create-output" }
      | { type: "accept-output"; revision: number }
      | { type: "report" },
  ) {
    try {
      setError(null);
      const next =
        action.type === "analyze"
          ? analyzeJavaTargetVersions(job, action.csv)
          : action.type === "apply"
            ? applyJavaTargetVersionProposal(job)
            : action.type === "repair"
              ? applyJavaTargetVersionRepair(job)
              : action.type === "create-output"
                ? createJavaStage4OutputRevision(job)
                : action.type === "accept-output"
                  ? acceptJavaStage4Output(job, action.revision)
                  : generateJavaFinalReport(job);
      persist(next);
      setActive("target-versions");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to apply terminal Stage 4 action.",
      );
    }
  }

  const canAdvance =
    !job.currentGate &&
    job.status !== "CANCELLED" &&
    job.currentStage !== 4 &&
    job.currentPhase !== "FINAL_REPORT";

  const canCancel =
    job.status !== "CANCELLED" && job.status !== "COMPLETED";

  return (
    <div className="mf-page">
      <ProductHeader
        breadcrumb="Spring Boot / Control Tower"
        actions={
          <div className="hidden items-center gap-2 sm:flex">
            <span className="font-mono text-[11px] text-[var(--mf-text-soft)]">
              {job.id}
            </span>
            <StatusBadge label={job.status} />
          </div>
        }
      />
      <main className="mf-container py-7 lg:py-9">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#355d9a]">
              Spring Boot Migration
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {job.name}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--mf-text-muted)]">
              Java route stages and execution phases are governed independently.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canAdvance ? (
              <Button onClick={advance}>Run next phase</Button>
            ) : null}
            {canCancel ? (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                Cancel migration
              </Button>
            ) : null}
          </div>
        </div>

        <JavaCurrentAction job={job} />

        {error ? (
          <div className="mt-5 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-3 text-sm text-[var(--mf-danger)]">
            {error}
          </div>
        ) : null}

        <div className="mt-7">
          <Tabs
            items={tabs}
            active={active}
            onChange={setActive}
            ariaLabel="Spring Boot Control Tower workspaces"
          />
        </div>

        <div className="mt-6">
          {active === "overview" ? <JavaOverview job={job} /> : null}
          {active === "pipeline" ? (
            <div className="space-y-6">
              <JavaPipeline job={job} />
              <JavaRepairWorkspace job={job} />
            </div>
          ) : null}
          {active === "evidence" ? (
            <JavaEvidenceWorkspace job={job} />
          ) : null}
          {active === "target-versions" ? (
            <JavaTargetVersionsWorkspace
              job={job}
              onAnalyze={(csv) => applyTerminalAction({ type: "analyze", csv })}
              onApply={() => applyTerminalAction({ type: "apply" })}
              onRepair={() => applyTerminalAction({ type: "repair" })}
              onCreateOutput={() => applyTerminalAction({ type: "create-output" })}
              onAcceptOutput={(revision) =>
                applyTerminalAction({ type: "accept-output", revision })
              }
              onGenerateReport={() => applyTerminalAction({ type: "report" })}
            />
          ) : null}
        </div>

        <div className="mt-6 space-y-6">
          <JavaGateDecisionPanel job={job} onDecision={decide} />
          <JavaGateAssistantPanel job={job} onConfirm={confirmAssistant} />
        </div>
      </main>

      <Dialog
        open={cancelOpen}
        title="Cancel migration?"
        description="Cancellation stops the active Java workflow and clears the current PhaseGate action. Recorded evidence remains available."
        onClose={() => setCancelOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Keep running
            </Button>
            <Button variant="danger" onClick={confirmCancellation}>
              Confirm cancellation
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-[var(--mf-text-muted)]">
          Job {job.id} is currently in {job.currentPhase.replaceAll("_", " ")}.
          Cancellation is recorded as an explicit pipeline event.
        </p>
      </Dialog>
    </div>
  );
}
