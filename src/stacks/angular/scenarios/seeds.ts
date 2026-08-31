import type { AngularPreflight, AngularRunSeed } from "../domain/types.ts";
import type { AngularRunModel } from "../domain/run-types.ts";
import {
  applyG01Decision,
  createRunFromApprovedPreflight,
  prepareAngularPreflight,
} from "../workflow/setup.ts";
import {
  applyAngularGateDecision,
  createAngularRunModel,
} from "../workflow/run.ts";
import { applyAngularStageGateDecision } from "../workflow/proven.ts";

export function seedAngularPreflight(id: string): AngularPreflight {
  const primary = prepareAngularPreflight({
    runName: "Customer Portal",
    sourcePath: "/workspace/customer-portal-angular11",
    outputParent: "/workspace/migration-output",
    sourceMajor: 11,
    targetMajor: 15,
  });
  return { ...primary, id };
}

function approvedRunSeed(): AngularRunSeed {
  const preflight = seedAngularPreflight(
    "preflight-customer-portal-11-15",
  );
  const approved = applyG01Decision(preflight, "APPROVE");
  return createRunFromApprovedPreflight(approved);
}

export function seedAngularRun(id: string): AngularRunModel {
  if (id === "run-angular-complete") {
    const seed = approvedRunSeed();
    return createAngularRunModel({
      ...seed,
      id,
      state: "COMPLETED",
      currentGate: null,
      currentAction: "Requested target achieved",
    });
  }

  let model = createAngularRunModel({
    ...approvedRunSeed(),
    id,
  });

  if (id === "run-angular-action") {
    model = applyAngularGateDecision(model, "G02", "APPROVE");
    model = applyAngularGateDecision(model, "G03", "APPROVE");
    model = applyAngularGateDecision(model, "G04", "APPROVE");
    model = applyAngularGateDecision(model, "G05", "APPROVE");
    model = applyAngularGateDecision(model, "G06", "APPROVE");

    model = applyAngularStageGateDecision(model, "G07", "APPROVE");
    model = applyAngularStageGateDecision(model, "G12", "APPROVE");
    model = applyAngularStageGateDecision(model, "G07", "APPROVE");
    model = applyAngularStageGateDecision(model, "G12", "APPROVE");
    model = applyAngularStageGateDecision(model, "G07", "APPROVE");
  }

  return model;
}
