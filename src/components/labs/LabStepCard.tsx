"use client";

import { forwardRef } from "react";
import { Check, Eye, Loader2, Lock, Play } from "lucide-react";
import { LabStepView } from "@/components/labs/LabStepView";
import { SqlCode } from "@/components/sql/SqlCode";
import type { LabStep } from "@/content/labs";
import type { StepOutcome } from "@/hooks/useLab";

interface Props {
  step: LabStep;
  index: number;
  state: "done" | "next" | "running" | "locked";
  outcome?: StepOutcome;
  canRun: boolean;
  onRun: () => void;
}

export const LabStepCard = forwardRef<HTMLLIElement, Props>(function LabStepCard({ step, index, state, outcome, canRun, onRun }, ref) {
  const badge = state === "done" ? "bg-ok text-white" : state === "locked" ? "bg-subtle text-muted ring-1 ring-line" : "bg-accent text-white";
  return (
    <li ref={ref} aria-current={state === "running" || state === "next" ? "step" : undefined}
      className={`rounded-xl border bg-surface p-4 ${state === "running" ? "border-flow-bright ring-2 ring-flow-bright/20" : state === "next" ? "border-accent/40" : "border-line"} ${state === "locked" ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badge}`}>
          {state === "done" ? <Check className="size-3.5" aria-label="done" /> : index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">{step.title}</h3>
            {state === "next" && (
              <button type="button" onClick={onRun} disabled={!canRun}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-50">
                <Play className="size-3.5 fill-current" aria-hidden /> {step.action === "crash" ? "Crash the database" : "Run this step"}
              </button>
            )}
            {state === "running" && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-flow"><Loader2 className="size-3.5 animate-spin" aria-hidden /> Running…</span>}
            {state === "locked" && <span className="inline-flex items-center gap-1 text-xs text-muted"><Lock className="size-3" aria-hidden /> Runs after step {index}</span>}
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">{step.body}</p>
          {step.sql && <SqlCode sql={step.sql} />}
          {outcome && (
            <div className="space-y-2">
              <p className="flex gap-1.5 rounded-lg border border-accent/20 bg-accent-soft/60 px-3 py-2 text-sm text-ink-soft">
                <Eye className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <span><strong className="text-ink">What to notice: </strong>{step.observe}</span>
              </p>
              <LabStepView view={step.view} outcome={outcome} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
});
