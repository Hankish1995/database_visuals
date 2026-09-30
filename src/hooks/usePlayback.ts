"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayStatus } from "@/lib/sim/sceneState";

interface PlaybackState {
  status: PlayStatus;
  index: number;
  /** Bumped on every run so replaying an identical state still restarts the timer. */
  run: number;
}

// Advances through `stepCount` steps automatically, one every `stepMs`.
// Pausing keeps the time left on the current step; resuming continues it.
export function usePlayback(stepCount: number, stepMs: number) {
  const [state, setState] = useState<PlaybackState>({ status: "idle", index: -1, run: 0 });
  const remaining = useRef(stepMs);
  const startedAt = useRef(0);

  useEffect(() => {
    if (state.status !== "playing") return;
    startedAt.current = performance.now();
    const timer = window.setTimeout(() => {
      remaining.current = stepMs;
      setState((s) => (s.index + 1 >= stepCount ? { ...s, status: "done" } : { ...s, index: s.index + 1 }));
    }, remaining.current);
    return () => window.clearTimeout(timer);
  }, [state, stepCount, stepMs]);

  const start = useCallback(() => {
    remaining.current = stepMs;
    setState((s) => ({ status: "playing", index: 0, run: s.run + 1 }));
  }, [stepMs]);

  const pause = useCallback(() => {
    setState((s) => {
      if (s.status !== "playing") return s;
      remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current));
      return { ...s, status: "paused" };
    });
  }, []);

  const resume = useCallback(() => setState((s) => (s.status === "paused" ? { ...s, status: "playing" } : s)), []);

  const seek = useCallback((index: number) => {
    remaining.current = stepMs;
    setState((s) => ({ ...s, status: index >= stepCount - 1 ? "done" : "paused", index }));
  }, [stepCount, stepMs]);

  const reset = useCallback(() => setState((s) => ({ status: "idle", index: -1, run: s.run })), []);

  return { status: state.status, index: state.index, run: state.run, start, pause, resume, seek, reset };
}

export type Playback = ReturnType<typeof usePlayback>;
