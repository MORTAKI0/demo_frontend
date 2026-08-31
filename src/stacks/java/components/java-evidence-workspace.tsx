"use client";

import { useState } from "react";

import { Panel, PanelHeader } from "@/components/ui/panel";
import type { JavaEvidenceRecord, JavaJobModel } from "../domain/run-types";

const FILTERS = [
  "ALL",
  "CONFIGURATION",
  "ANALYSIS",
  "PLANNING",
  "ASSESSMENT",
  "DECISION",
  "TRANSFORM",
  "BUILD",
  "TEST",
  "STAGE",
] as const;

type Filter = (typeof FILTERS)[number];

export function JavaEvidenceWorkspace({ job }: { job: JavaJobModel }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const visible =
    filter === "ALL"
      ? job.evidence
      : job.evidence.filter((item) => item.category === filter);

  return (
    <Panel>
      <PanelHeader
        eyebrow="Evidence"
        title="Java execution ledger"
        description="Analysis, plan revisions, assessment, decisions, transformation proof, build/test results, and stage progression remain append-only."
      />
      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={
              "mf-focus rounded-md border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.05em] " +
              (filter === item
                ? "border-[var(--mf-primary)] bg-[var(--mf-primary-soft)] text-[var(--mf-primary)]"
                : "border-[var(--mf-border)] bg-white text-[var(--mf-text-muted)]")
            }
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-[var(--mf-border)]">
        {visible.map((item) => (
          <JavaEvidenceRow key={item.id} item={item} />
        ))}
        {visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--mf-text-muted)]">
            No evidence in this category yet.
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function JavaEvidenceRow({ item }: { item: JavaEvidenceRecord }) {
  return (
    <article className="border-b border-[var(--mf-border)] p-4 last:border-b-0">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)]">
            {item.category}
          </p>
          <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--mf-text-muted)]">{item.summary}</p>
        </div>
        <span className="shrink-0 text-[11px] text-[var(--mf-text-soft)]">{item.timestamp}</span>
      </div>
      <p className="mt-3 truncate font-mono text-[10px] text-[var(--mf-text-soft)]">{item.checksum}</p>
    </article>
  );
}
