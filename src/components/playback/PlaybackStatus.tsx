import { CircleCheck, Pause, Play, Timer } from "lucide-react";
import { useMessages } from "@/i18n";
import type { PlayStatus } from "@/lib/sim/sceneState";

const LABEL: Record<PlayStatus, { key: "ready" | "playing" | "paused" | "done"; icon: typeof Play; tone: string }> = {
  idle: { key: "ready", icon: Timer, tone: "text-muted" },
  playing: { key: "playing", icon: Play, tone: "text-accent" },
  paused: { key: "paused", icon: Pause, tone: "text-ink-soft" },
  done: { key: "done", icon: CircleCheck, tone: "text-ok" },
};

export function PlaybackStatus({ status, done, total }: { status: PlayStatus; done: number; total: number }) {
  const m = useMessages().playback;
  const { key, icon: Icon, tone } = LABEL[status];
  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${tone}`}>
        <Icon className={`size-4 ${status === "playing" || status === "paused" ? "fill-current" : ""}`} aria-hidden />
        {m[key]}
      </span>
      <div role="progressbar" aria-label={m.progress} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}
        className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-line sm:block xl:w-40">
        <div className={`h-full rounded-full transition-[width] duration-500 ${status === "done" ? "bg-ok" : "bg-accent"}`} style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span className="text-sm tabular-nums text-muted">{done} / {total}</span>
    </div>
  );
}
