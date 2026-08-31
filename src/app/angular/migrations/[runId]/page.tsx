import type { Metadata } from "next";
import { AngularControlTowerPage } from "@/stacks/angular/components/angular-control-tower-page";

export const metadata: Metadata = { title: "Angular Control Tower" };

export default function Page() {
  return <AngularControlTowerPage />;
}
