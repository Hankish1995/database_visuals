"use client";

import { RotateCcw } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import type { ViewMode, Workspace } from "@/hooks/useWorkspace";
import type { CacheMode } from "@/lib/sim/types";
import { useContent } from "@/content/localized";
import { useMessages } from "@/i18n";

export function StageHeader({ ws, can3d }: { ws: Workspace; can3d: boolean }) {
  const lab = ws.lesson.kind === "lab";
  const vector = ws.lesson.kind === "vector";
  const own = lab || vector;
  const m = useMessages().stage;
  const lesson = useContent().lesson(ws.lesson.id);
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 pt-4 pb-3 lg:px-5">
      <div className="min-w-0">
        <h1 id="stage-title" className="text-lg font-extrabold uppercase tracking-wide text-ink">{own ? lesson.title : m.queryFlow}</h1>
        <p className="text-sm text-muted">
          {own ? lesson.subtitle : m.queryFlowSubtitle}
          <span className="ml-2 inline-block rounded border border-line bg-subtle px-1.5 text-[11px] font-medium text-ink-soft">
            {lab ? m.badgeLab : vector ? m.badgeVector : m.badgeModel}
          </span>
        </p>
      </div>
      {!own && (
        <div className="flex flex-wrap items-center gap-2">
          <Switch label={m.indexSwitch} checked={ws.options.useIndex} onChange={(useIndex) => ws.changeOptions({ useIndex })} />
          <Segmented<CacheMode> label={m.bufferState} value={ws.options.cache} onChange={(cache) => ws.changeOptions({ cache })}
            options={[{ value: "miss", label: m.cold }, { value: "hit", label: m.warm }]} />
          {can3d && (
            <Segmented<ViewMode> label={m.view} value={ws.view} onChange={ws.setView}
              options={[{ value: "3d", label: "3D" }, { value: "2d", label: "2D" }]} />
          )}
          {can3d && ws.view === "3d" && (
            <IconButton label={m.resetCamera} onClick={ws.resetCamera} className="size-8">
              <RotateCcw className="size-4" aria-hidden />
            </IconButton>
          )}
        </div>
      )}
    </div>
  );
}
