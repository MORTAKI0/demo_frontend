"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { ProductHeader } from "@/components/shared/product-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import type {
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
import { JavaCurrentAction } from "./java-current-action";
import { JavaEvidenceWorkspace } from "./java-evidence-workspace";
import { JavaGateDecisionPanel } from "./java-gate-decision-panel";
import { JavaOverview } from "./java-overview";
import { JavaPipeline } from "./java-pipeline";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "evidence", label: "Evidence" },
];

export function JavaCockpitPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const [job, setJob] = useState<JavaJobModel>(() => getJavaJob(jobId));
  const [active, setActive] = useState("overview");
  const [error, setError] = useState<string | null>(null);

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
      setError(caught instanceof Error ? caught.message : "Unable to advance Java pipeline.");
    }
  }

  function decide(
    type: JavaPhaseGateType,
    decision: JavaGateDecision,
    options: { comment?: string; overrideSourceProfile?: JavaProfileId },
  ) {
    try {
      setError(null);
      persist(applyJavaGateDecision(job, type, decision, options));
      setActive("pipeline");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to apply Java PhaseGate decision.");
    }
  }

  const canAdvance =
    !job.currentGate &&
    job.status !== "CANCELLED" &&
    job.currentStage !== 4 &&
    job.currentPhase !== "FINAL_REPORT";

  return (
    <div className="mf-page">
      <ProductHeader
        breadcrumb="Spring Boot / Control Tower"
        actions={
          <div className="hidden items-center gap-2 sm:flex">
            <span className="font-mono text-[11px] text-[var(--mf-text-soft)]">{job.id}</span>
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
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{job.name}</h1>
            <p className="mt-1.5 text-sm text-[var(--mf-text-muted)]">
              Java route stages and execution phases are governed independently.
            </p>
          </div>
          {canAdvance ? (
            <Button onClick={advance}>Run next phase</Button>
          ) : null}
        </div>

        <JavaCurrentAction job={job} />

        {error ? (
          <div className="mt-5 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-3 text-sm text-[var(--mf-danger)]">
            {error}
          </div>
        ) : null}

        <div className="mt-7">
          <Tabs items={tabs} active={active} onChange={setActive} ariaLabel="Spring Boot Control Tower workspaces" />
        </div>

        <div className="mt-6">
          {active === "overview" ? <JavaOverview job={job} /> : null}
          {active === "pipeline" ? <JavaPipeline job={job} /> : null}
          {active === "evidence" ? <JavaEvidenceWorkspace job={job} /> : null}
        </div>

        <div className="mt-6">
          <JavaGateDecisionPanel job={job} onDecision={decide} />
        </div>
      </main>
    </div>
  );
}
