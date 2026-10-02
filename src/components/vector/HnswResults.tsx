import type { HnswDemo } from "@/hooks/useHnswDemo";
import { useMessages } from "@/i18n";
import type { Neighbor } from "@/lib/hnsw/types";

const fmt = (d: number) => d.toFixed(2);

function List({ title, rows, other, kind, k }: { title: string; rows: Neighbor[]; other: Set<string> | null; kind: "approx" | "exact"; k: number }) {
  const m = useMessages().vector;
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
              {miss && <span className={`text-[11px] font-semibold ${kind === "exact" ? "text-miss" : "text-muted"}`}>{kind === "exact" ? m.missed : m.notTop(k)}</span>}
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
  const m = useMessages().vector;
  const total = demo.graph.nodes.length;
  const idle = demo.playback.status === "idle";
  const compared = new Set(frame.layers.flatMap((l) => [...l.visited])).size;
  const share = compared / total;
  const showExact = compare === "exact" && frame.done;
  const exactIds = new Set(exact.map((n) => n.id));
  const approxIds = new Set(result.results.map((n) => n.id));

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [m.candidateList, String(Math.max(result.efSearch, k))],
          [m.compared, idle ? "—" : m.ofTotal(compared, total)],
          [m.recall(k), frame.done ? `${Math.round(demo.recall * 100)}%` : "—"],
          [m.work, idle ? "—" : m.workValue(Math.round(share * 100))],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{label}</dt>
            <dd className="font-mono text-base font-bold text-ink tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${idle ? 0 : share * 100}%` }} />
      </div>
      {frame.done ? (
        <div className={`grid gap-3 ${showExact ? "sm:grid-cols-2" : ""}`}>
          <List title={m.returned(k)} rows={result.results} other={showExact ? exactIds : null} kind="approx" k={k} />
          {showExact && <List title={m.exactTitle} rows={exact} other={approxIds} kind="exact" k={k} />}
        </div>
      ) : (
        <p className="text-sm text-muted">{idle ? m.idleResults : m.searching}</p>
      )}
      <p className="text-[11px] leading-relaxed text-muted">
        {m.disclaimer}
      </p>
    </div>
  );
}
