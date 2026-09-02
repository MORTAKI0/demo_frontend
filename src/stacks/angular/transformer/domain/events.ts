export const TRANSFORMER_EVENT_KINDS = [
  "WORKER",
  "STATE",
  "COMMAND_AUTHORIZATION",
  "COMMAND_STATUS",
  "STDOUT",
  "STDERR",
  "ARTIFACT",
  "FINGERPRINT",
  "CHECKPOINT",
  "VERSION_PROOF",
  "DEPENDENCY",
  "MIGRATION_LEDGER",
  "VALIDATION",
  "DIAGNOSTIC",
  "GATE",
  "REPAIR",
  "LLM",
  "REVIEWER",
  "PROMOTION",
  "SEAL",
] as const;

export type TransformerEventKind = (typeof TRANSFORMER_EVENT_KINDS)[number];

export const TRANSFORMER_COMMAND_STATUSES = [
  "QUEUED",
  "AUTHORIZED",
  "CLAIMED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "TIMED_OUT",
  "CANCELLED",
  "INTERRUPTED",
] as const;

export type TransformerCommandStatus =
  (typeof TRANSFORMER_COMMAND_STATUSES)[number];

export interface TransformerEvent {
  sequence: number;
  offsetMs: number;
  kind: TransformerEventKind;
  phaseId: string;
  nodeId: string;
  stateVersion: number;
  wakeSequence: number;
  executionId?: string;
  commandId?: string;
  artifactId?: string;
  checksum?: string;
  message?: string;
  metadata?: Record<string, string | number | boolean | null>;
}
