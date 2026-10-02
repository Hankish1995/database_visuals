import type { HnswGraph, SearchResult, TraceEvent } from "@/lib/hnsw/types";

// What the search looks like after its first `index + 1` trace events --
// a pure function of the trace, so the animation can pause, replay or jump.

export type NodeState = "unvisited" | "visited" | "candidate" | "current";

export interface LayerFrame {
  layer: number;
  /** Every vector on this layer whose distance has been computed. */
  visited: Set<string>;
  /** The vectors currently in the candidate list (ef long on layer 0, 1 above). */
  kept: Set<string>;
  current: string | null;
  /** Links the search has followed on this layer, as [from, to]. */
  edges: [string, string][];
  entry: string | null;
}

export interface Frame {
  index: number;
  event: TraceEvent | null;
  activeLayer: number;
  layers: LayerFrame[];
  done: boolean;
}

export function deriveFrame(graph: HnswGraph, result: SearchResult, index: number): Frame {
  const layers: LayerFrame[] = Array.from({ length: graph.topLayer + 1 }, (_, layer) => ({
    layer, visited: new Set<string>(), kept: new Set<string>(), current: null, edges: [], entry: null,
  }));
  const last = Math.min(index, result.trace.length - 1);
  let activeLayer = graph.topLayer;
  for (let i = 0; i <= last; i++) {
    const e = result.trace[i];
    if (e.kind === "enter") {
      const l = layers[e.layer];
      l.entry = e.node; l.visited.add(e.node); l.kept.add(e.node);
    } else if (e.kind === "expand") {
      layers[e.layer].current = e.node;
      activeLayer = e.layer;
    } else if (e.kind === "visit") {
      const l = layers[e.layer];
      l.visited.add(e.node);
      l.edges.push([e.from, e.node]);
      if (e.kept) l.kept.add(e.node);
      if (e.evicted) l.kept.delete(e.evicted);
    } else if (e.kind === "descend") {
      layers[e.fromLayer].current = null;
      const below = layers[e.toLayer];
      below.entry = e.node; below.visited.add(e.node); below.kept.add(e.node);
      activeLayer = e.toLayer;
    } else if (e.kind === "stop") {
      layers[e.layer].current = null;
    }
  }
  return { index: last, event: last >= 0 ? result.trace[last] : null, activeLayer, layers, done: last === result.trace.length - 1 };
}

export function nodeState(frame: LayerFrame, id: string): NodeState {
  if (frame.current === id) return "current";
  if (frame.kept.has(id)) return "candidate";
  if (frame.visited.has(id)) return "visited";
  return "unvisited";
}

const fmt = (d: number) => d.toFixed(1);

/** One plain-language sentence for the step the animation is on. */
export function describe(event: TraceEvent | null, efSearch: number, k: number): string {
  if (!event) return "Press Run search to start at the entry point on the top layer.";
  switch (event.kind) {
    case "enter": return `Start at the entry point ${event.node} on layer ${event.layer} (distance ${fmt(event.distance)}).`;
    case "expand": return event.layer > 0
      ? `Layer ${event.layer}: check the links of ${event.node}, looking for anything closer (greedy, one best candidate).`
      : `Layer 0: explore the links of ${event.node}, the nearest unexplored candidate (distance ${fmt(event.distance)}).`;
    case "visit": return event.kept
      ? `${event.node} is ${fmt(event.distance)} away -- close enough to join the candidate list${event.evicted ? `, which pushes out ${event.evicted}` : ""}.`
      : `${event.node} is ${fmt(event.distance)} away -- not closer than the candidates already kept, so it is dropped.`;
    case "descend": return `Nothing closer on layer ${event.fromLayer}. Drop to layer ${event.toLayer}, starting from ${event.node}.`;
    case "stop": return event.layer > 0 ? `Layer ${event.layer} is done: ${event.reason}.` : `Layer 0 stops: ${event.reason}. The list held up to ${efSearch} candidates.`;
    case "done": return `Return the ${k} nearest of the candidates found.`;
  }
}
