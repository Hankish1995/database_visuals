import { useMessages } from "@/i18n";
import { nodeState, type LayerFrame } from "@/lib/hnsw/frame";
import type { HnswGraph, Neighbor, QueryVector } from "@/lib/hnsw/types";

// One HNSW layer, drawn in 2D (no WebGL needed). Node states differ in shape
// as well as colour: hollow = not looked at, grey dot = distance computed and
// dropped, blue disc = in the candidate list, cyan ring = being explored,
// green square = returned, purple diamond = true nearest (compare mode).
export function LayerPanel({ graph, layer, frame, query, results, exact, showExact, active, done }: {
  graph: HnswGraph; layer: number; frame: LayerFrame; query: QueryVector;
  results: Neighbor[]; exact: Neighbor[]; showExact: boolean; active: boolean; done: boolean;
}) {
  const m = useMessages().vector;
  const nodes = graph.nodes.filter((n) => n.level >= layer);
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const links = graph.neighbors[layer];
  const rank = new Map((layer === 0 && done ? results : []).map((n, i) => [n.id, i + 1]));
  const exactIds = new Set(layer === 0 && showExact ? exact.map((n) => n.id) : []);
  const drawn = new Set<string>();
  // Upper layers are drawn in smaller panels: larger labels keep them readable.
  const t = layer === 0 ? 1 : 1.45;
  const summary = m.layerSummary(layer, nodes.length, frame.visited.size, frame.kept.size, frame.current);

  return (
    <figure className={`rounded-lg border bg-surface p-2 ${active ? "border-accent/60 ring-1 ring-accent/30" : "border-line"}`}>
      <figcaption className="flex items-baseline justify-between px-1 text-xs">
        <span className="font-semibold text-ink">{m.layer(layer)}</span>
        <span className="text-muted">{m.vectors(nodes.length)}{layer === graph.topLayer ? m.entryTag : layer === 0 ? m.allTag : ""}</span>
      </figcaption>
      <svg viewBox="0 0 100 100" role="img" aria-label={summary} className="mt-1 aspect-square w-full">
        {nodes.flatMap((n) => (links[n.id] ?? []).map((to) => {
          const key = [n.id, to].sort().join("-");
          if (drawn.has(key)) return null;
          drawn.add(key);
          const o = pos.get(to)!;
          return <line key={key} x1={n.x} y1={n.y} x2={o.x} y2={o.y} stroke="var(--color-line)" strokeWidth={0.35} />;
        }))}
        {frame.edges.map(([from, to]) => {
          const a = pos.get(from)!, b = pos.get(to)!;
          return <line key={`${from}>${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-accent)" strokeWidth={0.6} strokeOpacity={0.7} />;
        })}
        <g aria-hidden>
          <circle cx={query.x} cy={query.y} r={2.6} fill="none" stroke="var(--color-miss)" strokeWidth={0.6} />
          <path d={`M${query.x - 3.6} ${query.y}h7.2M${query.x} ${query.y - 3.6}v7.2`} stroke="var(--color-miss)" strokeWidth={0.6} />
          <text x={query.x + 3.4} y={query.y - 3} fontSize={3.4 * t} fontWeight={700} fill="var(--color-miss)">{m.queryMark}</text>
        </g>
        {nodes.map((n) => {
          const state = nodeState(frame, n.id);
          const r = rank.get(n.id);
          const isExact = exactIds.has(n.id);
          return (
            <g key={n.id}>
              <title>{m.nodeTitle(n.id, m.nodeState[state], r, isExact)}</title>
              {isExact && (
                <path d={`M${n.x} ${n.y - 4}l4 4-4 4-4-4z`} fill="none" strokeWidth={0.6}
                  stroke={r ? "var(--color-index)" : "var(--color-miss)"} strokeDasharray={r ? undefined : "1.2 0.8"} />
              )}
              {r ? (
                <rect x={n.x - 2} y={n.y - 2} width={4} height={4} rx={0.6} fill="var(--color-ok)" />
              ) : state === "current" ? (
                <circle cx={n.x} cy={n.y} r={2.4} fill="var(--color-accent)" stroke="var(--color-flow-bright)" strokeWidth={1} />
              ) : state === "candidate" ? (
                <circle cx={n.x} cy={n.y} r={1.9} fill="var(--color-accent)" />
              ) : state === "visited" ? (
                <circle cx={n.x} cy={n.y} r={1.3} fill="var(--color-muted)" fillOpacity={0.55} />
              ) : (
                <circle cx={n.x} cy={n.y} r={1.3} fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth={0.45} />
              )}
              {r && <text x={n.x} y={n.y + 1.1} textAnchor="middle" fontSize={2.8} fontWeight={700} fill="white">{r}</text>}
              {(layer > 0 || r || state === "current" || (isExact && !r)) && (
                <text x={n.x + 2.6 * t} y={n.y + 3.6 * t} fontSize={2.6 * t} fill="var(--color-ink-soft)">{n.id}</text>
              )}
              {frame.entry === n.id && (
                <text x={n.x - 2} y={n.y - 3} textAnchor="end" fontSize={2.6 * t} fontWeight={700} fill="var(--color-flow)">{m.entryMark}</text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
