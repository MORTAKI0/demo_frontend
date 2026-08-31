import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--mf-primary)] text-white border-[var(--mf-primary)] hover:bg-[var(--mf-primary-hover)]",
  secondary:
    "bg-white text-[var(--mf-text)] border-[var(--mf-border-strong)] hover:bg-[var(--mf-surface-subtle)]",
  danger:
    "bg-white text-[var(--mf-danger)] border-[#efbcbc] hover:bg-[var(--mf-danger-soft)]",
  ghost:
    "bg-transparent text-[var(--mf-text-muted)] border-transparent hover:bg-[var(--mf-surface-muted)] hover:text-[var(--mf-text)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  busy = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`mf-focus inline-flex items-center justify-center gap-2 rounded-[9px] border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || busy}
      {...props}
    >
      {busy ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}
