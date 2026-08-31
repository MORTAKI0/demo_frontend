import { stableDisplayChecksum } from "../../../scenarios/runtime/checksum.ts";
import type {
  JavaGateAssistantPreview,
  JavaGateDecision,
  JavaJobModel,
  JavaPhaseGate,
} from "../domain/run-types.ts";
import type { JavaProfileId } from "../domain/types.ts";
import { getJavaGateDecisions } from "./cockpit.ts";

function activeGate(job: JavaJobModel): JavaPhaseGate {
  if (!job.currentGate) {
    throw new Error("No Java PhaseGate is active.");
  }
  const gate = job.phaseGates
    .toReversed()
    .find(
      (candidate) =>
        candidate.type === job.currentGate && candidate.status === "PENDING",
    );
  if (!gate) {
    throw new Error("Active Java PhaseGate state is unavailable.");
  }
  return gate;
}

export function explainJavaGate(job: JavaJobModel): string {
  const gate = activeGate(job);
  const decisions = getJavaGateDecisions(gate.type)
    .map((decision) => decision.replaceAll("_", " ").toLowerCase())
    .join(", ");
  return (
    gate.type.replaceAll("_", " ") +
    " is active for Java Stage " +
    gate.stage +
    ", revision #" +
    gate.revision +
    ". Available decisions: " +
    decisions +
    ". The decision must remain bound to checksum " +
    gate.checksum +
    "."
  );
}

export function previewJavaGateAction(
  job: JavaJobModel,
  decision: JavaGateDecision,
  options: {
    comment?: string;
    overrideSourceProfile?: JavaProfileId;
  } = {},
): JavaGateAssistantPreview {
  const gate = activeGate(job);
  if (!getJavaGateDecisions(gate.type).includes(decision)) {
    throw new Error(decision + " is not valid for " + gate.type + ".");
  }
  if (decision === "OVERRIDE_SOURCE_PROFILE" && !options.overrideSourceProfile) {
    throw new Error("Override Source Profile preview requires a source profile.");
  }

  const comment = options.comment?.trim() || undefined;
  const actionChecksum = stableDisplayChecksum(
    [
      gate.id,
      gate.revision,
      gate.checksum,
      decision,
      comment ?? "",
      options.overrideSourceProfile ?? "",
    ].join("|"),
  );

  return {
    gateId: gate.id,
    gateType: gate.type,
    gateRevision: gate.revision,
    gateChecksum: gate.checksum,
    decision,
    comment,
    overrideSourceProfile: options.overrideSourceProfile,
    actionChecksum,
  };
}

export function confirmJavaGatePreview(
  job: JavaJobModel,
  preview: JavaGateAssistantPreview,
): JavaGateAssistantPreview {
  const gate = activeGate(job);
  if (
    gate.id !== preview.gateId ||
    gate.type !== preview.gateType ||
    gate.revision !== preview.gateRevision ||
    gate.checksum !== preview.gateChecksum
  ) {
    throw new Error(
      "Gate Assistant preview is stale because the gate revision or checksum changed.",
    );
  }

  const expected = previewJavaGateAction(job, preview.decision, {
    comment: preview.comment,
    overrideSourceProfile: preview.overrideSourceProfile,
  });

  if (expected.actionChecksum !== preview.actionChecksum) {
    throw new Error("Gate Assistant action checksum no longer matches the preview.");
  }

  return preview;
}

export function answerJavaRepairAssistant(
  job: JavaJobModel,
  question: string,
): string {
  const normalized = question.trim().toLowerCase();
  const stageAttempts = job.repair.attempts.filter(
    (attempt) => attempt.stage === job.currentStage,
  );
  const latest = stageAttempts.at(-1);

  if (!latest) {
    return "No Java repair attempt is active. Repair Assistant becomes relevant after build or test validation creates failure evidence.";
  }

  if (
    normalized.includes("what") ||
    normalized.includes("status") ||
    normalized.includes("happening")
  ) {
    return (
      "Repair attempt " +
      latest.attempt +
      " is " +
      latest.status.toLowerCase().replaceAll("_", " ") +
      ". Diagnosis: " +
      latest.diagnosis +
      " Reviewer verdict: " +
      latest.reviewerVerdict.toLowerCase() +
      "."
    );
  }

  if (normalized.includes("diff") || normalized.includes("change")) {
    return (
      "The reviewed repair changes " +
      latest.changedFiles.join(", ") +
      ". It is limited to the failing source surface and must pass Maven build/test revalidation after repair_review approval."
    );
  }

  if (normalized.includes("attempt") || normalized.includes("limit")) {
    return (
      stageAttempts.length +
      " of " +
      job.repair.maxAttempts +
      " governed repair attempts have been used for Java Stage " +
      job.currentStage +
      ". Prior stage attempts remain in the immutable repair history."
    );
  }

  return (
    "Repair Assistant is grounded in attempt " +
    latest.attempt +
    ". The next governed action is: " +
    job.currentAction +
    "."
  );
}
