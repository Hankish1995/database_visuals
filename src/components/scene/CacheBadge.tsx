import { CircleCheck, CircleX } from "lucide-react";
import type { CacheResult } from "@/lib/sim/types";

const TEXT: Record<CacheResult, string> = { hit: "Cache hit", miss: "Cache miss", partial: "Partial cache miss" };

/** Hit or miss, with an icon and words -- never colour alone. Opens the cache explanation. */
export function CacheBadge({ result, selected, onSelect }: { result: CacheResult; selected?: boolean; onSelect: () => void }) {
  const hit = result === "hit";
  const Icon = hit ? CircleCheck : CircleX;
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected}
      className={`pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-1 text-xs font-semibold shadow-sm ${
        hit ? "border-ok/30 bg-ok-soft text-ok" : "border-miss-line bg-miss-soft text-miss"} ${selected ? "ring-2 ring-accent" : ""}`}>
      <Icon className="size-4" aria-hidden />
      {TEXT[result]}
    </button>
  );
}
