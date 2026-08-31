"use client";

import type { AngularPreflight, AngularRunSeed } from "../domain/types";
import type { AngularRunModel } from "../domain/run-types";
import {
  applyG01Decision,
  createRunFromApprovedPreflight,
  prepareAngularPreflight,
} from "../workflow/setup";
import {
  applyAngularGateDecision,
  createAngularRunModel,
} from "../workflow/run";

interface AngularPresentationState {
  preflights: Record<string, AngularPreflight>;
  runs: Record<string, AngularRunModel | AngularRunSeed>;
}

const STORAGE_KEY = "migration-factory:angular:v1";

function emptyState(): AngularPresentationState {
  return { preflights: {}, runs: {} };
}

function asRunModel(run: AngularRunModel | AngularRunSeed): AngularRunModel {
  return "gates" in run ? run : createAngularRunModel(run);
}

export function loadAngularState(): AngularPresentationState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as AngularPresentationState;
    return { preflights: parsed.preflights ?? {}, runs: parsed.runs ?? {} };
  } catch {
    return emptyState();
  }
}

export function saveAngularState(state: AngularPresentationState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function putAngularPreflight(preflight: AngularPreflight): AngularPresentationState {
  const state = loadAngularState();
  const next = { ...state, preflights: { ...state.preflights, [preflight.id]: preflight } };
  saveAngularState(next);
  return next;
}

export function putAngularRun(run: AngularRunModel | AngularRunSeed): AngularPresentationState {
  const state = loadAngularState();
  const model = asRunModel(run);
  const next = { ...state, runs: { ...state.runs, [model.id]: model } };
  saveAngularState(next);
  return next;
}

export function getAngularPreflight(id: string): AngularPreflight {
  const existing = loadAngularState().preflights[id];
  if (existing) return existing;
  const seeded = seedAngularPreflight(id);
  putAngularPreflight(seeded);
  return seeded;
}

export function getAngularRun(id: string): AngularRunModel {
  const existing = loadAngularState().runs[id];
  if (existing) {
    const model = asRunModel(existing);
    if (!("gates" in existing)) putAngularRun(model);
    return model;
  }

  const seeded = seedAngularRun(id);
  putAngularRun(seeded);
  return seeded;
}

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
  const preflight = seedAngularPreflight("preflight-customer-portal-11-15");
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

  let model = createAngularRunModel({ ...approvedRunSeed(), id });
  if (id === "run-angular-action") {
    model = applyAngularGateDecision(model, "G02", "APPROVE");
    model = applyAngularGateDecision(model, "G03", "APPROVE");
    model = applyAngularGateDecision(model, "G04", "APPROVE");
    model = applyAngularGateDecision(model, "G05", "APPROVE");
    model = applyAngularGateDecision(model, "G06", "APPROVE");
  }
  return model;
}

export function resetAngularState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
