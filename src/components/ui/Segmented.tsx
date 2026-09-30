"use client";

interface Option<T extends string> { value: T; label: string }

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

/** A small radio group styled as segmented buttons. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-subtle p-0.5">
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(o.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              checked ? "bg-surface text-accent shadow-sm ring-1 ring-accent/40" : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
