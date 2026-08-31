"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { ProductHeader } from "@/components/shared/product-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import type {
  AngularGovernanceDecision,
  AngularPreTransformGateId,
  AngularRunModel,
} from "../domain/run-types";
import { getAngularRun, putAngularRun } from "../scenarios/angular-store";
import { applyAngularGateDecision } from "../workflow/run";
import { applyAngularStageGateDecision } from "../workflow/proven";
import {
  createAngularPartialDelivery,
  restartAngularActiveStage,
  resumeAngularFromSealed,
  rollbackAngularToFurthestSealed,
} from "../workflow/recovery";
import { AngularCurrentAction } from "./angular-current-action";
import { AngularDiagnosticsWorkspace } from "./angular-diagnostics-workspace";
import { AngularEvidenceWorkspace } from "./angular-evidence-workspace";
import { AngularGateDecisionPanel } from "./angular-gate-decision-panel";
import { AngularOverview } from "./angular-overview";
import { AngularPipeline } from "./angular-pipeline";
import { AngularProvenExecution } from "./angular-proven-execution";
import { AngularRepairWorkspace } from "./angular-repair-workspace";
import { AngularStageDecisionPanel } from "./angular-stage-decision-panel";
import type { AngularStageGateDecision, AngularStageGateId } from "../domain/run-types";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "evidence", label: "Evidence" },
  { id: "diagnostics", label: "Diagnostics" },
];

export function AngularControlTowerPage() {
  const params = useParams<{ runId: string }>();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const [run, setRun] = useState<AngularRunModel>(() => getAngularRun(runId));
  const [active, setActive] = useState("overview");
  const [error, setError] = useState<string | null>(null);

  function handleDecision(
    gate: AngularPreTransformGateId,
    decision: AngularGovernanceDecision,
    comment: string,
  ) {
    try {
      setError(null);
      const next = applyAngularGateDecision(run, gate, decision, comment);
      putAngularRun(next);
      setRun(next);
      if (decision === "REQUEST_MODIFICATION") setActive("pipeline");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to apply governance decision.");
    }
  }

  function handleStageDecision(
    gate: AngularStageGateId,
    decision: AngularStageGateDecision,
    comment: string,
  ) {
    try {
      setError(null);
      const next = applyAngularStageGateDecision(run, gate, decision, comment);
      putAngularRun(next);
      setRun(next);
      setActive("pipeline");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to apply stage governance decision.");
    }
  }

  function applyRecovery(action: "delivery" | "rollback" | "resume" | "restart") {
    try {
      setError(null);
      const next =
        action === "delivery"
          ? createAngularPartialDelivery(run)
          : action === "rollback"
            ? rollbackAngularToFurthestSealed(run)
            : action === "resume"
              ? resumeAngularFromSealed(run)
              : restartAngularActiveStage(run);
      putAngularRun(next);
      setRun(next);
      setActive("diagnostics");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to apply recovery action.");
    }
  }

  return (
    <div className="mf-page">
      <ProductHeader
        breadcrumb="Angular / Control Tower"
        actions={
          <div className="hidden items-center gap-2 sm:flex">
            <span className="font-mono text-[11px] text-[var(--mf-text-soft)]">{run.id}</span>
            <StatusBadge label={run.state} />
          </div>
        }
      />
      <main className="mf-container py-7 lg:py-9">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#b51f32]">Angular Migration</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{run.name}</h1>
            <p className="mt-1.5 text-sm text-[var(--mf-text-muted)]">
              Angular {run.sourceMajor} → Angular {run.targetMajor} · governed adjacent-major execution
            </p>
          </div>
          <p className="text-xs text-[var(--mf-text-soft)]">Elapsed 18m 42s · evidence synchronized</p>
        </div>

        <AngularCurrentAction run={run} />

        {error ? (
          <div className="mt-5 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-3 text-sm text-[var(--mf-danger)]">
            {error}
          </div>
        ) : null}

        <div className="mt-7">
          <Tabs items={tabs} active={active} onChange={setActive} ariaLabel="Angular Control Tower workspaces" />
        </div>

        <div className="mt-6">
          {active === "overview" ? <AngularOverview run={run} /> : null}
          {active === "pipeline" ? (
            <div className="space-y-6">
              <AngularPipeline run={run} />
              <AngularProvenExecution run={run} />
              <AngularRepairWorkspace run={run} />
            </div>
          ) : null}
          {active === "evidence" ? <AngularEvidenceWorkspace run={run} /> : null}
          {active === "diagnostics" ? (
            <AngularDiagnosticsWorkspace
              run={run}
              onPartialDelivery={() => applyRecovery("delivery")}
              onRollback={() => applyRecovery("rollback")}
              onResume={() => applyRecovery("resume")}
              onRestart={() => applyRecovery("restart")}
            />
          ) : null}
        </div>

        <div className="mt-6">
          <AngularGateDecisionPanel run={run} onDecision={handleDecision} />
          <AngularStageDecisionPanel run={run} onDecision={handleStageDecision} />
        </div>
      </main>
    </div>
  );
}
