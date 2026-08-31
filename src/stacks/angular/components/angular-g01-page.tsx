"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ProductHeader } from "@/components/shared/product-header";
import { DetailRow } from "@/components/shared/detail-row";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { textareaClassName } from "@/components/ui/form-field";
import type { AngularG01Decision, AngularPreflight } from "../domain/types";
import { applyG01Decision, createRunFromApprovedPreflight } from "../workflow/setup";
import { getAngularPreflight, putAngularPreflight, putAngularRun } from "../scenarios/angular-store";
import { AngularRouteBoard } from "./angular-route-board";

export function AngularG01Page() {
  const params = useParams<{ preflightId: string }>();
  const router = useRouter();
  const preflightId = Array.isArray(params.preflightId) ? params.preflightId[0] : params.preflightId;
  const [preflight, setPreflight] = useState<AngularPreflight>(() => getAngularPreflight(preflightId));
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const approvable = useMemo(
    () => ["PASSED", "PASSED_WITH_WARNINGS"].includes(preflight.status) && preflight.reviewStatus !== "STALE",
    [preflight.status, preflight.reviewStatus],
  );

  function decide(decision: AngularG01Decision) {
    try {
      setError(null);
      const next = applyG01Decision(preflight, decision, comment);
      putAngularPreflight(next);
      setPreflight(next);

      if (decision === "APPROVE" || decision === "APPROVE_WITH_COMMENT") {
        const run = createRunFromApprovedPreflight(next);
        putAngularRun(run);
        router.push(`/angular/migrations/${run.id}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to record G01 decision.");
    }
  }

  return (
    <div className="mf-page">
      <ProductHeader breadcrumb="Angular / G01 Production Readiness" />
      <main className="mf-container py-8 lg:py-10">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--mf-primary)]">G01</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Production Readiness</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--mf-text-muted)]">
              Review the immutable readiness package before the authoritative migration run is created.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge label={preflight.status} />
            <StatusBadge label={preflight.reviewStatus} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-6">
            <Panel>
              <PanelHeader
                eyebrow="Migration route"
                title={`${preflight.runName} · Angular ${preflight.sourceMajor} → ${preflight.targetMajor}`}
                description="G01 is bound to this source, output boundary, requested route, and evidence checksum."
              />
              <div className="mt-5">
                <AngularRouteBoard route={preflight.route} />
              </div>
            </Panel>

            <Panel>
              <PanelHeader eyebrow="Readiness package" title="Evidence summary" />
              <dl className="mt-5">
                <DetailRow label="Source path" value={preflight.sourcePath} mono />
                <DetailRow label="Output parent" value={preflight.outputParent} mono />
                <DetailRow label="Environment" value={<StatusBadge label="READY" />} />
                <DetailRow label="Source analysis" value={`Angular ${preflight.sourceAnalysis.detectedVersion} · ${preflight.sourceAnalysis.projects} projects`} />
                <DetailRow label="Compatibility" value={preflight.blockers.length === 0 ? "Route eligible" : "Blocked"} />
                <DetailRow label="Warnings" value={preflight.warnings.length} />
                <DetailRow label="Blockers" value={preflight.blockers.length} />
                <DetailRow label="Revision" value={`#${preflight.revision}`} />
                <DetailRow label="Bound checksum" value={preflight.checksum} mono />
              </dl>
            </Panel>

            <Panel>
              <PanelHeader eyebrow="Immutable evidence" title="Artifacts" />
              <div className="mt-5 space-y-3">
                {preflight.evidence.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--mf-text-muted)]">{item.summary}</p>
                      </div>
                      <span className="font-mono text-[10px] text-[var(--mf-text-soft)]">{item.category}</span>
                    </div>
                    <p className="mt-3 truncate font-mono text-[10px] text-[var(--mf-text-soft)]">{item.checksum}</p>
                  </div>
                ))}
              </div>
            </Panel>

            {preflight.decisions.length > 0 ? (
              <Panel>
                <PanelHeader eyebrow="History" title="Decision history" />
                <div className="mt-5 space-y-3">
                  {preflight.decisions.map((decision) => (
                    <div key={decision.id} className="flex items-start justify-between gap-4 rounded-lg border border-[var(--mf-border)] p-4">
                      <div>
                        <p className="text-sm font-semibold">{decision.decision.replaceAll("_", " ")}</p>
                        {decision.comment ? <p className="mt-1 text-xs text-[var(--mf-text-muted)]">{decision.comment}</p> : null}
                      </div>
                      <span className="text-[11px] text-[var(--mf-text-soft)]">{decision.timestamp}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}
          </div>

          <aside className="h-fit xl:sticky xl:top-6">
            <Panel>
              <PanelHeader
                eyebrow="Human decision"
                title="Review G01"
                description="No automatic production approval is available for Angular."
              />

              {preflight.warnings.map((warning) => (
                <div key={warning} className="mt-4 rounded-lg border border-[#f1d69d] bg-[var(--mf-warning-soft)] p-3 text-xs leading-5 text-[var(--mf-warning)]">
                  {warning}
                </div>
              ))}
              {preflight.blockers.map((blocker) => (
                <div key={blocker} className="mt-4 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-3 text-xs leading-5 text-[var(--mf-danger)]">
                  {blocker}
                </div>
              ))}

              <textarea
                className={`${textareaClassName} mt-5`}
                placeholder="Optional review comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />

              {error ? (
                <div role="alert" className="mt-3 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-3 text-xs text-[var(--mf-danger)]">
                  {error}
                </div>
              ) : null}

              <div className="mt-5 grid gap-2">
                <Button onClick={() => decide("APPROVE")} disabled={!approvable}>Approve</Button>
                <Button variant="secondary" onClick={() => decide("APPROVE_WITH_COMMENT")} disabled={!approvable || comment.trim().length === 0}>Approve with comment</Button>
                <Button variant="secondary" onClick={() => decide("REQUEST_MODIFICATION")}>Request modification</Button>
                <Button variant="danger" onClick={() => decide("REJECT")}>Reject</Button>
              </div>
            </Panel>
          </aside>
        </div>
      </main>
    </div>
  );
}
