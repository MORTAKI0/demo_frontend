import type { Metadata } from "next";
import { AngularSetupPage } from "@/stacks/angular/components/angular-setup-page";

export const metadata: Metadata = { title: "New Angular Migration" };

export default function Page() {
  return <AngularSetupPage />;
}
