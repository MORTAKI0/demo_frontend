import { toneForStatus, type StatusTone } from "@/lib/display";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-[#eef1f5] text-[#5f6978] border-[#d9dfe6]",
  info: "bg-[var(--mf-info-soft)] text-[var(--mf-info)] border-[#cbd7ff]",
  success:
    "bg-[var(--mf-success-soft)] text-[var(--mf-success)] border-[#bfe9d1]",
  warning:
    "bg-[var(--mf-warning-soft)] text-[var(--mf-warning)] border-[#f1d69d]",
  danger:
    "bg-[var(--mf-danger-soft)] text-[var(--mf-danger)] border-[#efc1c1]",
};

export function StatusBadge({
  label,
  tone = toneForStatus(label),
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] ${toneClasses[tone]}`}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}
