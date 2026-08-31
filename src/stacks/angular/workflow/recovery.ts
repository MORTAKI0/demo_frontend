import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import type {
  AngularCommandRecord,
  AngularPartialDelivery,
  AngularRollbackRecord,
  AngularRunModel,
} from "../domain/run-types.ts";
import { prepareProvenStage } from "./proven.ts";

function commandRecord(
  run: AngularRunModel,
  action: AngularCommandRecord["action"],
  command: string,
  timestamp: string,
  logs: string[],
): AngularCommandRecord {
  return {
    id: `${run.id}-${action.toLowerCase()}-${run.operations.commands.length + 1}`,
    action,
    command,
    authorization: "GOVERNED",
    status: "SUCCEEDED",
    exitCode: 0,
    logs,
    timestamp,
    checksum: stableDisplayChecksum(
      `${run.id}:${action}:${command}:${timestamp}:${run.operations.commands.length + 1}`,
    ),
  };
}

export function furthestSealedStage(run: AngularRunModel) {
  const sealed = run.route.filter((stage) => stage.status === "SEALED");
  return sealed.at(-1);
}

export function createAngularPartialDelivery(
  run: AngularRunModel,
  now = "2026-08-31T20:20:00+01:00",
): AngularRunModel {
  const sealed = furthestSealedStage(run);
  if (!sealed) {
    throw new Error("Partial delivery requires at least one sealed Angular stage.");
  }

  const delivery: AngularPartialDelivery = {
    id: `${run.id}-delivery-${run.operations.partialDeliveries.length + 1}`,
    stageId: sealed.id,
    source: sealed.source,
    target: sealed.target,
    artifactPath: `/deliveries/${run.id}/angular-${sealed.target}-sealed.zip`,
    timestamp: now,
    checksum: stableDisplayChecksum(
      `${run.id}:${sealed.id}:partial-delivery:${run.operations.partialDeliveries.length + 1}`,
    ),
  };
  const command = commandRecord(
    run,
    "PARTIAL_DELIVERY",
    `deliver --sealed-stage ${sealed.id}`,
    now,
    [
      `Selected furthest sealed checkpoint Angular ${sealed.source} → ${sealed.target}.`,
      `Artifact prepared at ${delivery.artifactPath}.`,
    ],
  );

  return {
    ...run,
    operations: {
      ...run.operations,
      partialDeliveries: [...run.operations.partialDeliveries, delivery],
      commands: [...run.operations.commands, command],
    },
    evidence: [
      ...run.evidence,
      {
        id: delivery.id,
        category: "COMMAND",
        title: `Partial delivery prepared from Angular ${sealed.target}`,
        summary: "Only the furthest valid sealed checkpoint was selected for delivery.",
        timestamp: now,
        checksum: delivery.checksum,
      },
    ],
  };
}

