"use client";

import { useMemo, useState } from "react";
import { usePlayback } from "@/hooks/usePlayback";
import { EF_DEFAULT, GRAPH, K, QUERIES } from "@/lib/hnsw/dataset";
import { deriveFrame } from "@/lib/hnsw/frame";
import { exactSearch, hnswSearch, recall } from "@/lib/hnsw/search";
import type { VectorConceptId } from "@/content/vectorConcepts";

export type CompareMode = "approx" | "exact";

// Per step of the traversal animation (one link checked = one step).
const STEP_MS = { slow: 420, normal: 240, fast: 120 } as const;

// The HNSW lesson's state: which query, ef_search, and whether the exact
// answer is overlaid. The search and its trace are recomputed from those
// (pure, deterministic); playback walks the trace. Changing a setting while
// a search is shown replays it, like the Query flow lesson's options do.
export function useHnswDemo(speed: keyof typeof STEP_MS, reduceMotion: boolean) {
  const [efSearch, setEfSearch] = useState(EF_DEFAULT);
  const [queryId, setQueryId] = useState(QUERIES[0].id);
  const [compare, setCompare] = useState<CompareMode>("approx");
  const [concept, setConcept] = useState<VectorConceptId>("efSearch");

  const query = QUERIES.find((q) => q.id === queryId) ?? QUERIES[0];
  const result = useMemo(() => hnswSearch(GRAPH, query, efSearch, K), [query, efSearch]);
  const exact = useMemo(() => exactSearch(GRAPH, query, K), [query]);
  const playback = usePlayback(result.trace.length, STEP_MS[speed]);
  const shownIndex = playback.status === "idle" ? -1 : playback.index;
  const frame = useMemo(() => deriveFrame(GRAPH, result, shownIndex), [result, shownIndex]);

  /** Starts the search animation (or, with reduced motion, shows the finished search). */
  function run() {
    if (reduceMotion) playback.seek(Number.MAX_SAFE_INTEGER);
    else playback.start();
  }

  function rerunIfShown() {
    if (playback.status !== "idle") run();
  }

  return {
    graph: GRAPH, queries: QUERIES, k: K, query, result, exact, frame, playback,
    recall: recall(result.results, exact),
    efSearch, setEfSearch: (n: number) => { setEfSearch(n); rerunIfShown(); },
    queryId, setQueryId: (id: string) => { setQueryId(id); rerunIfShown(); },
    compare, setCompare, concept, setConcept, run,
    reset: playback.reset,
  };
}

export type HnswDemo = ReturnType<typeof useHnswDemo>;
