"use client";

import type {
  AngularPresentationState,
  AngularPreflight,
  AngularRunSeed,
} from "../domain/types";
import {
  applyG01Decision,
  createRunFromApprovedPreflight,
  prepareAngularPreflight,
} from "../workflow/setup";

const STORAGE_KEY = "migration-factory:angular:v1";

function emptyState(): AngularPresentationState {
  return { preflights: {}, runs: {} };
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

export function putAngularRun(run: AngularRunSeed): AngularPresentationState {
  const state = loadAngularState();
  const next = { ...state, runs: { ...state.runs, [run.id]: run } };
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

export function getAngularRun(id: string): AngularRunSeed {
  const existing = loadAngularState().runs[id];
  if (existing) return existing;

  const preflight = seedAngularPreflight("preflight-customer-portal-11-15");
  const approved = applyG01Decision(preflight, "APPROVE");
  const seeded = { ...createRunFromApprovedPreflight(approved), id };
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

export function resetAngularState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
