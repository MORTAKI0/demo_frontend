import type { Metadata } from "next";
import { AngularRunBootstrapPage } from "@/stacks/angular/components/angular-run-bootstrap-page";

export const metadata: Metadata = { title: "Angular Control Tower" };

export default function Page() {
  return <AngularRunBootstrapPage />;
}
