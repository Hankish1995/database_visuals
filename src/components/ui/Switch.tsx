"use client";

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible state words so the switch never relies on colour alone. */
  onText?: string;
  offText?: string;
}

export function Switch({ label, checked, onChange, onText = "On", offText = "Off" }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-xs font-medium text-ink-soft"
    >
      <span>{label}</span>
      <span aria-hidden className={`relative block h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-index" : "bg-line-strong"}`}>
        <span className={`absolute top-0.5 left-0 size-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
      <span aria-hidden className={`w-6 text-left ${checked ? "text-index" : "text-muted"}`}>{checked ? onText : offText}</span>
    </button>
  );
}
