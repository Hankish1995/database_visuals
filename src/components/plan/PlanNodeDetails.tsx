import { planNodeInfo } from "@/content/planNodes";
import type { PlanNode } from "@/lib/plan/parsePlan";

/** Everything about one plan node, plus what that kind of node does. */
export function PlanNodeDetails({ node }: { node: PlanNode }) {
  const rows: [string, string][] = [
    ["Estimated rows", String(node.estRows)],
    ...(node.actualRows !== null ? [["Actual rows", `${node.actualRows}${node.loops && node.loops > 1 ? ` per loop × ${node.loops}` : ""}`] as [string, string]] : []),
    ["Estimated cost", node.estCost.toFixed(2)],
    ...(node.totalMs !== null ? [["Time (incl. inputs)", `${node.totalMs.toFixed(3)} ms`] as [string, string]] : []),
    ...(node.selfMs !== null ? [["Time (this node)", `${node.selfMs.toFixed(3)} ms`] as [string, string]] : []),
    ...(node.sharedHit !== null ? [["Pages from buffer pool", String(node.sharedHit)] as [string, string]] : []),
    ...(node.sharedRead !== null ? [["Pages read in", String(node.sharedRead)] as [string, string]] : []),
    ...node.details,
  ];
  return (
    <div className="space-y-3 text-sm">
      <div>
        <h3 className="font-semibold text-ink">{node.type}</h3>
        <p className="mt-1 leading-relaxed text-ink-soft">{planNodeInfo(node.type)}</p>
      </div>
      <dl className="divide-y divide-line rounded-lg border border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-3 py-1.5">
            <dt className="shrink-0 text-muted">{k}</dt>
            <dd className="min-w-0 text-right font-mono text-xs break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
