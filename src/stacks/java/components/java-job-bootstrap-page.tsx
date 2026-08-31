"use client";

import { useParams } from "next/navigation";

import { DetailRow } from "@/components/shared/detail-row";
import { ProductHeader } from "@/components/shared/product-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { getJavaJob } from "../scenarios/java-store";
import { JavaRouteBoard } from "./java-route-board";

export function JavaJobBootstrapPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const job = getJavaJob(jobId);

  return (
    <div className="mf-page">
      <ProductHeader breadcrumb="Spring Boot / Control Tower" />
      <main className="mf-container py-8 lg:py-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#355d9a]">
            Spring Boot Migration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{job.name}</h1>
          <p className="mt-2 text-sm text-[var(--mf-text-muted)]">
            Route projection and execution pipeline remain separate authorities.
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Panel>
            <PanelHeader
              eyebrow="Route"
              title="Spring Boot profile progression"
              description="Included, skipped, and excluded route stages are derived from the selected source and target profiles."
            />
            <div className="mt-5">
              <JavaRouteBoard route={job.configuration.route} />
            </div>
          </Panel>

          <Panel className="h-fit">
            <PanelHeader
              eyebrow="Execution"
              title="Pipeline entry"
              action={<StatusBadge label={job.status} />}
            />
            <dl className="mt-5">
              <DetailRow label="Job ID" value={job.id} mono />
              <DetailRow label="Current route stage" value={job.currentStage ?? "—"} />
              <DetailRow label="Current phase" value={job.currentPhase} />
              <DetailRow label="Current action" value={job.currentAction} />
              <DetailRow label="Continuation" value={job.configuration.continuationPolicy.replaceAll("_", " ")} />
              <DetailRow label="Pre-transform approval" value="Human required" />
            </dl>
          </Panel>
        </div>
      </main>
    </div>
  );
}
