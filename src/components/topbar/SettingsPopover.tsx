"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import type { MotionPref, Settings, Speed } from "@/hooks/useWorkspace";

interface Props { settings: Settings; onChange: (s: Settings) => void }

export function SettingsPopover({ settings, onChange }: Props) {
  return (
    <>
      <button type="button" popoverTarget="settings-panel" aria-label="Settings" title="Settings" className="inline-flex size-9 items-center justify-center rounded-lg text-ink-soft hover:bg-subtle hover:text-ink">
        <SettingsIcon className="size-5" aria-hidden />
      </button>
      <div id="settings-panel" popover="auto" role="dialog" aria-labelledby="settings-title" className="w-[min(320px,calc(100vw-32px))] space-y-4 p-5 text-sm">
        <h2 id="settings-title" className="text-base font-semibold">Settings</h2>
        <div className="space-y-2">
          <p className="font-medium">Playback speed</p>
          <Segmented<Speed> label="Playback speed" value={settings.speed} onChange={(speed) => onChange({ ...settings, speed })}
            options={[{ value: "slow", label: "Slow" }, { value: "normal", label: "Normal" }, { value: "fast", label: "Fast" }]} />
        </div>
        <div className="space-y-2">
          <p className="font-medium">Motion</p>
          <Segmented<MotionPref> label="Motion" value={settings.motion} onChange={(motion) => onChange({ ...settings, motion })}
            options={[{ value: "system", label: "Match system" }, { value: "reduce", label: "Reduce motion" }]} />
          <p className="text-xs text-muted">Reduced motion swaps movement for instant state changes. Every step is still explained.</p>
        </div>
      </div>
    </>
  );
}
