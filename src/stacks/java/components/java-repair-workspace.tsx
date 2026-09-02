"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/form-field";
import { GitDiffView } from "@/components/ui/git-diff-view";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { JavaJobModel } from "../domain/run-types";
import { answerJavaRepairAssistant } from "../workflow/assistant";

export function JavaRepairWorkspace({ job }: { job: JavaJobModel }) {
  const [question, setQuestion] = useState("What is happening?");
  const [answer, setAnswer] = useState(() =>
    answerJavaRepairAssistant(job, "What is happening?"),
  );

  if (job.repair.attempts.length === 0) return null;

  const currentStageAttempts = job.repair.attempts.filter(
    (attempt) => attempt.stage === job.currentStage,
  );

  function ask() {
    setAnswer(answerJavaRepairAssistant(job, question));
  }

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          eyebrow="Governed repair"
          title="Repair Proposer → Reviewer → repair_review"
          description={
            "Current Stage " +
            job.currentStage +
            " attempts: " +
            currentStageAttempts.length +
            " / " +
            job.repair.maxAttempts +
            ". Prior stage attempts remain visible after progression."
          }
        />
        <div className="mt-5 space-y-4">
          {job.repair.attempts.map((attempt) => (
            <article
              key={attempt.id}
              className="rounded-xl border border-[var(--mf-border)] bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--mf-text-soft)]">
                    Stage {attempt.stage} · Attempt {attempt.attempt}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">{attempt.proposerSummary}</h3>
                </div>
                <StatusBadge
                  label={attempt.status}
                  tone={
                    attempt.status === "VALIDATED"
                      ? "success"
                      : attempt.status === "REJECTED"
                        ? "danger"
                        : attempt.status === "SUPERSEDED"
                          ? "neutral"
                          : "info"
                  }
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Fact label="Diagnosis" value={attempt.diagnosis} />
                <Fact label="Reviewer" value={attempt.reviewerVerdict} />
                <Fact label="Checksum" value={attempt.checksum} mono />
              </div>
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">
                  {attempt.changedFiles.join(", ")}
                </p>
                <GitDiffView diff={attempt.diff} />
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow="Repair Assistant"
          title="Ask about the active repair"
          description="Answers use only the current Java repair state, reviewed attempt history, and attempt policy."
        />
        <div className="mt-5 rounded-lg border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4 text-sm leading-6 text-[var(--mf-text)]">
          {answer}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className={fieldClassName}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                ask();
              }
            }}
          />
          <Button onClick={ask}>Ask</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["What is happening?", "Show the diff scope", "How many attempts remain?"].map(
            (prompt) => (
              <button
                key={prompt}
                type="button"
                className="mf-focus rounded-md border border-[var(--mf-border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--mf-text-muted)] hover:text-[var(--mf-text)]"
                onClick={() => {
                  setQuestion(prompt);
                  setAnswer(answerJavaRepairAssistant(job, prompt));
                }}
              >
                {prompt}
              </button>
            ),
          )}
        </div>
      </Panel>
    </div>
  );
}

function Fact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md bg-[var(--mf-surface-subtle)] p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">
        {label}
      </p>
      <p
        className={
          "mt-1 break-words text-xs " +
          (mono ? "font-mono text-[10px]" : "font-semibold")
        }
      >
        {value}
      </p>
    </div>
  );
}
