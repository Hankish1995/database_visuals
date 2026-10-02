import { distance } from "@/lib/hnsw/distance";
import { byDistance, searchLayer } from "@/lib/hnsw/layerSearch";
import type { HnswGraph, Neighbor, QueryVector, SearchResult, TraceEvent } from "@/lib/hnsw/types";

// The HNSW search algorithm, recording every step it takes. Upper layers are
// searched greedily (one best candidate) to find a good starting point; the
// bottom layer is searched with a candidate list of size ef_search, and the
// k nearest of those are returned.

export function hnswSearch(graph: HnswGraph, q: QueryVector, efSearch: number, k: number): SearchResult {
  const trace: TraceEvent[] = [];
  const pos = new Map(graph.nodes.map((n) => [n.id, n]));
  const seen = new Set<string>([graph.entryPoint]);
  const entryNode = graph.nodes.find((n) => n.id === graph.entryPoint)!;
  let entry: Neighbor = { id: entryNode.id, distance: distance(q, entryNode) };
  trace.push({ kind: "enter", layer: graph.topLayer, node: entry.id, distance: entry.distance });

  for (let layer = graph.topLayer; layer > 0; layer--) {
    entry = searchLayer(graph.neighbors[layer], pos, q, entry, 1, layer, trace, seen)[0];
    trace.push({ kind: "descend", fromLayer: layer, toLayer: layer - 1, node: entry.id, distance: entry.distance });
  }
  const found = searchLayer(graph.neighbors[0], pos, q, entry, Math.max(efSearch, k), 0, trace, seen);
  trace.push({ kind: "done" });
  return { efSearch, k, trace, results: found.slice(0, k), visited: seen.size };
}

/** The true k nearest: every vector's distance computed and sorted. */
export function exactSearch(graph: HnswGraph, q: QueryVector, k: number): Neighbor[] {
  return graph.nodes.map((n) => ({ id: n.id, distance: distance(q, n) })).sort(byDistance).slice(0, k);
}

/** Share of the exact k nearest that the approximate search returned. */
export function recall(approx: Neighbor[], exact: Neighbor[]): number {
  const found = new Set(approx.map((n) => n.id));
  return exact.filter((n) => found.has(n.id)).length / exact.length;
}
