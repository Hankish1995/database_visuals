import { CircleCheck, Pause, Play, Timer } from "lucide-react";
import type { PlayStatus } from "@/lib/sim/sceneState";

const LABEL: Record<PlayStatus, { text: string; icon: typeof Play; tone: string }> = {
  idle: { text: "Ready", icon: Timer, tone: "text-muted" },
  playing: { text: "Auto-playing…", icon: Play, tone: "text-accent" },
  paused: { text: "Paused", icon: Pause, tone: "text-ink-soft" },
  done: { text: "Complete", icon: CircleCheck, tone: "text-ok" },
};

export function PlaybackStatus({ status, done, total }: { status: PlayStatus; done: number; total: number }) {
  const { text, icon: Icon, tone } = LABEL[status];
  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${tone}`}>
        <Icon className={`size-4 ${status === "playing" || status === "paused" ? "fill-current" : ""}`} aria-hidden />
        {text}
      </span>
      <div role="progressbar" aria-label="Run progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}
        className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-line sm:block xl:w-40">
        <div className={`h-full rounded-full transition-[width] duration-500 ${status === "done" ? "bg-ok" : "bg-accent"}`} style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span className="text-sm tabular-nums text-muted">{done} / {total}</span>
    </div>
  );
}
