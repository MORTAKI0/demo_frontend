import type { Metadata } from "next";

import { JavaReportArtifactPage } from "@/stacks/java/components/java-report-artifact-page";

export const metadata: Metadata = {
  title: "Migration Report Artifact",
};

export default function Page() {
  return <JavaReportArtifactPage />;
}
