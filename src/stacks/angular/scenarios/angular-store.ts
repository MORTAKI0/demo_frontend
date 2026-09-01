"use client";

import type { AngularPreflight, AngularRunSeed } from "../domain/types";
import type { AngularRunModel } from "../domain/run-types";
import { createAngularRunModel } from "../workflow/run";
import { prepareProvenStage } from "../workflow/proven";
import {
  seedAngularPreflight,
  seedAngularRun,
} from "./seeds";

interface AngularPresentationState {
  preflights: Record<string, AngularPreflight>;
  runs: Record<string, AngularRunModel | AngularRunSeed>;
}

const STORAGE_KEY = "migration-factory:angular:v3";

function emptyState(): AngularPresentationState {
  return { preflights: {}, runs: {} };
}

function asRunModel(run: AngularRunModel | AngularRunSeed): AngularRunModel {
  const model = "gates" in run ? run : createAngularRunModel(run);
  return {
    ...model,
    operations: model.operations ?? {
      commands: [],
      partialDeliveries: [],
      rollbacks: [],
      stageHistory: [],
    },
  };
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
    let model = asRunModel(existing);
    if (
      model.phase === "STAGE_PREPARATION" &&
      !model.stageExecution &&
      !model.liveExecution
    ) {
      model = prepareProvenStage(model);
    }
    if (!("gates" in existing) || model !== existing) putAngularRun(model);
    return model;
  }

  const seeded = seedAngularRun(id);
  putAngularRun(seeded);
  return seeded;
}

export function resetAngularState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
