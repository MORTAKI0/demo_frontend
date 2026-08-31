export default function Loading() {
  return (
    <div className="mf-page">
      <main className="mf-container py-10" aria-live="polite" aria-busy="true">
        <div className="animate-pulse space-y-5">
          <div className="h-4 w-40 rounded bg-[var(--mf-border)]" />
          <div className="h-10 w-96 max-w-full rounded bg-[var(--mf-border)]" />
          <div className="h-36 rounded-2xl bg-[var(--mf-border)]" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-52 rounded-xl bg-[var(--mf-border)]" />
            <div className="h-52 rounded-xl bg-[var(--mf-border)]" />
          </div>
        </div>
      </main>
    </div>
  );
}
