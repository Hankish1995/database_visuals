import { distance } from "@/lib/hnsw/distance";
import type { Neighbor, TraceEvent, VectorNode } from "@/lib/hnsw/types";

export const byDistance = (a: Neighbor, b: Neighbor) => a.distance - b.distance || a.id.localeCompare(b.id);

/**
 * HNSW's SEARCH-LAYER: a best-first walk over one layer's links, keeping the
 * `ef` closest vectors found so far. It stops when the nearest unexplored
 * candidate is farther than the farthest kept one. Used both to build the
 * graph and to answer queries; `trace` (when given) records every step.
 */
export function searchLayer(
  links: Record<string, string[]>, pos: Map<string, VectorNode>, q: { x: number; y: number },
  entry: Neighbor, ef: number, layer: number, trace?: TraceEvent[], seen?: Set<string>,
): Neighbor[] {
  const visited = new Set([entry.id]);
  const candidates: Neighbor[] = [entry];
  let best: Neighbor[] = [entry];
  let stopped = false;

  while (candidates.length > 0) {
    candidates.sort(byDistance);
    const current = candidates.shift()!;
    if (current.distance > best[best.length - 1].distance) {
      trace?.push({ kind: "stop", layer, reason: "farther", node: current.id });
      stopped = true;
      break;
    }
    trace?.push({ kind: "expand", layer, node: current.id, distance: current.distance });
    for (const id of links[current.id] ?? []) {
      if (visited.has(id)) continue;
      visited.add(id);
      seen?.add(id);
      const d = distance(q, pos.get(id)!);
      const kept = best.length < ef || d < best[best.length - 1].distance;
      if (!kept) {
        trace?.push({ kind: "visit", layer, node: id, from: current.id, distance: d, kept });
        continue;
      }
      candidates.push({ id, distance: d });
      const grown = [...best, { id, distance: d }].sort(byDistance);
      best = grown.slice(0, ef);
      // A full list drops its farthest member to make room.
      const evicted = grown.length > ef ? grown[ef].id : undefined;
      trace?.push({ kind: "visit", layer, node: id, from: current.id, distance: d, kept, evicted });
    }
  }
  if (!stopped) trace?.push({ kind: "stop", layer, reason: "exhausted" });
  return best;
}
