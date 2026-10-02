import { distance } from "@/lib/hnsw/distance";
import { searchLayer } from "@/lib/hnsw/layerSearch";
import type { HnswGraph, QueryVector, VectorNode } from "@/lib/hnsw/types";

export { distance };

// The fixed demo dataset: 48 two-dimensional "embeddings" in five loose
// clusters, generated from a seeded random sequence so every visit draws
// and searches exactly the same graph.
const COUNT = 48;
const CENTERS: [number, number][] = [[22, 26], [74, 22], [50, 52], [20, 78], [78, 76]];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function buildNodes(): VectorNode[] {
  const rand = mulberry32(7);
  const nodes: VectorNode[] = [];
  for (let i = 0; i < COUNT; i++) {
    const [cx, cy] = CENTERS[i % CENTERS.length];
    const x = Math.min(96, Math.max(4, cx + (rand() - 0.5) * 30));
    const y = Math.min(96, Math.max(4, cy + (rand() - 0.5) * 30));
    // Level assignment as in HNSW: each layer up holds roughly a quarter of the one below.
    const r = rand();
    const level = r < 0.06 ? 2 : r < 0.3 ? 1 : 0;
    nodes.push({ id: `v${i + 1}`, x: round1(x), y: round1(y), level });
  }
  return nodes;
}

// HNSW construction: vectors are inserted one at a time. Each new vector
// searches the graph built so far (with a candidate list of EF_CONSTRUCTION)
// and links to the M nearest it finds on every layer it belongs to; a node
// with too many links keeps only its nearest. Early insertions find few
// neighbors nearby, which is what gives the graph its long-range links.
const M = [3, 2, 2];
const M_MAX = [8, 4, 4];
const EF_CONSTRUCTION = 6;

export function buildGraph(): HnswGraph {
  const nodes = buildNodes();
  const topLayer = Math.max(...nodes.map((n) => n.level));
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const neighbors: Record<string, string[]>[] = Array.from({ length: topLayer + 1 }, () => ({}));
  let entryPoint = nodes[0].id;
  let entryLevel = nodes[0].level;
  for (let layer = 0; layer <= entryLevel; layer++) neighbors[layer][entryPoint] = [];

  for (const node of nodes.slice(1)) {
    let entry = { id: entryPoint, distance: distance(node, pos.get(entryPoint)!) };
    for (let layer = entryLevel; layer > node.level; layer--) entry = searchLayer(neighbors[layer], pos, node, entry, 1, layer)[0];
    for (let layer = Math.min(node.level, entryLevel); layer >= 0; layer--) {
      const found = searchLayer(neighbors[layer], pos, node, entry, EF_CONSTRUCTION, layer);
      const chosen = found.slice(0, M[layer]).map((n) => n.id);
      neighbors[layer][node.id] = chosen;
      for (const other of chosen) {
        const list = [...neighbors[layer][other], node.id];
        neighbors[layer][other] = list.length <= M_MAX[layer] ? list
          : list.sort((a, b) => distance(pos.get(other)!, pos.get(a)!) - distance(pos.get(other)!, pos.get(b)!)).slice(0, M_MAX[layer]);
      }
      entry = found[0];
    }
    for (let layer = entryLevel + 1; layer <= node.level; layer++) neighbors[layer][node.id] = [];
    if (node.level > entryLevel) {
      entryPoint = node.id;
      entryLevel = node.level;
    }
  }
  for (const layer of neighbors) for (const id of Object.keys(layer)) layer[id] = [...layer[id]].sort();
  return { nodes, neighbors, entryPoint, topLayer };
}

export const GRAPH: HnswGraph = buildGraph();

export const QUERIES: QueryVector[] = [
  { id: "q1", label: "Query A", x: 46, y: 70 },
  { id: "q2", label: "Query B", x: 86, y: 44 },
  { id: "q3", label: "Query C", x: 12, y: 50 },
];

export const K = 5;
export const EF_MIN = K;
export const EF_MAX = 32;
export const EF_DEFAULT = 5;
