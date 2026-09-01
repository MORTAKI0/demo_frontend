"use client";

import { useEffect, useMemo, useState } from "react";

import type { LiveExecution } from "@/domain/live-execution";
import { projectLiveExecution } from "@/domain/live-execution";
import { StatusBadge } from "@/components/ui/status-badge";

export function LiveExecutionPanel({
  execution,
  title,
  description,
}: {
  execution: LiveExecution<string>;
  title: string;
  description: string;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [execution.id]);

  const projection = useMemo(
    () => projectLiveExecution(execution, nowMs),
    [execution, nowMs],
  );

  const visibleLogs = projection.steps.flatMap((step) =>
    step.visibleLogs.map((line) => ({
      step: step.label,
      line,
      running: step.status === "RUNNING",
    })),
  );

  const elapsedSeconds = Math.max(
    0,
    Math.round(projection.elapsedMs / 100) / 10,
  );

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#2b3342] bg-[#0d1118] text-white shadow-xl"
      aria-live="polite"
      aria-label={title}
    >
      <div className="border-b border-white/10 px-5 py-5 lg:px-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#52d38a]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8f9bae]">
                Live execution
              </p>
              <StatusBadge label="RUNNING" />
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">
              {title}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#aeb8c8]">
              {description}
            </p>
          </div>
          <div className="min-w-[190px] rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">
              Progress
            </p>
            <p className="mt-1 text-lg font-semibold">
              {projection.progressPercent}%
            </p>
            <p className="mt-1 text-[11px] text-[#8f9bae]">
              {elapsedSeconds.toFixed(1)}s elapsed
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#5f7cff] transition-[width] duration-200"
            style={{ width: projection.progressPercent + "%" }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,.8fr)]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r lg:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">
            Execution graph
          </p>
          <div className="mt-4 space-y-2">
            {projection.steps.map((step, index) => (
              <div
                key={step.id}
                className={
                  "rounded-lg border px-3.5 py-3 transition-colors " +
                  (step.status === "RUNNING"
                    ? "border-[#6178db] bg-[#182033]"
                    : "border-white/10 bg-white/[0.025]")
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-[#71809a]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm font-semibold">{step.label}</p>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-[#7f8a9c]">
                      {step.node}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-[#9da9ba]">
                      {step.detail}
                    </p>
                  </div>
                  <StatusBadge label={step.status} />
                </div>

                {step.status === "RUNNING" &&
                (step.provider || step.command) ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.provider ? (
                      <RuntimeChip
                        label="Provider"
                        value={step.provider.replaceAll("_", " ")}
                      />
                    ) : null}
                    {step.deployment ? (
                      <RuntimeChip label="Model" value={step.deployment} />
                    ) : null}
                    {step.role ? (
                      <RuntimeChip
                        label="Role"
                        value={step.role.replaceAll("_", " ")}
                      />
                    ) : null}
                    {step.command ? (
                      <RuntimeChip label="Command" value={step.command} mono />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#090c12] p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7f8a9c]">
              Live logs
            </p>
            <span className="font-mono text-[10px] text-[#5f6c80]">
              {projection.activeStep?.node ?? "waiting"}
            </span>
          </div>
          <div className="mf-scrollbar mt-4 h-[330px] overflow-auto rounded-lg border border-white/10 bg-black/20 p-4 font-mono text-[11px] leading-5 text-[#b9c4d4]">
            {visibleLogs.length ? (
              visibleLogs.slice(-28).map((entry, index) => (
                <div
                  key={
                    entry.step +
                    ":" +
                    entry.line +
                    ":" +
                    String(index)
                  }
                  className={entry.running ? "text-[#e3e8f2]" : ""}
                >
                  <span className="mr-2 text-[#536079]">›</span>
                  {entry.line}
                </div>
              ))
            ) : (
              <div className="text-[#66738a]">
                Waiting for the first runtime event...
              </div>
            )}
            {projection.activeStep ? (
              <div className="mt-1 animate-pulse text-[#5f7cff]">▌</div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function RuntimeChip({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] text-[#aeb8c8]">
      <span className="text-[#708099]">{label}: </span>
      <span className={mono ? "font-mono" : "font-semibold"}>{value}</span>
    </span>
  );
}
