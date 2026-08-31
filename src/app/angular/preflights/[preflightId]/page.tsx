import type { Metadata } from "next";
import { AngularG01Page } from "@/stacks/angular/components/angular-g01-page";

export const metadata: Metadata = { title: "G01 Production Readiness" };

export default function Page() {
  return <AngularG01Page />;
}
