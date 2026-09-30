"use client";

import { useState, type KeyboardEvent } from "react";
import { CONCEPTS } from "@/content/concepts";
import { CONCEPT_ICONS } from "@/components/inspector/conceptIcons";
import { Overview } from "@/components/inspector/Overview";
import { RunDetails } from "@/components/inspector/RunDetails";
import { StepList } from "@/components/inspector/StepList";
import type { Workspace } from "@/hooks/useWorkspace";

const TABS = [["overview", "Overview"], ["run", "This run"], ["steps", "Steps"]] as const;
type Tab = (typeof TABS)[number][0];

// Explains whatever is selected, or else whatever the query is doing now.
export function Inspector({ ws, className = "" }: { ws: Workspace; className?: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const concept = CONCEPTS[ws.inspected];
  const Icon = CONCEPT_ICONS[ws.inspected];
  const lab = ws.lesson.kind === "lab";

  function onKey(e: KeyboardEvent) {
    const i = TABS.findIndex(([id]) => id === tab);
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null) return;
    const [id] = TABS[(next + TABS.length) % TABS.length];
    setTab(id);
    document.getElementById(`tab-${id}`)?.focus();
  }

  return (
    <aside aria-label="Inspector" className={`flex flex-col rounded-xl border border-line bg-surface shadow-card lg:min-h-0 ${className}`}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Icon className="size-6 text-accent" aria-hidden />
        <h2 className="text-base font-bold uppercase tracking-wide text-ink">{concept.name}</h2>
        {ws.pinned && ws.lesson.kind !== "focus" && (
          <button type="button" onClick={() => ws.select(null)} className="ml-auto text-xs font-medium text-accent hover:underline">Follow playback</button>
        )}
      </div>
      {lab ? (
        <div className="px-5 pb-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto"><Overview concept={concept} /></div>
      ) : (
      <>
      <div role="tablist" aria-label="Inspector sections" className="mx-5 grid grid-cols-3 gap-1 rounded-lg border border-line bg-subtle p-1" onKeyDown={onKey}>
        {TABS.map(([id, label]) => (
          <button key={id} id={`tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls="inspector-panel" tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            className={`rounded-md py-1.5 text-sm font-medium ${tab === id ? "bg-surface text-accent shadow-sm ring-1 ring-accent/40" : "text-muted hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>
      <div id="inspector-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="px-5 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {tab === "overview" && <Overview concept={concept} onOpenCache={ws.inspected === "bufferPool" ? () => ws.select("cache") : undefined} />}
        {tab === "run" && <RunDetails concept={ws.inspected} sim={ws.sim} scene={ws.scene} />}
        {tab === "steps" && <StepList sim={ws.sim} scene={ws.scene} onSeek={ws.playback.seek} />}
      </div>
      </>
      )}
    </aside>
  );
}
