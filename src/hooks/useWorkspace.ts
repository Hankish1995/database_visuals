"use client";

import { useMemo, useState } from "react";
import { DEFAULT_LESSON_ID, findLesson } from "@/content/lessons";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePlayback } from "@/hooks/usePlayback";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { buildSimulation } from "@/lib/sim/buildSimulation";
import { deriveScene } from "@/lib/sim/sceneState";
import { DEFAULT_SQL, parseQuery } from "@/lib/sim/sql";
import type { ConceptId, ParsedQuery, SimOptions } from "@/lib/sim/types";

export type Speed = "slow" | "normal" | "fast";
export type MotionPref = "system" | "reduce";
export type ViewMode = "3d" | "2d";
export interface Settings { speed: Speed; motion: MotionPref }

const STEP_MS: Record<Speed, number> = { slow: 5600, normal: 4000, fast: 2600 };
const DEFAULT_QUERY = (parseQuery(DEFAULT_SQL) as { ok: true; query: ParsedQuery }).query;

// All workspace state in one place. The simulation is rebuilt from the
// last valid query + options; the scene is derived from it and playback.
export function useWorkspace() {
  const [lessonId, setLessonId] = useState(DEFAULT_LESSON_ID);
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ParsedQuery>(DEFAULT_QUERY);
  const [options, setOptions] = useState<SimOptions>({ useIndex: true, cache: "miss" });
  const [pinned, setPinned] = useState<ConceptId | null>(null);
  const [settings, setSettings] = useState<Settings>({ speed: "normal", motion: "system" });
  const [chosenView, setChosenView] = useState<ViewMode | null>(null);
  const [cameraReset, setCameraReset] = useState(0);

  const sim = useMemo(() => buildSimulation(query, options), [query, options]);
  const playback = usePlayback(sim.steps.length, STEP_MS[settings.speed]);
  const scene = useMemo(() => deriveScene(sim, playback.index, playback.status), [sim, playback.index, playback.status]);
  const lesson = findLesson(lessonId);

  const systemReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const wide = useMediaQuery("(min-width: 768px)", true);
  const webgl = useWebGLSupport();
  const view: ViewMode = webgl === false ? "2d" : chosenView ?? (wide ? "3d" : "2d");

  /** Runs the editor's statement, or `text` (which also replaces the editor's contents). */
  function run(text?: string) {
    if (text !== undefined) setSql(text);
    const parsed = parseQuery(text ?? sql);
    if (!parsed.ok) return setError(parsed.error);
    setError(null);
    setQuery(parsed.query);
    setPinned(lesson.kind === "focus" ? lesson.focus ?? null : null);
    playback.start();
  }

  function editSql(next: string) {
    setSql(next);
    setError(null);
    const parsed = parseQuery(next);
    if (parsed.ok) setQuery(parsed.query);
    if (playback.status !== "idle") playback.reset();
  }

  /** Changing the index or cache mode replays the current run so the two paths can be compared. */
  function changeOptions(change: Partial<SimOptions>) {
    setOptions((o) => ({ ...o, ...change }));
    if (playback.status !== "idle") playback.start();
  }

  function chooseLesson(id: string) {
    const next = findLesson(id);
    setLessonId(id);
    setPinned(next.focus ?? null);
    if (next.preset) setOptions((o) => ({ ...o, ...next.preset }));
    playback.reset();
  }

  return {
    lesson, chooseLesson, sql, editSql, setSql, error, run, options, changeOptions, sim, scene, playback,
    inspected: (lesson.kind === "lab" && lesson.concept) || pinned || scene.active || (scene.status === "done" ? "row" : "client") as ConceptId,
    pinned, select: setPinned, settings, setSettings,
    reduceMotion: settings.motion === "reduce" || systemReduced,
    view, setView: setChosenView, webgl, cameraReset, resetCamera: () => setCameraReset((n) => n + 1),
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
