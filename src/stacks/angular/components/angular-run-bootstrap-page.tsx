"use client";

import { useParams } from "next/navigation";

import { ProductHeader } from "@/components/shared/product-header";
import { DetailRow } from "@/components/shared/detail-row";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAngularRun } from "../scenarios/angular-store";
import { AngularRouteBoard } from "./angular-route-board";

export function AngularRunBootstrapPage() {
  const params = useParams<{ runId: string }>();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const run = getAngularRun(runId);

  return (
    <div className="mf-page">
      <ProductHeader breadcrumb="Angular / Control Tower" />
      <main className="mf-container py-8 lg:py-10">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#b51f32]">Angular Migration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{run.name}</h1>
          <p className="mt-2 text-sm text-[var(--mf-text-muted)]">
            Angular {run.sourceMajor} → Angular {run.targetMajor}
          </p>
        </div>
        <Panel className="mt-8 max-w-5xl">
          <PanelHeader
            eyebrow="Authoritative run"
            title="G01 approved · source snapshot is next"
            description="The governed run has been created. The next original workflow boundary is G02 Source Snapshot."
            action={<StatusBadge label={run.state} tone="info" />}
          />
          <div className="mt-5">
            <AngularRouteBoard route={run.route} compact />
          </div>
          <dl className="mt-6">
            <DetailRow label="Run ID" value={run.id} mono />
            <DetailRow label="Current gate" value={run.currentGate ?? "—"} />
            <DetailRow label="Current action" value={run.currentAction} />
            <DetailRow label="G01 decision" value={run.g01DecisionId} mono />
            <DetailRow label="Created" value={run.createdAt} />
          </dl>
        </Panel>
      </main>
    </div>
  );
}
