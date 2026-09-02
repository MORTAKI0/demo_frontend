"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { textareaClassName } from "@/components/ui/form-field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AngularRunModel, AngularStageGateDecision, AngularStageGateId } from "../domain/run-types";
import { getAllowedStageDecisions } from "../workflow/proven";

export function AngularStageDecisionPanel({
  run,
  onDecision,
}: {
  run: AngularRunModel;
  onDecision: (gate: AngularStageGateId, decision: AngularStageGateDecision, comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const stage = run.stageExecution;
  if (!stage || !run.currentGate || !["G07","G09","G10","G11","G12"].includes(run.currentGate)) return null;
  const gateId = run.currentGate as AngularStageGateId;
  const gate = stage.gates[gateId];

  return (
    <Panel className="border-[#c9d4f7]">
      <PanelHeader
        eyebrow="Governed decision"
        title={`${gate.id} · ${gate.label}`}
        description={`Angular ${stage.source} → ${stage.target} · decision bound to the current stage evidence checksum.`}
        action={<StatusBadge label={gate.status} />}
      />
      <p className="mt-4 truncate rounded-md bg-[var(--mf-surface-subtle)] px-3 py-2 font-mono text-[10px] text-[var(--mf-text-soft)]">
        {formatChecksum(gate.checksum)}
      </p>
      <textarea
        className={`${textareaClassName} mt-4`}
        placeholder="Optional review comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {getAllowedStageDecisions(gateId).map((decision) => (
          <Button
            key={decision}
            variant={decision === "REJECT" ? "danger" : decision === "APPROVE" ? "primary" : "secondary"}
            onClick={() => onDecision(gateId, decision, comment)}
          >
            {decision === "REQUEST_MODIFICATION" ? "Request modification" : decision === "APPROVE" ? "Approve" : "Reject"}
          </Button>
        ))}
      </div>
    </Panel>
  );
}

function formatChecksum(checksum: string): string {
  return checksum.length > 24
    ? `${checksum.slice(0, 12)}…${checksum.slice(-8)}`
    : checksum;
}
