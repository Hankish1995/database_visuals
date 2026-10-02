"use client";

import { Database, Pause, Play, RotateCcw } from "lucide-react";
import { PlaybackStatus } from "@/components/playback/PlaybackStatus";
import { StepDots } from "@/components/playback/StepDots";
import { IconButton } from "@/components/ui/IconButton";
import type { Workspace } from "@/hooks/useWorkspace";
import { useMessages } from "@/i18n";

export function PlaybackStrip({ ws, className = "" }: { ws: Workspace; className?: string }) {
  const { playback, sim, scene } = ws;
  const total = sim.steps.length;
  const n = scene.status === "idle" ? 0 : playback.index + 1;
  const playing = playback.status === "playing";
  const m = useMessages().playback;

  return (
    <section aria-label={m.region} className={`flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-card lg:flex-nowrap lg:px-5 ${className}`}>
      <div className="flex min-w-0 items-center gap-3 lg:w-72">
        <Database className="size-7 shrink-0 text-flow-bright" aria-hidden />
        <div role="status" aria-live="polite" className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {scene.status === "idle" ? m.steps(total) : scene.status === "done" ? m.complete : m.stepOf(n, total)}
          </p>
          <p className="truncate text-xs text-muted">{scene.status === "idle" ? m.waiting : scene.status === "done" ? m.serverReplied(sim.commandTag) : scene.step?.title}</p>
        </div>
      </div>

      <StepDots sim={sim} scene={scene} onSeek={playback.seek} />

      <div className="ml-auto flex items-center gap-3">
        <PlaybackStatus status={playback.status} done={scene.status === "done" ? total : n} total={total} />
        <IconButton label={playing ? m.pause : m.resume} disabled={playback.status === "idle" || playback.status === "done"}
          onClick={playing ? playback.pause : playback.resume}>
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </IconButton>
        <IconButton label={m.replay} onClick={playback.start}>
          <RotateCcw className="size-4" aria-hidden />
        </IconButton>
      </div>
    </section>
  );
}
