import type { Metadata } from "next";

import { JavaCockpitPage } from "@/stacks/java/components/java-cockpit-page";

export const metadata: Metadata = {
  title: "Spring Boot Control Tower",
};

export default function Page() {
  return <JavaCockpitPage />;
}
