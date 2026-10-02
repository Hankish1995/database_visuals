import { useContent } from "@/content/localized";
import { useMessages } from "@/i18n";
import type { PlanNode } from "@/lib/plan/parsePlan";

/** Everything about one plan node, plus what that kind of node does. */
export function PlanNodeDetails({ node }: { node: PlanNode }) {
  const m = useMessages().plan;
  const info = useContent().planNodeInfo[node.type] ?? m.genericNode;
  const rows: [string, string][] = [
    [m.estimatedRows, String(node.estRows)],
    ...(node.actualRows !== null ? [[m.actualRows, `${node.actualRows}${node.loops && node.loops > 1 ? m.perLoop(node.loops) : ""}`] as [string, string]] : []),
    [m.estimatedCost, node.estCost.toFixed(2)],
    ...(node.totalMs !== null ? [[m.timeTotal, `${node.totalMs.toFixed(3)} ms`] as [string, string]] : []),
    ...(node.selfMs !== null ? [[m.timeSelf, `${node.selfMs.toFixed(3)} ms`] as [string, string]] : []),
    ...(node.sharedHit !== null ? [[m.fromPool, String(node.sharedHit)] as [string, string]] : []),
    ...(node.sharedRead !== null ? [[m.readIn, String(node.sharedRead)] as [string, string]] : []),
    ...node.details.map(([k, v]) => [m.detailLabels[k], v] as [string, string]),
  ];
  return (
    <div className="space-y-3 text-sm">
      <div>
        <h3 className="font-semibold text-ink">{node.type}</h3>
        <p className="mt-1 leading-relaxed text-ink-soft">{info}</p>
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
