// A simplified, deterministic model of an HNSW vector index, for teaching.
// Vectors here are 2-dimensional so they can be drawn; real embeddings have
// hundreds or thousands of dimensions, but the search works the same way.

export interface VectorNode {
  id: string;
  x: number;
  y: number;
  /** Highest layer this vector appears on (it is also on every layer below). */
  level: number;
}

export interface HnswGraph {
  nodes: VectorNode[];
  /** neighbors[layer][nodeId] = the node ids it links to on that layer. */
  neighbors: Record<string, string[]>[];
  entryPoint: string;
  topLayer: number;
}

export interface QueryVector {
  id: string;
  label: string;
  x: number;
  y: number;
}

/** One thing the search does, in order -- what the animation plays back. */
export type TraceEvent =
  | { kind: "enter"; layer: number; node: string; distance: number }
  | { kind: "expand"; layer: number; node: string; distance: number }
  | { kind: "visit"; layer: number; node: string; from: string; distance: number; kept: boolean; evicted?: string }
  | { kind: "descend"; fromLayer: number; toLayer: number; node: string; distance: number }
  | { kind: "stop"; layer: number; reason: string }
  | { kind: "done" };

export interface Neighbor {
  id: string;
  distance: number;
}

export interface SearchResult {
  efSearch: number;
  k: number;
  trace: TraceEvent[];
  /** The k nearest the HNSW search returned, nearest first. */
  results: Neighbor[];
  /** Distinct vectors whose distance was computed (all layers). */
  visited: number;
}
