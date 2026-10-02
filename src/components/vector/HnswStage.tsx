"use client";

import { HnswControls } from "@/components/vector/HnswControls";
import { HnswGraph, HnswLegend } from "@/components/vector/HnswGraph";
import { HnswResults } from "@/components/vector/HnswResults";
import type { HnswDemo } from "@/hooks/useHnswDemo";
import { RichText } from "@/components/ui/RichText";
import { useMessages } from "@/i18n";
import { HNSW_TEXT } from "@/lib/hnsw/text";
import { useLocale } from "@/lib/prefs";

// The HNSW lesson's stage: settings, the layered graph with the search
// animating across it, a one-line explanation of each step, and the results.
export function HnswStage({ demo }: { demo: HnswDemo }) {
  const { frame, result, k } = demo;
  const m = useMessages().vector;
  const t = HNSW_TEXT[useLocale()];
  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-line">
      <HnswControls demo={demo} />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto border-t border-line bg-subtle p-3 sm:p-4">
        <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">
          <RichText text={m.intro} />
        </p>
        <HnswGraph demo={demo} />
        <HnswLegend compare={demo.compare === "exact"} />
        <p role="status" aria-live={demo.playback.status === "playing" ? "off" : "polite"} className="min-h-10 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink">
          {frame.event && <span className="mr-2 font-mono text-xs text-muted">{m.stepOf(frame.index + 1, result.trace.length)}</span>}
          {t.describe(frame.event, result.efSearch, k)}
        </p>
        <HnswResults demo={demo} />
      </div>
    </div>
  );
}
