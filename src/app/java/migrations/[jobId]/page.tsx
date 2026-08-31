import type { Metadata } from "next";

import { JavaJobBootstrapPage } from "@/stacks/java/components/java-job-bootstrap-page";

export const metadata: Metadata = {
  title: "Spring Boot Control Tower",
};

export default function Page() {
  return <JavaJobBootstrapPage />;
}
