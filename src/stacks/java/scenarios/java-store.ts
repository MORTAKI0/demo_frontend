"use client";

import type { JavaJobSeed } from "../domain/types";
import type { JavaJobModel } from "../domain/run-types";
import { createJavaJobModel } from "../workflow/cockpit";
import { seedJavaJob } from "./seeds";

const STORAGE_KEY = "migration-factory:java:v2";

interface JavaStoredState {
  jobs: Record<string, JavaJobSeed | JavaJobModel>;
}

function emptyState(): JavaStoredState {
  return { jobs: {} };
}

function asJobModel(job: JavaJobSeed | JavaJobModel): JavaJobModel {
  const model = "pipeline" in job ? job : createJavaJobModel(job);
  return {
    ...model,
    repair: model.repair
      ? {
          ...model.repair,
          attempts: model.repair.attempts.map((attempt) => ({
            ...attempt,
            stage: attempt.stage ?? 2,
          })),
        }
      : {
          attempts: [],
          maxAttempts: 3,
        },
    terminalStage4: {
      ...model.terminalStage4,
      outputRevisions: model.terminalStage4.outputRevisions ?? [],
      targetVersions: model.terminalStage4.targetVersions ?? {
        rows: [],
        changes: [],
        status: "EMPTY",
        diff: "",
        repairAttempts: [],
      },
      validation: model.terminalStage4.validation ?? "PENDING",
    },
    finalReport: model.finalReport ?? {
      status: "BLOCKED",
      artifacts: [],
    },
  };
}

export function loadJavaState(): JavaStoredState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as JavaStoredState;
    return { jobs: parsed.jobs ?? {} };
  } catch {
    return emptyState();
  }
}

export function saveJavaState(state: JavaStoredState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function putJavaJob(job: JavaJobSeed | JavaJobModel): JavaStoredState {
  const state = loadJavaState();
  const model = asJobModel(job);
  const next = { ...state, jobs: { ...state.jobs, [model.id]: model } };
  saveJavaState(next);
  return next;
}

export function getJavaJob(id: string): JavaJobModel {
  const existing = loadJavaState().jobs[id];
  if (existing) {
    const model = asJobModel(existing);
    if (!("pipeline" in existing)) putJavaJob(model);
    return model;
  }

  const model = seedJavaJob(id);
  putJavaJob(model);
  return model;
}

export function resetJavaState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
