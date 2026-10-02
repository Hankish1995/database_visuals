"use client";

import { Pause, Play, RotateCcw, Search } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Segmented } from "@/components/ui/Segmented";
import type { CompareMode, HnswDemo } from "@/hooks/useHnswDemo";
import { EF_MAX, EF_MIN } from "@/lib/hnsw/dataset";

// Query choice, the ef_search slider, Run search, and the playback buttons
// the Query flow lesson uses. Changing a setting while a search is shown
// replays the search with the new value.
export function HnswControls({ demo }: { demo: HnswDemo }) {
  const { playback } = demo;
  const playing = playback.status === "playing";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 lg:px-5">
      <Segmented label="Query vector" value={demo.queryId} onChange={demo.setQueryId}
        options={demo.queries.map((q) => ({ value: q.id, label: q.label }))} />
      <label className="flex min-w-56 flex-1 items-center gap-3 text-sm">
        <span className="font-mono font-semibold text-ink">ef_search</span>
        <input type="range" min={EF_MIN} max={EF_MAX} step={1} value={demo.efSearch}
          onChange={(e) => demo.setEfSearch(Number(e.target.value))}
          aria-valuetext={`${demo.efSearch} candidates`} className="h-2 flex-1 accent-[var(--color-accent)]" />
        <output className="w-8 text-right font-mono text-base font-bold tabular-nums text-accent">{demo.efSearch}</output>
      </label>
      <Segmented<CompareMode> label="Results shown" value={demo.compare} onChange={demo.setCompare}
        options={[{ value: "approx", label: "HNSW only" }, { value: "exact", label: "Compare with exact" }]} />
      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={demo.run}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-white hover:bg-accent/90">
          <Search className="size-4" aria-hidden /> Run search
        </button>
        <IconButton label={playing ? "Pause" : "Resume"} disabled={playback.status !== "playing" && playback.status !== "paused"}
          onClick={playing ? playback.pause : playback.resume}>
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </IconButton>
        <IconButton label="Replay the search" disabled={playback.status === "idle"} onClick={demo.run}>
          <RotateCcw className="size-4" aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}
