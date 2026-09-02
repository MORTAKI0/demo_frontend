import type { AngularRunModel } from "../domain/run-types.ts";

function currentStageLabel(run: AngularRunModel): string {
  const stage = run.stageExecution;
  return stage
    ? `Angular ${stage.source} → ${stage.target}`
    : `Angular ${run.sourceMajor} → ${run.targetMajor}`;
}

export function answerAngularAssistant(
  run: AngularRunModel,
  question: string,
): string {
  const normalized = question.trim().toLowerCase();

  if (!normalized) {
    return "Ask about the current migration state, active gate, repair, evidence, route, or recovery options.";
  }

  if (/^(hi|hello|hey|bonjour|salut)\b/.test(normalized)) {
    return `Hello. ${run.name} is currently ${run.state.toLowerCase()} in ${run.phase.replaceAll("_", " ").toLowerCase()}. ${run.currentAction}.`;
  }

  if (
    normalized.includes("what is happening") ||
    normalized.includes("what's happening") ||
    normalized.includes("status") ||
    normalized.includes("current") ||
    normalized.includes("where are we")
  ) {
    const gate = run.currentGate ? ` The active gate is ${run.currentGate}.` : "";
    return `${run.name} is in ${run.phase.replaceAll("_", " ").toLowerCase()} for ${currentStageLabel(run)}. ${run.currentAction}.${gate}`;
  }

  if (normalized.includes("repair") || normalized.includes("causal")) {
    const attempts = run.stageExecution?.repairAttempts ?? [];
    if (attempts.length === 0) {
      return "No governed repair attempt is active for the current stage.";
    }

    const active =
      [...attempts]
        .reverse()
        .find((attempt) =>
          ["READY_FOR_G10", "APPLIED", "VALIDATED"].includes(attempt.status),
        ) ?? attempts.at(-1);

    const pieces = [
      `${attempts.length} repair attempts are recorded for ${currentStageLabel(run)}.`,
    ];

    const requestChangesParent = attempts.find(
      (attempt) => attempt.reviewerVerdict === "REQUEST_CHANGES",
    );
    if (requestChangesParent) {
      pieces.push(
        `Attempt ${requestChangesParent.attempt} was superseded after the Independent Reviewer requested changes.`,
      );
    }

    if (active?.failureOwner === "MAIN_REPAIR_LLM") {
      const target = active.changedFiles.join(", ") || "the bound source target";
      pieces.push(
        `Attempt ${active.attempt} is the active Main Repair LLM candidate targeting ${target}.`,
      );
      pieces.push(
        `The Repair Proposer authored the bounded ${active.operation ?? "repair"} candidate and the Independent Reviewer returned ${active.reviewerVerdict.toLowerCase()}.`,
      );
      pieces.push(
        `${run.currentGate ?? "The next governed gate"} must be approved by a human before deterministic apply and validation.`,
      );
    } else if (active) {
      pieces.push(
        `Attempt ${active.attempt} is owned by ${(active.failureOwner ?? "the deterministic repair owner").replaceAll("_", " ").toLowerCase()} and is governed by ${run.currentGate ?? "the next review gate"}.`,
      );
    }

    return pieces.join(" ");
  }

  if (normalized.includes("route") || normalized.includes("stage")) {
    const route = run.route
      .map((stage) => `${stage.source}→${stage.target} ${stage.status.toLowerCase()}`)
      .join(", ");
    return `The requested route is Angular ${run.sourceMajor} → ${run.targetMajor}: ${route}.`;
  }

  if (normalized.includes("evidence") || normalized.includes("proof")) {
    const latest = run.evidence.at(-1);
    return latest
      ? `${run.evidence.length} evidence records are attached to this run. The latest is “${latest.title}”: ${latest.summary}`
      : "No run evidence has been recorded yet.";
  }

  if (
    normalized.includes("rollback") ||
    normalized.includes("resume") ||
    normalized.includes("recover") ||
    normalized.includes("delivery")
  ) {
    const sealed = run.route.filter((stage) => stage.status === "SEALED").at(-1);
    if (!sealed) {
      return "No sealed stage exists yet, so rollback, resume-from-sealed, and partial delivery are not available. Restarting the active unsealed stage is the available recovery action.";
    }
    return `The furthest sealed checkpoint is Angular ${sealed.source} → ${sealed.target}. Recovery can prepare a partial delivery from that checkpoint, roll active work back to it, or resume the next adjacent stage from the same sealed authority.`;
  }

  if (normalized.includes("block") || normalized.includes("fail")) {
    if (run.state === "BLOCKED") {
      return `The run is blocked. ${run.currentAction}. Check Diagnostics and the latest failure evidence before choosing a governed recovery action.`;
    }
    if (run.stageExecution?.validation === "FAILED") {
      return `Validation failed for ${currentStageLabel(run)}, but the run is not terminally blocked. The repair workflow is active at ${run.currentGate ?? "the next governed gate"}.`;
    }
    return "There is no terminal blocker in the current state.";
  }

  return `For ${run.name}, the next governed action is: ${run.currentAction}. Current phase: ${run.phase.replaceAll("_", " ")}${run.currentGate ? `; gate: ${run.currentGate}` : ""}.`;
}
