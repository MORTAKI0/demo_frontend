"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ProductHeader } from "@/components/shared/product-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getJavaJob } from "../scenarios/java-store";
import { getJavaReportArtifact } from "../workflow/terminal";

export function JavaReportArtifactPage() {
  const params = useParams<{ jobId: string; artifactId: string }>();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const artifactId = Array.isArray(params.artifactId)
    ? params.artifactId[0]
    : params.artifactId;
  const job = getJavaJob(jobId);

  let artifact: ReturnType<typeof getJavaReportArtifact> | undefined;
  let error: string | null = null;
  try {
    artifact = getJavaReportArtifact(job, decodeURIComponent(artifactId));
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Unable to load final-report artifact.";
  }

  return (
    <div className="mf-page">
      <ProductHeader breadcrumb="Spring Boot / Final Report Artifact" />
      <main className="mf-container py-8 lg:py-10">
        <div className="mb-6">
          <Link
            href={"/java/migrations/" + job.id}
            className="mf-focus text-sm font-semibold text-[var(--mf-primary)] hover:underline"
          >
            ← Back to Control Tower
          </Link>
        </div>
        <Panel>
          <PanelHeader
            eyebrow="Final Report"
            title={artifact?.label ?? "Artifact unavailable"}
            description={
              artifact
                ? artifact.mediaType + " · " + artifact.id
                : "The requested report artifact is not currently available."
            }
          />
          {artifact ? (
            <pre className="mf-scrollbar mt-5 max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--mf-graphite)] p-5 font-mono text-xs leading-6 text-[#dbe3ee]">
              {artifact.content}
            </pre>
          ) : (
            <div className="mt-5 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-4 text-sm text-[var(--mf-danger)]">
              {error}
            </div>
          )}
        </Panel>
      </main>
    </div>
  );
}
