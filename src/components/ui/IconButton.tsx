import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

/** An icon-only button; `label` becomes its accessible name and tooltip. */
export function IconButton({ label, children, className = "", ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
