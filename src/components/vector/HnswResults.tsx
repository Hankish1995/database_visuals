import type { HnswDemo } from "@/hooks/useHnswDemo";
import type { Neighbor } from "@/lib/hnsw/types";

const fmt = (d: number) => d.toFixed(2);

function List({ title, rows, other, kind }: { title: string; rows: Neighbor[]; other: Set<string> | null; kind: "approx" | "exact" }) {
  return (
    <div className="min-w-0">
      <h4 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h4>
      <ol className="divide-y divide-line rounded-lg border border-line bg-surface text-sm">
        {rows.map((n, i) => {
          const miss = other !== null && !other.has(n.id);
          return (
            <li key={n.id} className={`flex items-center gap-2 px-2.5 py-1.5 ${miss ? (kind === "exact" ? "bg-miss-soft" : "bg-subtle") : ""}`}>
              <span className="w-4 text-xs text-muted tabular-nums">{i + 1}</span>
              <span className="font-mono font-semibold text-ink">{n.id}</span>
              <span className="ml-auto font-mono text-xs text-ink-soft tabular-nums">{fmt(n.distance)}</span>
              {miss && <span className={`text-[11px] font-semibold ${kind === "exact" ? "text-miss" : "text-muted"}`}>{kind === "exact" ? "missed" : "not top 5"}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// The neighbours returned, the exact answer beside them in compare mode, and
// illustrative effort/recall numbers for this 48-vector demo.
export function HnswResults({ demo }: { demo: HnswDemo }) {
  const { frame, result, exact, compare, k } = demo;
  const total = demo.graph.nodes.length;
  const compared = new Set(frame.layers.flatMap((l) => [...l.visited])).size;
  const share = compared / total;
  const showExact = compare === "exact" && frame.done;
  const exactIds = new Set(exact.map((n) => n.id));
  const approxIds = new Set(result.results.map((n) => n.id));

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Candidate list (ef_search)", String(Math.max(result.efSearch, k))],
          ["Vectors compared", demo.playback.status === "idle" ? "—" : `${compared} of ${total}`],
          ["Recall@5 vs exact", frame.done ? `${Math.round(demo.recall * 100)}%` : "—"],
          ["Relative work", demo.playback.status === "idle" ? "—" : `${Math.round(share * 100)}% of a full scan`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{label}</dt>
            <dd className="font-mono text-base font-bold text-ink tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${demo.playback.status === "idle" ? 0 : share * 100}%` }} />
      </div>
      {frame.done ? (
        <div className={`grid gap-3 ${showExact ? "sm:grid-cols-2" : ""}`}>
          <List title={`HNSW returned (k = ${k})`} rows={result.results} other={showExact ? exactIds : null} kind="approx" />
          {showExact && <List title="Exact nearest (every distance computed)" rows={exact} other={approxIds} kind="exact" />}
        </div>
      ) : (
        <p className="text-sm text-muted">{demo.playback.status === "idle" ? "Run the search to see the nearest neighbours it returns." : "Searching… the results appear when it stops."}</p>
      )}
      <p className="text-[11px] leading-relaxed text-muted">
        Illustrative counts from a 48-vector teaching graph, not a PostgreSQL benchmark. Real latency depends on the data, the index settings, the pgvector version and the hardware; it does not grow exactly in step with these counts.
      </p>
    </div>
  );
}