export function rollbackAngularToFurthestSealed(
  run: AngularRunModel,
  reason = "Operator requested rollback to the latest sealed checkpoint.",
  now = "2026-08-31T20:21:00+01:00",
): AngularRunModel {
  const sealed = furthestSealedStage(run);
  if (!sealed) {
    throw new Error("Rollback requires a previously sealed Angular stage.");
  }

  const sealedIndex = run.route.findIndex((stage) => stage.id === sealed.id);
  const activeStage = run.stageExecution;
  const rollback: AngularRollbackRecord = {
    id: `${run.id}-rollback-${run.operations.rollbacks.length + 1}`,
    fromStageId: activeStage?.stageId ?? null,
    toStageId: sealed.id,
    timestamp: now,
    reason,
    checksum: stableDisplayChecksum(
      `${run.id}:${activeStage?.stageId ?? "none"}:${sealed.id}:rollback:${run.operations.rollbacks.length + 1}`,
    ),
  };
  const command = commandRecord(
    run,
    "ROLLBACK",
    `rollback --to-sealed ${sealed.id}`,
    now,
    [
      `Verified sealed checkpoint Angular ${sealed.source} → ${sealed.target}.`,
      "Discarded only the active unsealed workspace.",
      "Immutable evidence and prior stage history were retained.",
    ],
  );

  return {
    ...run,
    state: "RUNNING",
    phase: "STAGE_PREPARATION",
    currentGate: null,
    currentAction: `Resume from sealed Angular ${sealed.target} checkpoint`,
    route: run.route.map((stage, index) =>
      index <= sealedIndex
        ? { ...stage, status: "SEALED" as const }
        : { ...stage, status: "PENDING" as const },
    ),
    stageExecution: undefined,
    operations: {
      ...run.operations,
      commands: [...run.operations.commands, command],
      rollbacks: [...run.operations.rollbacks, rollback],
      stageHistory: activeStage
        ? [...run.operations.stageHistory, activeStage]
        : run.operations.stageHistory,
    },
    evidence: [
      ...run.evidence,
      {
        id: rollback.id,
        category: "COMMAND",
        title: "Stage rollback completed",
        summary: `Active work was rolled back to the sealed Angular ${sealed.target} checkpoint without deleting prior evidence.`,
        timestamp: now,
        checksum: rollback.checksum,
      },
    ],
  };
}

export function resumeAngularFromSealed(
  run: AngularRunModel,
  now = "2026-08-31T20:22:00+01:00",
): AngularRunModel {
  if (run.stageExecution) {
    throw new Error("Resume from sealed is available only after the active stage has been cleared.");
  }
  const sealed = furthestSealedStage(run);
  if (!sealed) {
    throw new Error("Resume from sealed requires a sealed checkpoint.");
  }

  const command = commandRecord(
    run,
    "RESUME",
    `resume --from-sealed ${sealed.id}`,
    now,
    [
      `Bound resume authority to Angular ${sealed.target} sealed checkpoint.`,
      "Next adjacent stage will be materialized from sealed output.",
    ],
  );

  return prepareProvenStage({
    ...run,
    operations: {
      ...run.operations,
      commands: [...run.operations.commands, command],
    },
    evidence: [
      ...run.evidence,
      {
        id: command.id,
        category: "COMMAND",
        title: "Resume from sealed checkpoint",
        summary: `Restart authority was bound to the Angular ${sealed.target} sealed checkpoint.`,
        timestamp: now,
        checksum: command.checksum,
      },
    ],
  });
}

export function restartAngularActiveStage(
  run: AngularRunModel,
  now = "2026-08-31T20:23:00+01:00",
): AngularRunModel {
  const active = run.stageExecution;
  if (!active || active.status === "SEALED") {
    throw new Error("There is no active unsealed Angular stage to restart.");
  }

  const command = commandRecord(
    run,
    "RESTART",
    `restart-stage ${active.stageId}`,
    now,
    [
      `Archived active Angular ${active.source} → ${active.target} execution state.`,
      "Restarted from the same sealed predecessor and immutable source authority.",
    ],
  );

  const reset: AngularRunModel = {
    ...run,
    phase: "STAGE_PREPARATION",
    currentGate: null,
    currentAction: `Restart Angular ${active.source} → ${active.target}`,
    route: run.route.map((stage) =>
      stage.id === active.stageId ? { ...stage, status: "PENDING" as const } : stage,
    ),
    stageExecution: undefined,
    operations: {
      ...run.operations,
      commands: [...run.operations.commands, command],
      stageHistory: [...run.operations.stageHistory, active],
    },
    evidence: [
      ...run.evidence,
      {
        id: command.id,
        category: "COMMAND",
        title: `Angular ${active.source} → ${active.target} restart requested`,
        summary: "The unsealed workspace was archived and the same adjacent stage was rematerialized.",
        timestamp: now,
        checksum: command.checksum,
      },
    ],
  };

  return prepareProvenStage(reset);
}
