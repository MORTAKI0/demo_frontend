"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/form-field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { AngularRunModel } from "../domain/run-types";
import { answerAngularAssistant } from "../workflow/assistant";

interface AssistantMessage {
  role: "assistant" | "user";
  text: string;
}

export function AngularAssistantPanel({ run }: { run: AngularRunModel }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      text: answerAngularAssistant(run, "status"),
    },
  ]);

  function submit() {
    const trimmed = question.trim();
    if (!trimmed) return;
    const answer = answerAngularAssistant(run, trimmed);
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: answer },
    ]);
    setQuestion("");
  }

  return (
    <Panel className="lg:col-span-2">
      <PanelHeader
        eyebrow="Migration Assistant"
        title="Ask about the current run"
        description="Answers are grounded in the current Angular workflow state, evidence, route, gates, repair attempts, and recovery authority."
      />
      <div className="mt-5 max-h-80 space-y-3 overflow-y-auto rounded-xl border border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[88%] rounded-lg px-3.5 py-3 text-sm leading-6 ${
              message.role === "assistant"
                ? "bg-white text-[var(--mf-text)] shadow-sm"
                : "ml-auto bg-[var(--mf-primary)] text-white"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className={fieldClassName}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Ask what is happening, why repair is active, or what can be recovered"
        />
        <Button onClick={submit}>Ask</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["What is happening?", "Explain the repair", "What can I recover?", "Show route status"].map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="mf-focus rounded-md border border-[var(--mf-border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--mf-text-muted)] hover:text-[var(--mf-text)]"
            onClick={() => {
              const answer = answerAngularAssistant(run, prompt);
              setMessages((current) => [
                ...current,
                { role: "user", text: prompt },
                { role: "assistant", text: answer },
              ]);
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </Panel>
  );
}
