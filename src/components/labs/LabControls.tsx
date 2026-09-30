"use client";

import { Database, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import type { LabLesson } from "@/content/labs";
import type { Lab } from "@/hooks/useLab";

export function LabControls({ lab, state }: { lab: LabLesson; state: Lab }) {
  const total = lab.steps.length;
  const label = state.status === "loading" ? "Starting PostgreSQL…" : state.status === "error" ? "Couldn't start the database"
    : state.done ? "Lesson complete" : state.autoplay ? "Auto-playing…" : state.next === 0 ? "Ready" : "Paused";
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 lg:px-5">
      <p role="status" className="flex min-w-0 items-center gap-2 text-sm">
        {state.status === "loading" ? <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> : <Database className="size-4 text-flow-bright" aria-hidden />}
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-muted">· {Math.min(state.next, total)} of {total} steps run</span>
      </p>
      {state.error && <p role="alert" className="text-xs text-miss">{state.error}</p>}
      <div className="ml-auto flex items-center gap-2">
        {state.autoplay ? (
          <button type="button" onClick={state.pause} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium text-ink hover:border-line-strong">
            <Pause className="size-4" aria-hidden /> Pause
          </button>
        ) : (
          <button type="button" onClick={state.play} disabled={state.status !== "ready" || state.running !== null}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50">
            <Play className="size-4 fill-current" aria-hidden /> {state.done ? "Play again" : state.next === 0 ? "Run lesson" : "Continue"}
          </button>
        )}
        <IconButton label="Start over with a fresh database" onClick={state.startOver} disabled={state.status === "loading" || state.running !== null}>
          <RotateCcw className="size-4" aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}
