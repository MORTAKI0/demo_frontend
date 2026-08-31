"use client";

import type { JavaJobSeed, JavaPresentationState } from "../domain/types";
import { createJavaJob, prepareJavaMigration } from "../workflow/setup";

const STORAGE_KEY = "migration-factory:java:v1";

function emptyState(): JavaPresentationState {
  return { jobs: {} };
}

export function loadJavaState(): JavaPresentationState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as JavaPresentationState;
    return { jobs: parsed.jobs ?? {} };
  } catch {
    return emptyState();
  }
}

export function saveJavaState(state: JavaPresentationState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function putJavaJob(job: JavaJobSeed): JavaPresentationState {
  const state = loadJavaState();
  const next = { ...state, jobs: { ...state.jobs, [job.id]: job } };
  saveJavaState(next);
  return next;
}

export function getJavaJob(id: string): JavaJobSeed {
  const existing = loadJavaState().jobs[id];
  if (existing) return existing;

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
  const job = { ...createJavaJob(configuration), id, status: "RUNNING" as const };
  putJavaJob(job);
  return job;
}

export function resetJavaState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
