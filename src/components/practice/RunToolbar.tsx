"use client";

import { useState } from "react";
import Link from "next/link";
import { ChartNetwork, Loader2, Play, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/Switch";

interface Props {
  onRun: () => void;
  running: boolean;
  ready: boolean;
  continueOnError: boolean;
  onContinueChange: (v: boolean) => void;
  onReset: () => void;
  sql: string;
}

export function RunToolbar({ onRun, running, ready, continueOnError, onContinueChange, onReset, sql }: Props) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onRun} disabled={!ready || running}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50">
        {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4 fill-current" aria-hidden />}
        Run <kbd className="hidden rounded bg-white/20 px-1 text-[10px] font-medium sm:inline">Ctrl ↵</kbd>
      </button>
      <Switch label="Keep going after errors" checked={continueOnError} onChange={onContinueChange} onText="Yes" offText="No" />
      <Link href={`/visualize?sql=${encodeURIComponent(sql)}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm text-ink-soft hover:border-line-strong hover:text-ink">
        <ChartNetwork className="size-4" aria-hidden /> Visualize plan
      </Link>
      <button type="button" onClick={() => { if (confirming) { setConfirming(false); onReset(); } else setConfirming(true); }}
        onBlur={() => setConfirming(false)} disabled={!ready}
        className={`ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm disabled:opacity-50 ${confirming ? "border-miss-line bg-miss-soft font-semibold text-miss" : "border-line text-ink-soft hover:border-line-strong"}`}>
        <RotateCcw className="size-4" aria-hidden /> {confirming ? "Click again to reset" : "Reset database"}
      </button>
    </div>
  );
}
