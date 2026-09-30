import type { PlanNode } from "@/lib/plan/parsePlan";

interface Props { node: PlanNode; heat: number; selected: boolean; onSelect?: () => void; compact?: boolean }

const fmt = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n % 1 ? n.toFixed(1) : String(n));

function title(node: PlanNode): string {
  const on = node.relation ? ` on ${node.relation}${node.alias && node.alias !== node.relation ? ` ${node.alias}` : ""}` : "";
  const using = node.index ? ` using ${node.index}` : "";
  const join = node.joinType && node.joinType !== "Inner" ? ` (${node.joinType})` : "";
  return `${node.type}${node.direction ? " Backward" : ""}${join}${using}${on}`;
}

// One plan node. `heat` (0-1) is its share of the total time, drawn as a bar
// and spelled out, so the slow part stands out without relying on colour.
export function PlanNodeCard({ node, heat, selected, onSelect, compact }: Props) {
  const scan = /Scan/.test(node.type);
  const tone = node.index ? "border-index/40" : node.type === "Seq Scan" ? "border-miss-line" : scan ? "border-flow-bright/40" : "border-line";
  const misestimate = node.actualRows !== null && node.estRows > 0 && (node.actualRows / node.estRows > 10 || node.estRows / Math.max(node.actualRows, 1) > 10);
  return (
    <button type="button" onClick={onSelect} aria-pressed={onSelect ? selected : undefined} disabled={!onSelect}
      className={`block w-full min-w-0 rounded-lg border bg-surface px-3 py-2 text-left shadow-sm transition-colors disabled:cursor-default ${tone} ${selected ? "ring-2 ring-accent" : onSelect ? "hover:border-accent/50" : ""}`}>
      <p className="truncate text-[13px] font-semibold text-ink" title={title(node)}>{title(node)}</p>
      <p className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
        <span>est. {fmt(node.estRows)} rows</span>
        {node.actualRows !== null && <span className={misestimate ? "font-semibold text-miss" : ""}>actual {fmt(node.actualRows)}{node.loops && node.loops > 1 ? ` × ${node.loops} loops` : ""}{misestimate ? " (misestimate)" : ""}</span>}
        {node.selfMs !== null && <span>{node.selfMs.toFixed(2)} ms self</span>}
        {!compact && <span>cost {node.estCost.toFixed(1)}</span>}
      </p>
      {!compact && node.details.slice(0, 2).map(([k, v]) => <p key={k} className="truncate font-mono text-[11px] text-ink-soft" title={v}>{k}: {v}</p>)}
      {node.selfMs !== null && (
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line" aria-label={`${Math.round(heat * 100)}% of execution time`}>
          <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(2, heat * 100)}%` }} />
        </span>
      )}
    </button>
  );
}
