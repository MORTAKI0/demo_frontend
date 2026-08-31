"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DetailRow } from "@/components/shared/detail-row";
import { ProductHeader } from "@/components/shared/product-header";
import { Button } from "@/components/ui/button";
import { FormField, fieldClassName } from "@/components/ui/form-field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  JAVA_PROFILES,
  type JavaContinuationPolicy,
  type JavaProfileId,
  type JavaProofLevel,
} from "../domain/types";
import {
  JAVA_CONTINUATION_POLICIES,
  createJavaJob,
  prepareJavaMigration,
  profileById,
} from "../workflow/setup";
import { putJavaJob } from "../scenarios/java-store";
import { JavaRouteBoard } from "./java-route-board";

const policyLabels: Record<JavaContinuationPolicy, string> = {
  AUTO_ON_GREEN: "Auto on green",
  MANUAL: "Manual",
  MANUAL_ON_WARNING_OR_FAILURE: "Manual on warning or failure",
};

export function JavaSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("Order Service");
  const [sourcePath, setSourcePath] = useState("/workspace/order-service");
  const [outputParent, setOutputParent] = useState("/workspace/migration-output");
  const [environmentImport, setEnvironmentImport] = useState("Development baseline");
  const [sourceProfile, setSourceProfile] = useState<JavaProfileId>("SB_2_7_J11");
  const [targetProfile, setTargetProfile] = useState<JavaProfileId>("SB_3_5_J21");
  const [continuationPolicy, setContinuationPolicy] =
    useState<JavaContinuationPolicy>("MANUAL_ON_WARNING_OR_FAILURE");
  const [proofLevel, setProofLevel] = useState<JavaProofLevel>("STRICT");
  const [error, setError] = useState<string | null>(null);

  const sourceIndex = JAVA_PROFILES.findIndex((profile) => profile.id === sourceProfile);
  const targetOptions = JAVA_PROFILES.filter((_, index) => index > sourceIndex);

  const configuration = useMemo(
    () =>
      prepareJavaMigration({
        name,
        sourcePath,
        outputParent,
        environmentImport,
        sourceProfile,
        targetProfile,
        continuationPolicy,
        proofLevel,
      }),
    [
      name,
      sourcePath,
      outputParent,
      environmentImport,
      sourceProfile,
      targetProfile,
      continuationPolicy,
      proofLevel,
    ],
  );

  function changeSource(next: JavaProfileId) {
    setSourceProfile(next);
    const nextIndex = JAVA_PROFILES.findIndex((profile) => profile.id === next);
    const currentTargetIndex = JAVA_PROFILES.findIndex((profile) => profile.id === targetProfile);
    if (currentTargetIndex <= nextIndex) {
      setTargetProfile(JAVA_PROFILES[nextIndex + 1]?.id ?? "SB_4_0_J21");
    }
  }

  function startMigration() {
    try {
      setError(null);
      const job = createJavaJob(configuration);
      putJavaJob(job);
      router.push("/java/migrations/" + job.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create migration.");
    }
  }

  return (
    <div className="mf-page">
      <ProductHeader breadcrumb="Spring Boot / New Migration" />
      <main className="mf-container py-8 lg:py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#355d9a]">
            Spring Boot Migration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">New migration</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--mf-text-muted)]">
            Configure the project, runtime profiles, proof policy, migration route, and continuation behavior before the Java Control Tower starts its phase pipeline.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <Panel>
              <PanelHeader
                eyebrow="01"
                title="Project & paths"
                description="The configured source remains the project authority while migration output is isolated under the selected parent."
              />
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FormField label="Migration name">
                  <input className={fieldClassName} value={name} onChange={(event) => setName(event.target.value)} />
                </FormField>
                <FormField label="Project path">
                  <input className={fieldClassName} value={sourcePath} onChange={(event) => setSourcePath(event.target.value)} />
                </FormField>
                <FormField label="Output parent">
                  <input className={fieldClassName} value={outputParent} onChange={(event) => setOutputParent(event.target.value)} />
                </FormField>
                <FormField label="Environment import">
                  <input className={fieldClassName} value={environmentImport} onChange={(event) => setEnvironmentImport(event.target.value)} />
                </FormField>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="02"
                title="Profiles & execution policy"
                description="Route stages and execution phases are configured independently. The source/target profile chooses the route; continuation policy governs what happens after a stage result."
              />
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FormField label="Source profile">
                  <select className={fieldClassName} value={sourceProfile} onChange={(event) => changeSource(event.target.value as JavaProfileId)}>
                    {JAVA_PROFILES.slice(0, -1).map((profile) => (
                      <option key={profile.id} value={profile.id}>{profile.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Target profile">
                  <select className={fieldClassName} value={targetProfile} onChange={(event) => setTargetProfile(event.target.value as JavaProfileId)}>
                    {targetOptions.map((profile) => (
                      <option key={profile.id} value={profile.id}>{profile.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Continuation policy">
                  <select className={fieldClassName} value={continuationPolicy} onChange={(event) => setContinuationPolicy(event.target.value as JavaContinuationPolicy)}>
                    {JAVA_CONTINUATION_POLICIES.map((policy) => (
                      <option key={policy} value={policy}>{policyLabels[policy]}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Proof level">
                  <select className={fieldClassName} value={proofLevel} onChange={(event) => setProofLevel(event.target.value as JavaProofLevel)}>
                    <option value="STANDARD">Standard</option>
                    <option value="STRICT">Strict</option>
                  </select>
                </FormField>
              </div>
              <div className="mt-5 rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--mf-text-soft)]">
                  Pre-transform approval
                </p>
                <p className="mt-2 text-sm font-semibold">Human approval required</p>
                <p className="mt-1 text-xs leading-5 text-[var(--mf-text-muted)]">
                  This approval mode applies to the pre-transform approval phase only; it does not normalize the other Java phase gates.
                </p>
              </div>
            </Panel>

            <Panel>
              <PanelHeader eyebrow="03" title="Route projection" />
              <div className="mt-5">
                <JavaRouteBoard route={configuration.route} />
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="04"
                title="Environment readiness"
                description="Java 11, 17, 21, Maven, and AI/Azure smoke readiness are checked before the job starts."
              />
              <div className="mt-5 divide-y divide-[var(--mf-border)]">
                {configuration.environment.map((check) => (
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
          </div>

          <aside className="h-fit xl:sticky xl:top-6">
            <Panel>
              <PanelHeader eyebrow="Readiness" title="Migration configuration" />
              <dl className="mt-5">
                <DetailRow label="Source" value={profileById(sourceProfile).label} />
                <DetailRow label="Target" value={profileById(targetProfile).label} />
                <DetailRow label="Included stages" value={configuration.route.filter((stage) => stage.disposition === "INCLUDED").length} />
                <DetailRow label="Continuation" value={policyLabels[continuationPolicy]} />
                <DetailRow label="Proof" value={proofLevel} />
                <DetailRow label="Repair attempts" value={configuration.maxRepairAttempts} />
                <DetailRow label="Readiness" value={<StatusBadge label={configuration.readiness} />} />
              </dl>
              {configuration.blockers.map((blocker) => (
                <div key={blocker} className="mt-4 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-3 text-xs text-[var(--mf-danger)]">
                  {blocker}
                </div>
              ))}
              {error ? (
                <div className="mt-4 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-3 text-xs text-[var(--mf-danger)]">
                  {error}
                </div>
              ) : null}
              <Button className="mt-5 w-full" onClick={startMigration} disabled={configuration.readiness !== "READY"}>
                Create governed migration
              </Button>
            </Panel>
          </aside>
        </div>
      </main>
    </div>
  );
}
