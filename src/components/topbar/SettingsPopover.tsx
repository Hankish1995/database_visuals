"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { useMessages } from "@/i18n";
import type { MotionPref, Settings, Speed } from "@/hooks/useWorkspace";

interface Props { settings: Settings; onChange: (s: Settings) => void }

export function SettingsPopover({ settings, onChange }: Props) {
  const s = useMessages().settings;
  return (
    <>
      <button type="button" popoverTarget="settings-panel" aria-label={s.title} title={s.title} className="inline-flex size-9 items-center justify-center rounded-lg text-ink-soft hover:bg-subtle hover:text-ink">
        <SettingsIcon className="size-5" aria-hidden />
      </button>
      <div id="settings-panel" popover="auto" role="dialog" aria-labelledby="settings-title" className="w-[min(320px,calc(100vw-32px))] space-y-4 p-5 text-sm">
        <h2 id="settings-title" className="text-base font-semibold">{s.title}</h2>
        <div className="space-y-2">
          <p className="font-medium">{s.speed}</p>
          <Segmented<Speed> label={s.speed} value={settings.speed} onChange={(speed) => onChange({ ...settings, speed })}
            options={[{ value: "slow", label: s.slow }, { value: "normal", label: s.normal }, { value: "fast", label: s.fast }]} />
        </div>
        <div className="space-y-2">
          <p className="font-medium">{s.motion}</p>
          <Segmented<MotionPref> label={s.motion} value={settings.motion} onChange={(motion) => onChange({ ...settings, motion })}
            options={[{ value: "system", label: s.matchSystem }, { value: "reduce", label: s.reduceMotion }]} />
          <p className="text-xs text-muted">{s.motionNote}</p>
        </div>
      </div>
    </>
  );
}
