import type { Metadata } from "next";

import { JavaSetupPage } from "@/stacks/java/components/java-setup-page";

export const metadata: Metadata = {
  title: "New Spring Boot Migration",
};

export default function Page() {
  return <JavaSetupPage />;
}
