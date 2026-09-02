import { liveExecutionDuration } from "../../../domain/live-execution.ts";
import type { AngularRunModel } from "../domain/run-types.ts";
import {
  completeAngularAnalysisExecution,
  completeAngularBaselineExecution,
  completeAngularFeasibilityExecution,
  completeAngularPlanningExecution,
  completeAngularStagePreparationExecution,
} from "./run.ts";
import {
  completeAngularApprovedStageExecution,
  completeAngularRepairReviewExecution,
  completeAngularRepairValidationExecution,
} from "./proven.ts";

export { liveExecutionDuration as angularLiveExecutionDuration };

export function advanceAngularLiveExecution(
  run: AngularRunModel,
  nowMs: number,
): AngularRunModel {
  const execution = run.liveExecution;
  if (!execution) return run;

  if (
    nowMs <
    execution.startedAtMs + liveExecutionDuration(execution)
  ) {
    return run;
  }

  const now = new Date(nowMs).toISOString();

  switch (execution.kind) {
    case "BASELINE":
      return completeAngularBaselineExecution(run, now);
    case "ANALYSIS":
      return completeAngularAnalysisExecution(run, now);
    case "FEASIBILITY":
      return completeAngularFeasibilityExecution(run, now);
    case "PLANNING":
      return completeAngularPlanningExecution(run, now);
    case "STAGE_PREPARATION":
      return completeAngularStagePreparationExecution(run);
    case "STAGE_EXECUTION":
      return completeAngularApprovedStageExecution(run, now);
    case "REPAIR_REVIEW":
      return completeAngularRepairReviewExecution(run, now);
    case "REPAIR_VALIDATION":
      return completeAngularRepairValidationExecution(run, now);
    default:
      throw new Error(
        "Unsupported Angular live execution: " + execution.kind,
      );
  }
}
