import Link from "next/link";

import { ProductHeader } from "@/components/shared/product-header";
import { TechnologyCard } from "@/components/shared/technology-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { recentMigrations } from "@/data/recent-migrations";

function AngularIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7">
      <path
        d="M16 3 27 7l-2 17-9 5-9-5L5 7l11-4Z"
        fill="#db2b3c"
        opacity=".12"
      />
      <path
        d="M16 5.2 24.6 8l-1.7 14.5-6.9 3.9-6.9-3.9L7.4 8 16 5.2Z"
        fill="none"
        stroke="#b51f32"
        strokeWidth="1.6"
      />
      <path
        d="m11.9 21.2 4.1-10 4.1 10M13.4 17.6h5.2"
        stroke="#b51f32"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JavaIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7">
      <path
        d="M12 23.8c-5.2 1.1-2.6 3.2 3.5 3.3 6.2.1 9.5-1.4 9.5-2.7 0-.8-1-1.2-2.7-1.5"
        fill="none"
        stroke="#355d9a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.1 20.4c-3.4.8-1.8 2.4 4.6 2.5 7.3.1 10.4-1.2 10.4-2.6 0-.7-.8-1.1-2.1-1.4"
        fill="none"
        stroke="#355d9a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.2 18.7c-1.8-1.9 1.1-3.5 2.5-4.9 2.1-2.1-.2-3.5-.7-4.9"
        fill="none"
        stroke="#c15d2a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17.1 16.8c4.1-2.2 2.1-4.3.7-5.7-1.8-1.8 3.1-3.4 3.1-6"
        fill="none"
        stroke="#c15d2a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="mf-page">
      <ProductHeader />
      <main>
        <section className="mf-grid-lines border-b border-[var(--mf-border)] bg-white">
          <div className="mf-container py-16 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--mf-primary)]">
                Migration control plane
              </p>
              <h1 className="mt-4 text-[clamp(2.2rem,5vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-[var(--mf-text)]">
                Choose your migration platform
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--mf-text-muted)]">
                Configure, govern, execute, review, and prove complex framework migrations from one operational workspace.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <TechnologyCard
                eyebrow="Frontend"
                title="Angular Migration"
                description="Govern adjacent-major Angular modernization with certified runtime binding, evidence-backed gates, causal repair, validation, promotion, and sealed stage delivery."
                meta={["Angular 11 → 21", "Node · npm", "TypeScript · Angular CLI"]}
                href="/angular/migrations/new"
                action="Start Angular migration"
                icon={<AngularIcon />}
              />
              <TechnologyCard
                eyebrow="Backend"
                title="Spring Boot Migration"
                description="Move Spring Boot applications across governed profiles with reviewed analysis and planning, Maven validation, repair review, dependency targeting, and final proof."
                meta={["Spring Boot 2.1 → 4.0", "Java · Maven", "Reviewed phase gates"]}
                href="/java/migrations/new"
                action="Start Spring Boot migration"
                icon={<JavaIcon />}
              />
            </div>
          </div>
        </section>

        <section className="mf-container py-10 lg:py-12">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--mf-text-soft)]">
                Operations
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">
                Recent migrations
              </h2>
            </div>
            <span className="text-xs text-[var(--mf-text-soft)]">Updated from current workspace</span>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-[var(--mf-border)] bg-white shadow-[var(--mf-shadow)]">
            <div className="hidden grid-cols-[1.2fr_.8fr_.9fr_.6fr_90px] gap-4 border-b border-[var(--mf-border)] bg-[var(--mf-surface-subtle)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--mf-text-soft)] md:grid">
              <span>Application</span>
              <span>Platform</span>
              <span>Route</span>
              <span>Status</span>
              <span className="text-right">Updated</span>
            </div>
            {recentMigrations.map((migration) => (
              <Link
                key={migration.id}
                href={migration.href}
                className="mf-focus grid gap-3 border-b border-[var(--mf-border)] px-5 py-4 transition-colors last:border-b-0 hover:bg-[var(--mf-surface-subtle)] md:grid-cols-[1.2fr_.8fr_.9fr_.6fr_90px] md:items-center md:gap-4"
              >
                <span className="text-sm font-semibold">{migration.name}</span>
                <span className="text-sm text-[var(--mf-text-muted)]">{migration.stack}</span>
                <span className="font-mono text-xs text-[var(--mf-text-muted)]">{migration.route}</span>
                <span><StatusBadge label={migration.status} /></span>
                <span className="text-xs text-[var(--mf-text-soft)] md:text-right">{migration.updated}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
