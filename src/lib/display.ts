export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

const SUCCESS = new Set([
  "PASS",
  "PASSED",
  "COMPLETED",
  "APPROVED",
  "SEALED",
  "READY",
  "QUALIFIED",
  "VERIFIED",
  "ACCEPTED",
  "VALIDATED",
  "SUCCEEDED",
  "CERTIFIED",
  "PASS",
]);

const WARNING = new Set([
  "WARNING",
  "PASSED_WITH_WARNINGS",
  "ACTION_REQUIRED",
  "WAITING",
  "PAUSED",
  "STALE",
  "READY_FOR_G10",
  "READY_FOR_REVIEW",
  "WAITING_COMPLETION",
]);

const DANGER = new Set([
  "FAIL",
  "FAILED",
  "BLOCKED",
  "REJECTED",
  "CANCELLED",
  "ERROR",
  "RECOVERY_REQUIRED",
  "REJECTED_BY_CAUSAL_POLICY",
]);

const INFO = new Set([
  "RUNNING",
  "STARTING",
  "QUEUED",
  "IN_PROGRESS",
  "RESUMING",
  "CANCELLING",
]);

export function toneForStatus(status: string): StatusTone {
  const normalized = status.trim().toUpperCase().replaceAll(" ", "_");

  if (SUCCESS.has(normalized)) return "success";
  if (WARNING.has(normalized)) return "warning";
  if (DANGER.has(normalized)) return "danger";
  if (INFO.has(normalized)) return "info";
  return "neutral";
}

export function humanizeIdentifier(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "—";
  const seconds = Math.floor(totalSeconds);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
  const hours = Math.floor(minutes / 60);
  const minuteRemainder = minutes % 60;
  return minuteRemainder === 0 ? `${hours}h` : `${hours}h ${minuteRemainder}m`;
}
