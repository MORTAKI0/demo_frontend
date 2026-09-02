import { stableDisplayChecksum } from "../../../../scenarios/runtime/checksum.ts";
import {
  PROVEN_NODE_CATALOGUE,
} from "../data/node-catalogue.ts";
import {
  TRANSFORMER_COMMANDS_BY_ID,
  type TransformerCommandDefinition,
} from "../data/command-catalogue.ts";
import type { TransformerEvent } from "../domain/events.ts";
import {
  deterministicDurationMs,
  type TransformerTimingOperation,
  type TransformerTimingSeed,
} from "../domain/timing.ts";
import { deterministicTransformerId } from "./identity.ts";

export interface TransformerNodeScheduleInput extends TransformerTimingSeed {
  runtimeProfileId: string;
}

function timingOperationForNode(
  nodeId: string,
  command?: TransformerCommandDefinition,
): TransformerTimingOperation {
  switch (nodeId) {
    case "select_run_mode":
      return "STAGE_BINDING";
    case "source_install_same_authority":
      return "SOURCE_INSTALL";
    case "source_tree":
      return "CONTROL_PLANE";
    case "source_version_proof":
      return "SOURCE_PROOF";
    case "source_build":
      return "SOURCE_BUILD";
    case "source_test":
      return "SOURCE_TEST";
    case "prepare_discovery_toolchain":
    case "prove_discovery_cli_authority":
    case "assess_discovery":
      return "CONTROL_PLANE";
    case "run_discovery":
      return "DISCOVERY";
    case "lock_resolution":
      return "LOCK_GENERATION";
    case "target_install_same_authority":
      return "TARGET_INSTALL";
    case "target_tree":
      return "CONTROL_PLANE";
    case "target_version_proof":
      return "TARGET_PROOF";
    case "execute_migration_owner":
      return "MIGRATION_OWNER";
    case "validation_install":
      return "VALIDATION_INSTALL";
    case "validation_tree":
    case "validation_version_proof":
      return "CONTROL_PLANE";
    case "validation_build":
      return "VALIDATION_BUILD";
    case "validation_test":
      return "VALIDATION_TEST";
    case "diagnostic_delta":
      return "CONTROL_PLANE";
    case "aggregate_proven_validation":
      return "DIAGNOSTIC_AGGREGATION";
    case "promotion_pending":
    case "promote_validated":
      return "POST_VALIDATION_SEAL";
    default:
      return command?.timingOperation ?? "CONTROL_PLANE";
  }
}

function at(durationMs: number, fraction: number): number {
  return Math.max(0, Math.min(durationMs, Math.round(durationMs * fraction)));
}

export function buildTransformerNodeEventSchedule(
  input: TransformerNodeScheduleInput,
): TransformerEvent[] {
  const node = PROVEN_NODE_CATALOGUE.find((entry) => entry.id === input.nodeId);
  if (!node) {
    throw new Error(`Unknown PROVEN Transformer node: ${input.nodeId}`);
  }

  const command = node.commandId
    ? TRANSFORMER_COMMANDS_BY_ID.get(node.commandId)
    : undefined;
  if (node.commandId && !command) {
    throw new Error(`Missing command definition: ${node.commandId}`);
  }

  const operation = timingOperationForNode(node.id, command);
  const durationMs = deterministicDurationMs(input, operation);
  const executionId = deterministicTransformerId("execution", input);
  let sequence = 0;
  let stateVersion = 0;
  let wakeSequence = 0;

  const emit = (
    offsetMs: number,
    kind: TransformerEvent["kind"],
    details: Omit<
      Partial<TransformerEvent>,
      "sequence" | "offsetMs" | "kind" | "phaseId" | "nodeId" | "stateVersion" | "wakeSequence"
    > = {},
  ): TransformerEvent => ({
    sequence: ++sequence,
    offsetMs,
    kind,
    phaseId: node.phaseId,
    nodeId: node.id,
    stateVersion: ++stateVersion,
    wakeSequence: ++wakeSequence,
    executionId,
    ...details,
  });

  if (!command) {
    return [
      emit(0, "WORKER", {
        message: "Worker claimed Transformer node",
        metadata: { runtimeProfileId: input.runtimeProfileId },
      }),
      emit(at(durationMs, 0.2), "STATE", {
        message: `${node.label} running`,
      }),
      emit(at(durationMs, 0.72), "ARTIFACT", {
        artifactId: deterministicTransformerId("artifact", input, node.id),
        checksum: stableDisplayChecksum(
          [input.runId, input.stageId, node.id, "artifact"].join("|"),
        ),
        message: `${node.label} evidence finalized`,
      }),
      emit(durationMs, "STATE", {
        message: `${node.label} completed`,
        metadata: { status: "SUCCEEDED" },
      }),
    ];
  }

  const workspaceAlias = command.workspaceAliasClass.toLowerCase();
  const authorizationChecksum = stableDisplayChecksum(
    [
      input.runId,
      input.stageId,
      input.nodeId,
      command.commandId,
      command.templateId,
      workspaceAlias,
      input.runtimeProfileId,
      command.networkPolicy,
      String(command.timeoutMs),
      "shell=false",
    ].join("|"),
  );

  return [
    emit(0, "WORKER", {
      commandId: command.commandId,
      message: "Command worker available",
      metadata: { runtimeProfileId: input.runtimeProfileId },
    }),
    emit(at(durationMs, 0.03), "STATE", {
      commandId: command.commandId,
      message: "Execution queued for authorization",
    }),
    emit(at(durationMs, 0.07), "COMMAND_STATUS", {
      commandId: command.commandId,
      metadata: { status: "QUEUED" },
    }),
    emit(at(durationMs, 0.1), "COMMAND_AUTHORIZATION", {
      commandId: command.commandId,
      checksum: authorizationChecksum,
      metadata: {
        shell: false,
        templateId: command.templateId,
        workspaceAlias,
        runtimeProfileId: input.runtimeProfileId,
        networkPolicy: command.networkPolicy,
        timeoutMs: command.timeoutMs,
      },
    }),
    emit(at(durationMs, 0.13), "COMMAND_STATUS", {
      commandId: command.commandId,
      metadata: { status: "AUTHORIZED" },
    }),
    emit(at(durationMs, 0.17), "COMMAND_STATUS", {
      commandId: command.commandId,
      metadata: { status: "CLAIMED" },
    }),
    emit(at(durationMs, 0.22), "COMMAND_STATUS", {
      commandId: command.commandId,
      metadata: { status: "RUNNING" },
    }),
    emit(at(durationMs, 0.41), "STDOUT", {
      commandId: command.commandId,
      message: `${command.label}: execution started`,
    }),
    emit(at(durationMs, 0.69), "STDOUT", {
      commandId: command.commandId,
      message: `${command.label}: governed operation active`,
    }),
    emit(at(durationMs, 0.86), "ARTIFACT", {
      commandId: command.commandId,
      artifactId: deterministicTransformerId(
        "artifact",
        input,
        command.commandId,
      ),
      checksum: stableDisplayChecksum(
        [executionId, command.commandId, "result-artifact"].join("|"),
      ),
      message: `${command.label}: result evidence finalized`,
    }),
    emit(durationMs, "COMMAND_STATUS", {
      commandId: command.commandId,
      checksum: stableDisplayChecksum(
        [executionId, command.commandId, "SUCCEEDED"].join("|"),
      ),
      metadata: { status: "SUCCEEDED", exitCode: 0 },
    }),
  ];
}
