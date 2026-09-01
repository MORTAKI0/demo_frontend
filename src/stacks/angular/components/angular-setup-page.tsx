"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ProductHeader } from "@/components/shared/product-header";
import { DetailRow } from "@/components/shared/detail-row";
import { Button } from "@/components/ui/button";
import { FormField, fieldClassName } from "@/components/ui/form-field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ANGULAR_MAJORS, type AngularMajor } from "../domain/types";
import { computeAngularRoute, prepareAngularPreflight } from "../workflow/setup";
import { putAngularPreflight } from "../scenarios/angular-store";
import { AngularRouteBoard } from "./angular-route-board";

export function AngularSetupPage() {
  const router = useRouter();
  const [runName, setRunName] = useState("Angular 11 CRUD Example");
  const [sourcePath, setSourcePath] = useState("/workspace/angular-11-crud-example");
  const [outputParent, setOutputParent] = useState("/workspace/migration-output");
  const [sourceMajor, setSourceMajor] = useState<AngularMajor>(11);
  const [targetMajor, setTargetMajor] = useState<AngularMajor>(21);
  const [error, setError] = useState<string | null>(null);

  const route = useMemo(
    () => computeAngularRoute(sourceMajor, targetMajor),
    [sourceMajor, targetMajor],
  );

  const preview = useMemo(
    () =>
      prepareAngularPreflight({
        runName,
        sourcePath,
        outputParent,
        sourceMajor,
        targetMajor,
      }),
    [runName, sourcePath, outputParent, sourceMajor, targetMajor],
  );

  const targetOptions = ANGULAR_MAJORS.filter((major) => major > sourceMajor);

  function handleSourceChange(value: AngularMajor) {
    setSourceMajor(value);
    if (targetMajor <= value) {
      setTargetMajor((ANGULAR_MAJORS.find((major) => major > value) ?? 21) as AngularMajor);
    }
  }

  function reviewReadiness() {
    try {
      setError(null);
      const preflight = prepareAngularPreflight({
        runName,
        sourcePath,
        outputParent,
        sourceMajor,
        targetMajor,
      });
      putAngularPreflight(preflight);
      router.push(`/angular/preflights/${preflight.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to prepare migration.");
    }
  }

  return (
    <div className="mf-page">
      <ProductHeader breadcrumb="Angular / New Migration" />
      <main className="mf-container py-8 lg:py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#b51f32]">
            Angular Migration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">New migration</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--mf-text-muted)]">
            Validate the source, compute an adjacent-major route, prove environment readiness, and prepare the governed G01 Production Readiness review.
          </p>
        </div>

        <Panel className="mb-6 bg-[var(--mf-surface-subtle)]">
          <PanelHeader
            eyebrow="Calculated route"
            title={`Angular ${sourceMajor} → Angular ${targetMajor}`}
            description="Every requested major is executed as an adjacent, evidence-backed stage."
          />
          <div className="mt-5">
            <AngularRouteBoard route={route} />
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Panel>
              <PanelHeader
                eyebrow="01"
                title="Project"
                description="The source remains read-only. Migration output is materialized under the configured output boundary."
              />
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FormField label="Run name">
                  <input className={fieldClassName} value={runName} onChange={(event) => setRunName(event.target.value)} />
                </FormField>
                <FormField label="Source application">
                  <input className={fieldClassName} value={sourcePath} onChange={(event) => setSourcePath(event.target.value)} />
                </FormField>
                <FormField label="Output parent">
                  <input className={fieldClassName} value={outputParent} onChange={(event) => setOutputParent(event.target.value)} />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Detected source">
                    <select
                      className={fieldClassName}
                      value={sourceMajor}
                      onChange={(event) => handleSourceChange(Number(event.target.value) as AngularMajor)}
                    >
                      {ANGULAR_MAJORS.slice(0, -1).map((major) => (
                        <option key={major} value={major}>Angular {major}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Requested target">
                    <select
                      className={fieldClassName}
                      value={targetMajor}
                      onChange={(event) => setTargetMajor(Number(event.target.value) as AngularMajor)}
                    >
                      {targetOptions.map((major) => (
                        <option key={major} value={major}>Angular {major}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="02"
                title="Environment diagnostics"
                description="Required runtime, CLI, browser, catalogue, and AI capabilities are verified before production readiness can be reviewed."
              />
              <div className="mt-5 divide-y divide-[var(--mf-border)]">
                {preview.environment.map((check) => (
                  <div key={check.id} className="flex items-center justify-between gap-5 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold">{check.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--mf-text-muted)]">{check.value}</p>
                    </div>
                    <StatusBadge label={check.status} />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="03"
                title="Source review"
                description="Deterministic source analysis identifies the Angular family, workspace topology, builder, lockfile authority, and dependency footprint."
              />
              <dl className="mt-5">
                <DetailRow label="Application" value={preview.sourceAnalysis.applicationName} mono />
                <DetailRow label="Detected Angular" value={preview.sourceAnalysis.detectedVersion} />
                <DetailRow label="Angular CLI" value={preview.sourceAnalysis.angularCliVersion} />
                <DetailRow label="TypeScript / RxJS" value={`${preview.sourceAnalysis.typescriptVersion} / ${preview.sourceAnalysis.rxjsVersion}`} />
                <DetailRow label="Workspace" value={preview.sourceAnalysis.workspace} />
                <DetailRow label="Projects" value={preview.sourceAnalysis.projects} />
                <DetailRow label="Lazy feature modules" value={preview.sourceAnalysis.lazyFeatureModules} />
                <DetailRow label="CRUD HTTP operations" value={preview.sourceAnalysis.crudOperations} />
                <DetailRow label="Builder" value={preview.sourceAnalysis.builder} mono />
                <DetailRow label="Lockfile" value={preview.sourceAnalysis.lockfile} mono />
                <DetailRow label="Manifest entries" value={`${preview.sourceAnalysis.dependencyCount} total · ${preview.sourceAnalysis.thirdPartyPackages} non-Angular`} />
                <DetailRow label="Confidence" value={<StatusBadge label={preview.sourceAnalysis.confidence} tone="success" />} />
              </dl>
            </Panel>
          </div>

          <aside className="h-fit xl:sticky xl:top-6">
            <Panel>
              <PanelHeader eyebrow="Review" title="Production readiness" />
              <dl className="mt-5">
                <DetailRow label="Source" value={`Angular ${sourceMajor}`} />
                <DetailRow label="Target" value={`Angular ${targetMajor}`} />
                <DetailRow label="Stages" value={route.length} />
                <DetailRow label="Source protection" value="Read-only" />
                <DetailRow label="Readiness" value={<StatusBadge label={preview.status} />} />
                <DetailRow label="Warnings" value={preview.warnings.length} />
                <DetailRow label="Blockers" value={preview.blockers.length} />
                <DetailRow label="Evidence" value={preview.evidence.length} />
              </dl>

              {preview.warnings.length > 0 ? (
                <div className="mt-4 rounded-lg border border-[#f1d69d] bg-[var(--mf-warning-soft)] p-3 text-xs leading-5 text-[var(--mf-warning)]">
                  {preview.warnings[0]}
                </div>
              ) : null}

              {error ? (
                <div role="alert" className="mt-4 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-3 text-xs leading-5 text-[var(--mf-danger)]">
                  {error}
                </div>
              ) : null}

              <Button className="mt-5 w-full" onClick={reviewReadiness} disabled={preview.status === "BLOCKED"}>
                Review production readiness
              </Button>
              <p className="mt-3 text-center text-[11px] leading-4 text-[var(--mf-text-soft)]">
                Run creation remains locked until G01 is explicitly approved.
              </p>
            </Panel>
          </aside>
        </div>
      </main>
    </div>
  );
}
