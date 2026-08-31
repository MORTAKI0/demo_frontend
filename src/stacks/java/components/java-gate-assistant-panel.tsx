"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { fieldClassName, textareaClassName } from "@/components/ui/form-field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type {
  JavaGateAssistantPreview,
  JavaGateDecision,
  JavaJobModel,
} from "../domain/run-types";
import { JAVA_PROFILES, type JavaProfileId } from "../domain/types";
import {
  confirmJavaGatePreview,
  explainJavaGate,
  previewJavaGateAction,
} from "../workflow/assistant";
import { getJavaGateDecisions } from "../workflow/cockpit";

export function JavaGateAssistantPanel({
  job,
  onConfirm,
}: {
  job: JavaJobModel;
  onConfirm: (preview: JavaGateAssistantPreview) => void;
}) {
  const decisions = useMemo(
    () => (job.currentGate ? getJavaGateDecisions(job.currentGate) : []),
    [job.currentGate],
  );
  const [decision, setDecision] = useState<JavaGateDecision>("CONTINUE");
  const [comment, setComment] = useState("");
  const [overrideSourceProfile, setOverrideSourceProfile] =
    useState<JavaProfileId>(job.configuration.sourceProfile);
  const [preview, setPreview] = useState<JavaGateAssistantPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeGate = job.currentGate
    ? job.phaseGates
        .toReversed()
        .find(
          (gate) =>
            gate.type === job.currentGate && gate.status === "PENDING",
        )
    : null;

  if (!job.currentGate || !activeGate) return null;

  const effectiveDecision = decisions.includes(decision)
    ? decision
    : decisions[0] ?? "CONTINUE";

  const targetIndex = JAVA_PROFILES.findIndex(
    (profile) => profile.id === job.configuration.targetProfile,
  );
  const overrideOptions = JAVA_PROFILES.slice(0, targetIndex);

  function createPreview() {
    try {
      setError(null);
      setPreview(
        previewJavaGateAction(job, effectiveDecision, {
          comment,
          overrideSourceProfile:
            effectiveDecision === "OVERRIDE_SOURCE_PROFILE"
              ? overrideSourceProfile
              : undefined,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to preview Gate Assistant action.");
    }
  }

  function confirm() {
    if (!preview) return;
    try {
      setError(null);
      const confirmed = confirmJavaGatePreview(job, preview);
      onConfirm(confirmed);
      setPreview(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to confirm Gate Assistant action.");
    }
  }

  return (
    <Panel>
      <PanelHeader
        eyebrow="Gate Assistant"
        title="Explain → preview → confirm"
        description={explainJavaGate(job)}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-xs font-semibold text-[var(--mf-text-muted)]">Exact action</span>
          <select
            className={fieldClassName + " mt-2"}
            value={effectiveDecision}
            onChange={(event) => {
              setDecision(event.target.value as JavaGateDecision);
              setPreview(null);
            }}
          >
            {decisions.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        {effectiveDecision === "OVERRIDE_SOURCE_PROFILE" ? (
          <label>
            <span className="text-xs font-semibold text-[var(--mf-text-muted)]">
              Source profile override
            </span>
            <select
              className={fieldClassName + " mt-2"}
              value={overrideSourceProfile}
              onChange={(event) => {
                setOverrideSourceProfile(event.target.value as JavaProfileId);
                setPreview(null);
              }}
            >
              {overrideOptions.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <textarea
        className={textareaClassName + " mt-4"}
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
          setPreview(null);
        }}
        placeholder="Optional action comment"
      />

      <Button variant="secondary" className="mt-4" onClick={createPreview}>
        Preview exact action
      </Button>

      {preview && preview.gateId === activeGate.id ? (
        <div className="mt-5 rounded-xl border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
          <p className="text-xs font-semibold">
            {preview.decision.replaceAll("_", " ")} · {preview.gateType.replaceAll("_", " ")}
          </p>
          <dl className="mt-3 grid gap-2 text-[11px] text-[var(--mf-text-muted)]">
            <div>
              <dt className="font-semibold">Gate checksum</dt>
              <dd className="mt-1 break-all font-mono">{preview.gateChecksum}</dd>
            </div>
            <div>
              <dt className="font-semibold">Action checksum</dt>
              <dd className="mt-1 break-all font-mono">{preview.actionChecksum}</dd>
            </div>
          </dl>
          <Button className="mt-4" onClick={confirm}>
            Confirm previewed action
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-[#efc1c1] bg-[var(--mf-danger-soft)] p-3 text-xs text-[var(--mf-danger)]">
          {error}
        </div>
      ) : null}
    </Panel>
  );
}
