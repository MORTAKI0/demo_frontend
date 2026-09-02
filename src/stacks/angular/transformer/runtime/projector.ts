import { stableDisplayChecksum } from "../../../../scenarios/runtime/checksum.ts";
import {
  PRIMARY_TRANSFORMER_PHASE_WEIGHTS,
  PROVEN_NODE_CATALOGUE,
} from "../data/node-catalogue.ts";
import type { TransformerEvent } from "../domain/events.ts";
import type { TransformerGateId } from "../domain/gates.ts";
import type { TransformerGatePolicy } from "../domain/scenarios.ts";
import type {
  PrimaryTransformerPhaseId,
  TransformerRuntime,
  TransformerRuntimeStatus,
} from "../domain/types.ts";
import { buildTransformerNodeEventSchedule } from "./event-schedule.ts";
import {
  gateBoundariesForPolicy,
  nodesForGatePolicy,
} from "./gate-boundaries.ts";

export interface TransformerRuntimeProjection {
  status: TransformerRuntimeStatus;
  activeGate?: TransformerGateId;
  currentNodeId?: string;
  completedNodeIds: string[];
  events: TransformerEvent[];
  stageProgressPercent: number;
  routeProgress: {
    sealedStages: number;
    totalStages: number;
  };
  effectiveElapsedMs: number;
  uninterruptedStageDurationMs: number;
}

interface ProjectTransformerRuntimeOptions {
  nowMs: number;
  gatePolicy: TransformerGatePolicy;
}

function nodeWeights(): Map<string, number> {
  const counts = new Map<PrimaryTransformerPhaseId, number>();
  for (const node of PROVEN_NODE_CATALOGUE) {
    counts.set(node.phaseId, (counts.get(node.phaseId) ?? 0) + 1);
  }

  return new Map(
    PROVEN_NODE_CATALOGUE.map((node) => [
      node.id,
      PRIMARY_TRANSFORMER_PHASE_WEIGHTS[node.phaseId] /
        (counts.get(node.phaseId) ?? 1),
    ]),
  );
}

const NODE_WEIGHTS = nodeWeights();

function progressFor(
  completedNodeIds: readonly string[],
  status: TransformerRuntimeStatus,
): number {
  const weighted = completedNodeIds.reduce(
    (sum, nodeId) => sum + (NODE_WEIGHTS.get(nodeId) ?? 0),
    0,
  );
  if (status === "SEALED" || status === "COMPLETED") {
    return 100;
  }
  return Math.min(99, Math.round(weighted));
}

function appendNodeEvents(
  target: TransformerEvent[],
  source: readonly TransformerEvent[],
  nodeStartOffsetMs: number,
  visibleThroughNodeMs: number,
): void {
  const sequenceBase = target.at(-1)?.sequence ?? 0;
  const stateBase = target.at(-1)?.stateVersion ?? 0;
  const wakeBase = target.at(-1)?.wakeSequence ?? 0;
  const visible = source.filter((event) => event.offsetMs <= visibleThroughNodeMs);

  for (const event of visible) {
    target.push({
      ...event,
      sequence: sequenceBase + event.sequence,
      offsetMs: nodeStartOffsetMs + event.offsetMs,
      stateVersion: stateBase + event.stateVersion,
      wakeSequence: wakeBase + event.wakeSequence,
    });
  }
}

function appendGateEvent(
  target: TransformerEvent[],
  runtime: TransformerRuntime,
  gateId: TransformerGateId,
  nodeId: string,
  phaseId: string,
  offsetMs: number,
  status: "WAITING" | "APPROVED",
): void {
  const last = target.at(-1);
  target.push({
    sequence: (last?.sequence ?? 0) + 1,
    offsetMs,
    kind: "GATE",
    phaseId,
    nodeId,
    stateVersion: (last?.stateVersion ?? 0) + 1,
    wakeSequence: (last?.wakeSequence ?? 0) + 1,
    checksum: stableDisplayChecksum(
      [runtime.runId, runtime.stageId, gateId, status].join("|"),
    ),
    message:
      status === "WAITING"
        ? `${gateId} waiting for persisted human decision`
        : `${gateId} approved`,
    metadata: { gateId, status },
  });
}

