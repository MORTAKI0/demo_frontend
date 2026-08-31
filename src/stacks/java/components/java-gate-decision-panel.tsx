"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { fieldClassName, textareaClassName } from "@/components/ui/form-field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { JAVA_PROFILES, type JavaProfileId } from "../domain/types";
import type {
  JavaGateDecision,
  JavaJobModel,
  JavaPhaseGateType,
} from "../domain/run-types";
import { getJavaGateDecisions } from "../workflow/cockpit";

const LABELS: Record<JavaGateDecision, string> = {
  CONTINUE: "Continue",
  REANALYZE: "Reanalyze",
  OVERRIDE_SOURCE_PROFILE: "Override Source Profile",
  REVISE: "Revise",
  APPROVE: "Approve",
  REJECT: "Reject",
};

export function JavaGateDecisionPanel({
  job,
  onDecision,
}: {
  job: JavaJobModel;
  onDecision: (
    type: JavaPhaseGateType,
    decision: JavaGateDecision,
    options: { comment?: string; overrideSourceProfile?: JavaProfileId },
  ) => void;
}) {
  const [comment, setComment] = useState("");
  const [overrideSourceProfile, setOverrideSourceProfile] =
    useState<JavaProfileId>(job.configuration.sourceProfile);

  const gate = useMemo(
    () =>
      job.currentGate
        ? job.phaseGates.find(
            (candidate) =>
              candidate.type === job.currentGate && candidate.status === "PENDING",
          )
        : null,
    [job.currentGate, job.phaseGates],
  );

  if (!gate || !job.currentGate) return null;

  const decisions = getJavaGateDecisions(job.currentGate);
  const targetIndex = JAVA_PROFILES.findIndex(
    (profile) => profile.id === job.configuration.targetProfile,
  );
  const overrideOptions = JAVA_PROFILES.slice(0, targetIndex);

  return (
    <Panel className="border-[#c9d4f7]">
      <PanelHeader
        eyebrow="Action required"
        title={gate.type.replaceAll("_", " ")}
        description={
          "Java Stage " +
          gate.stage +
          " · revision #" +
          gate.revision +
          " · only this gate's original decision set is available."
        }
        action={<StatusBadge label={gate.status} />}
      />
      <p className="mt-4 truncate rounded-md bg-[var(--mf-surface-subtle)] px-3 py-2 font-mono text-[10px] text-[var(--mf-text-soft)]">
        {gate.checksum}
      </p>

      {job.currentGate === "analysis_review" &&
      decisions.includes("OVERRIDE_SOURCE_PROFILE") ? (
        <div className="mt-4">
          <label className="text-xs font-semibold text-[var(--mf-text-muted)]">
            Source profile override
          </label>
          <select
            className={fieldClassName + " mt-2"}
            value={overrideSourceProfile}
            onChange={(event) =>
              setOverrideSourceProfile(event.target.value as JavaProfileId)
            }
          >
            {overrideOptions.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <textarea
        className={textareaClassName + " mt-4"}
        placeholder="Optional review comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {decisions.map((decision) => (
          <Button
            key={decision}
            variant={
              decision === "REJECT"
                ? "danger"
                : decision === "CONTINUE" || decision === "APPROVE"
                  ? "primary"
                  : "secondary"
            }
            onClick={() =>
              onDecision(job.currentGate!, decision, {
                comment,
                overrideSourceProfile:
                  decision === "OVERRIDE_SOURCE_PROFILE"
                    ? overrideSourceProfile
                    : undefined,
              })
            }
          >
            {LABELS[decision]}
          </Button>
        ))}
      </div>
    </Panel>
  );
}
