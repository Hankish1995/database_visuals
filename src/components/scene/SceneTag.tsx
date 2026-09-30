import { Check } from "lucide-react";

export type TagState = "active" | "done" | null;

interface Props {
  title: string;
  subtitle?: string;
  state?: TagState;
  selected?: boolean;
  onSelect?: () => void;
  tone?: "flow" | "index";
}

/** The clickable caption under a scene object. State is spelled out, not only coloured. */
export function SceneTag({ title, subtitle, state, selected, onSelect, tone = "flow" }: Props) {
  const toneText = tone === "index" ? "text-index" : "text-flow";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`pointer-events-auto whitespace-nowrap rounded-lg px-2 py-1 text-center leading-tight transition-colors ${
        selected ? "bg-surface/95 ring-2 ring-accent" : "bg-surface/75 hover:bg-surface/95"}`}
    >
      <span className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-ink">
        {title}
        {state === "active" && <span className={`rounded bg-flow-soft px-1 text-[10px] font-bold uppercase ${toneText}`}>Now</span>}
        {state === "done" && <Check className="size-3.5 text-ok" aria-label="done" />}
      </span>
      {subtitle && <span className="block text-[11px] text-muted">{subtitle}</span>}
    </button>
  );
}