export function projectTransformerRuntime(
  runtime: TransformerRuntime,
  options: ProjectTransformerRuntimeOptions,
): TransformerRuntimeProjection {
  if (runtime.gatePolicyId !== options.gatePolicy.id) {
    throw new Error(
      `Runtime gate policy ${runtime.gatePolicyId} does not match projection policy ${options.gatePolicy.id}`,
    );
  }

  const nodes = nodesForGatePolicy(options.gatePolicy);
  const boundaries = new Map(
    gateBoundariesForPolicy(options.gatePolicy).map((boundary) => [
      boundary.afterNodeId,
      boundary.gateId,
    ]),
  );
  const schedules = nodes.map((node) => {
    const schedule = buildTransformerNodeEventSchedule({
      runId: runtime.runId,
      stageId: runtime.stageId,
      nodeId: node.id,
      attempt: 1,
      timingProfile: runtime.timingProfile,
      runtimeProfileId: runtime.runtimeProfileId,
    });
    return {
      node,
      schedule,
      durationMs: schedule.at(-1)?.offsetMs ?? 0,
    };
  });
  const uninterruptedStageDurationMs = schedules.reduce(
    (sum, item) => sum + item.durationMs,
    0,
  );

  if (runtime.status === "CANCELLED") {
    return {
      status: "CANCELLED",
      completedNodeIds: [],
      events: [],
      stageProgressPercent: 0,
      routeProgress: {
        sealedStages: runtime.routeContext.sealedStageCount,
        totalStages: runtime.routeContext.stageCount,
      },
      effectiveElapsedMs: runtime.accumulatedElapsedMs,
      uninterruptedStageDurationMs,
    };
  }

  const events: TransformerEvent[] = [];
  const completedNodeIds: string[] = [];
  let executionElapsedMs = runtime.accumulatedElapsedMs;
  let wallCursorMs = runtime.startedAtMs;
  let currentNodeId: string | undefined;
  let activeGate: TransformerGateId | undefined;
  let status: TransformerRuntimeStatus = "RUNNING";

  for (const item of schedules) {
    const nodeStartExecutionMs = executionElapsedMs;
    const nodeWallEndMs = wallCursorMs + item.durationMs;

    if (options.nowMs < nodeWallEndMs) {
      const visibleThroughNodeMs = Math.max(0, options.nowMs - wallCursorMs);
      appendNodeEvents(
        events,
        item.schedule,
        nodeStartExecutionMs,
        visibleThroughNodeMs,
      );
      executionElapsedMs += visibleThroughNodeMs;
      currentNodeId = item.node.id;
      break;
    }

    appendNodeEvents(
      events,
      item.schedule,
      nodeStartExecutionMs,
      item.durationMs,
    );
    executionElapsedMs += item.durationMs;
    wallCursorMs = nodeWallEndMs;
    completedNodeIds.push(item.node.id);

    const gateId = boundaries.get(item.node.id);
    if (!gateId) {
      continue;
    }

    const decision = runtime.gateDecisions[gateId];
    if (!decision || decision.decision !== "APPROVE") {
      appendGateEvent(
        events,
        runtime,
        gateId,
        item.node.id,
        item.node.phaseId,
        executionElapsedMs,
        "WAITING",
      );
      activeGate = gateId;
      status = "WAITING_GATE";
      break;
    }

    const decisionAtMs = Number.isFinite(Date.parse(decision.decidedAt))
      ? Math.max(wallCursorMs, Date.parse(decision.decidedAt))
      : wallCursorMs;

    if (options.nowMs < decisionAtMs) {
      appendGateEvent(
        events,
        runtime,
        gateId,
        item.node.id,
        item.node.phaseId,
        executionElapsedMs,
        "WAITING",
      );
      activeGate = gateId;
      status = "WAITING_GATE";
      break;
    }

    appendGateEvent(
      events,
      runtime,
      gateId,
      item.node.id,
      item.node.phaseId,
      executionElapsedMs,
      "APPROVED",
    );
    wallCursorMs = decisionAtMs;
  }

  return {
    status,
    activeGate,
    currentNodeId,
    completedNodeIds,
    events,
    stageProgressPercent: progressFor(completedNodeIds, status),
    routeProgress: {
      sealedStages: runtime.routeContext.sealedStageCount,
      totalStages: runtime.routeContext.stageCount,
    },
    effectiveElapsedMs: executionElapsedMs,
    uninterruptedStageDurationMs,
  };
}
