"use client";

import type { JavaJobSeed } from "../domain/types";
import type { JavaJobModel } from "../domain/run-types";
import { createJavaJob, prepareJavaMigration } from "../workflow/setup";
import { advanceJavaPipeline, createJavaJobModel } from "../workflow/cockpit";

const STORAGE_KEY = "migration-factory:java:v1";

interface JavaStoredState {
  jobs: Record<string, JavaJobSeed | JavaJobModel>;
}

function emptyState(): JavaStoredState {
  return { jobs: {} };
}

function asJobModel(job: JavaJobSeed | JavaJobModel): JavaJobModel {
  return "pipeline" in job ? job : createJavaJobModel(job);
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

  const configuration = prepareJavaMigration({
    name: id === "java-order-service" ? "Order Service" : "Payments Service",
    sourcePath: "/workspace/order-service",
    outputParent: "/workspace/migration-output",
    environmentImport: "Development baseline",
    sourceProfile: "SB_2_1_J11",
    targetProfile: "SB_4_0_J21",
    continuationPolicy: "MANUAL_ON_WARNING_OR_FAILURE",
    proofLevel: "STRICT",
  });
  let model = createJavaJobModel({
    ...createJavaJob(configuration),
    id,
    status: "RUNNING",
  });

  if (id === "java-order-service") {
    model = advanceJavaPipeline(model);
    model = advanceJavaPipeline(model);
    model = advanceJavaPipeline(model);
  }

  putJavaJob(model);
  return model;
}

export function resetJavaState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
