"use client";

import { useEffect, useRef } from "react";
import { LabControls } from "@/components/labs/LabControls";
import { LabStepCard } from "@/components/labs/LabStepCard";
import type { LabLesson } from "@/content/labs";
import { useLab } from "@/hooks/useLab";

// A hands-on lesson: real SQL, run step by step (or all automatically) on a
// PostgreSQL instance of its own, with each result drawn and explained.
export function LabStage({ lab, reduceMotion }: { lab: LabLesson; reduceMotion: boolean }) {
  const state = useLab(lab);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const focus = state.running ?? (state.autoplay ? state.next : null);

  useEffect(() => {
    if (focus === null) return;
    cards.current[focus]?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }, [focus, reduceMotion]);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-line">
      <LabControls lab={lab} state={state} />
      <div className="min-h-0 flex-1 overflow-y-auto bg-subtle p-3 sm:p-4">
        <p className="mb-3 max-w-3xl text-sm leading-relaxed text-ink-soft">{lab.intro}</p>
        <ol className="space-y-3">
          {lab.steps.map((step, i) => (
            <LabStepCard key={step.id} ref={(el) => { cards.current[i] = el; }} step={step} index={i} outcome={state.outcomes[step.id]}
              state={state.running === i ? "running" : i < state.next ? "done" : i === state.next ? "next" : "locked"}
              canRun={state.status === "ready" && state.running === null && !state.autoplay} onRun={state.runNext} />
          ))}
        </ol>
      </div>
    </div>
  );
}
