import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { useMessages } from "@/i18n";

interface Props {
  title: string;
  subtitle: string;
  state: "active" | "done" | "off" | null;
  selected: boolean;
  onSelect: () => void;
  tone?: "flow" | "index";
  children?: ReactNode;
  className?: string;
}

/** A component in the 2D diagram. Its state is written out as well as coloured. */
export function DiagramCard({ title, subtitle, state, selected, onSelect, tone = "flow", children, className = "" }: Props) {
  const m = useMessages().scene;
  const STATE_TEXT = { active: m.now, done: m.done, off: m.notUsed };
  const ring = state === "active" ? (tone === "index" ? "border-index ring-2 ring-index/25" : "border-flow-bright ring-2 ring-flow-bright/25") : "border-line";
  return (
    <div className={`rounded-xl border bg-surface p-3 shadow-card transition-colors ${ring} ${state === "off" ? "opacity-60" : ""} ${className}`}>
      <button type="button" onClick={onSelect} aria-pressed={selected}
        className={`flex w-full items-start justify-between gap-2 rounded-md text-left ${selected ? "outline-2 outline-offset-4 outline-accent" : ""}`}>
        <span>
          <span className={`block text-sm font-semibold ${tone === "index" ? "text-index" : "text-ink"}`}>{title}</span>
          <span className="block text-xs text-muted">{subtitle}</span>
        </span>
        {state && (
          <span className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
            state === "active" ? "bg-flow-soft text-flow" : state === "done" ? "bg-ok-soft text-ok" : "bg-subtle text-muted"}`}>
            {state === "done" && <Check className="size-3" aria-hidden />}
            {STATE_TEXT[state]}
          </span>
        )}
      </button>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
