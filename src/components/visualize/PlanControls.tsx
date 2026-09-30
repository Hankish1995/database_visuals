"use client";

import { ChartNetwork, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { PLAN_SAMPLES } from "@/content/planSamples";

interface Props { analyze: boolean; onAnalyzeChange: (v: boolean) => void; onRun: () => void; running: boolean; ready: boolean; onSample: (sql: string) => void }

export function PlanControls({ analyze, onAnalyzeChange, onRun, running, ready, onSample }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onRun} disabled={!ready || running}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50">
          {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ChartNetwork className="size-4" aria-hidden />} Explain
        </button>
        <Switch label="Run it (ANALYZE)" checked={analyze} onChange={onAnalyzeChange} onText="On" offText="Off" />
      </div>
      <p className="text-xs text-muted">
        {analyze ? "ANALYZE executes the statement and reports real row counts and times. For INSERT, UPDATE or DELETE that means the change really happens." : "Without ANALYZE you see only the planner's estimates; nothing runs."}
      </p>
      <label className="block text-xs font-semibold text-ink">
        Try a sample
        <select defaultValue="" onChange={(e) => { const s = PLAN_SAMPLES.find((x) => x.id === e.target.value); if (s) onSample(s.sql); }}
          className="mt-1 block h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm font-normal text-ink">
          <option value="" disabled>Choose a query…</option>
          {PLAN_SAMPLES.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </label>
    </div>
  );
}
