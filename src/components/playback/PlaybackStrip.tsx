"use client";

import { Database, Pause, Play, RotateCcw } from "lucide-react";
import { PlaybackStatus } from "@/components/playback/PlaybackStatus";
import { StepDots } from "@/components/playback/StepDots";
import { IconButton } from "@/components/ui/IconButton";
import type { Workspace } from "@/hooks/useWorkspace";

export function PlaybackStrip({ ws, className = "" }: { ws: Workspace; className?: string }) {
  const { playback, sim, scene } = ws;
  const total = sim.steps.length;
  const n = scene.status === "idle" ? 0 : playback.index + 1;
  const playing = playback.status === "playing";

  return (
    <section aria-label="Playback" className={`flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-card lg:flex-nowrap lg:px-5 ${className}`}>
      <div className="flex min-w-0 items-center gap-3 lg:w-72">
        <Database className="size-7 shrink-0 text-flow-bright" aria-hidden />
        <div role="status" aria-live="polite" className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {scene.status === "idle" ? `${total} steps` : scene.status === "done" ? "Run complete" : `Step ${n} of ${total}`}
          </p>
          <p className="truncate text-xs text-muted">{scene.status === "idle" ? "Waiting for Run query" : scene.status === "done" ? `Server replied: ${sim.commandTag}` : scene.step?.title}</p>
        </div>
      </div>

      <StepDots sim={sim} scene={scene} onSeek={playback.seek} />

      <div className="ml-auto flex items-center gap-3">
        <PlaybackStatus status={playback.status} done={scene.status === "done" ? total : n} total={total} />
        <IconButton label={playing ? "Pause" : "Resume"} disabled={playback.status === "idle" || playback.status === "done"}
          onClick={playing ? playback.pause : playback.resume}>
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </IconButton>
        <IconButton label="Replay from the start" onClick={playback.start}>
          <RotateCcw className="size-4" aria-hidden />
        </IconButton>
      </div>
    </section>
  );
}
