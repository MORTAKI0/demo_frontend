"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mf-page">
      <main className="mf-container py-16">
        <section
          className="mx-auto max-w-2xl rounded-2xl border border-[#efc1c1] bg-white p-7 shadow-[var(--mf-shadow)]"
          role="alert"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--mf-danger)]">
            Migration Factory
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
            This workspace could not be rendered
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--mf-text-muted)]">
            {error.message || "An unexpected workspace error occurred."}
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-[10px] text-[var(--mf-text-soft)]">
              Reference: {error.digest}
            </p>
          ) : null}
          <Button className="mt-6" onClick={reset}>
            Retry workspace
          </Button>
        </section>
      </main>
    </div>
  );
}
