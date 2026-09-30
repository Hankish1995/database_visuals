"use client";

import { useCallback, useEffect, useState } from "react";
import type { LabLesson } from "@/content/labs";
import { useDatabase } from "@/hooks/useDatabase";
import { crashAndRecover, type RecoveryReport } from "@/lib/db/crash";
import type { StatementResult } from "@/lib/db/types";

export interface StepOutcome { results: StatementResult[]; recovery?: RecoveryReport; failure?: string }

const AUTO_DELAY_MS = 3200;

// Runs a lab's steps in order against its own database. Auto-play runs the
// next step, waits so the result can be read, and continues to the end.
export function useLab(lab: LabLesson) {
  const db = useDatabase({ key: `lab-${lab.id}`, sql: lab.setup, extensions: lab.extensions });
  const [outcomes, setOutcomes] = useState<Record<string, StepOutcome>>({});
  const [next, setNext] = useState(0);
  const [running, setRunning] = useState<number | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  const { run, withDb, replace, reset: resetDb, status } = db;

  const runStep = useCallback(async (index: number) => {
    const step = lab.steps[index];
    setRunning(index);
    let outcome: StepOutcome;
    try {
      if (step.action === "crash") {
        const recovery = await withDb(async (current) => {
          const { db: recovered, report } = await crashAndRecover(current, lab.extensions);
          replace(recovered);
          return report;
        });
        outcome = { results: [], recovery };
      } else {
        outcome = { results: await run(step.sql, { continueOnError: true }) };
      }
    } catch (e) {
      outcome = { results: [], failure: e instanceof Error ? e.message : String(e) };
    }
    setOutcomes((o) => ({ ...o, [step.id]: outcome }));
    setNext((n) => Math.max(n, index + 1));
    if (index + 1 >= lab.steps.length) setAutoplay(false);
    setRunning(null);
  }, [lab, run, withDb, replace]);

  useEffect(() => {
    if (!autoplay || running !== null || status !== "ready") return;
    if (next >= lab.steps.length) return;
    // The first step starts right away; later ones wait so the previous result can be read.
    const timer = window.setTimeout(() => runStep(next), next === 0 ? 300 : AUTO_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, running, next, status, lab.steps.length, runStep]);

  const startOver = useCallback(async (thenPlay: boolean) => {
    setAutoplay(false);
    setOutcomes({});
    setNext(0);
    await resetDb();
    setAutoplay(thenPlay);
  }, [resetDb]);

  return {
    status, error: db.error, outcomes, next, running, autoplay, done: next >= lab.steps.length,
    runNext: () => runStep(next),
    play: () => (next >= lab.steps.length ? startOver(true) : setAutoplay(true)),
    pause: () => setAutoplay(false),
    startOver: () => startOver(false),
  };
}

export type Lab = ReturnType<typeof useLab>;
