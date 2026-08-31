"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { textareaClassName } from "@/components/ui/form-field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  AngularGovernanceDecision,
  AngularPreTransformGateId,
  AngularRunModel,
} from "../domain/run-types";
import { getAllowedPreTransformDecisions } from "../workflow/run";

const LABELS: Record<AngularGovernanceDecision, string> = {
  APPROVE: "Approve",
  APPROVE_WITH_COMMENT: "Approve with comment",
  REQUEST_MODIFICATION: "Request modification",
  REJECT: "Reject",
};

export function AngularGateDecisionPanel({
  run,
  onDecision,
}: {
  run: AngularRunModel;
  onDecision: (gate: AngularPreTransformGateId, decision: AngularGovernanceDecision, comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  if (!run.currentGate || !["G02", "G03", "G04", "G05", "G06"].includes(run.currentGate)) return null;

  const gateId = run.currentGate as AngularPreTransformGateId;
  const gate = run.gates[gateId];
  const decisions = getAllowedPreTransformDecisions(gateId);

  return (
    <Panel className="border-[#c9d4f7]">
      <PanelHeader
        eyebrow="Action required"
        title={`${gate.id} · ${gate.label}`}
        description={`Decision is bound to revision #${gate.revision} and its current evidence checksum.`}
        action={<StatusBadge label={gate.status} />}
      />
      <p className="mt-4 truncate rounded-md bg-[var(--mf-surface-subtle)] px-3 py-2 font-mono text-[10px] text-[var(--mf-text-soft)]">
        {gate.checksum}
      </p>
      <textarea
        className={`${textareaClassName} mt-4`}
        placeholder="Review comment"
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
                : decision === "APPROVE"
                  ? "primary"
                  : "secondary"
            }
            disabled={decision === "APPROVE_WITH_COMMENT" && comment.trim().length === 0}
            onClick={() => onDecision(gateId, decision, comment)}
          >
            {LABELS[decision]}
          </Button>
        ))}
      </div>
    </Panel>
  );
}
