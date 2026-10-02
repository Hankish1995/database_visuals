import { PlanNodeDetails } from "@/components/plan/PlanNodeDetails";
import { StatementHeader } from "@/components/sql/StatementHeader";
import type { StatementResult } from "@/lib/db/types";
import { useMessages } from "@/i18n";
import { findPlanNodes, type ParsedPlan, type PlanNode } from "@/lib/plan/parsePlan";

interface Props { plan: ParsedPlan | null; node: PlanNode | null; setup: StatementResult[]; className?: string }

/** The selected node explained, plus a one-line verdict on the whole plan. */
export function PlanSidebar({ plan, node, setup, className = "" }: Props) {
  const m = useMessages().plan;
  const slowest = plan?.analyzed ? findPlanNodes(plan, () => true).sort((a, b) => (b.selfMs ?? 0) - (a.selfMs ?? 0))[0] : null;
  const seqScans = plan ? findPlanNodes(plan, (n) => n.type === "Seq Scan") : [];
  return (
    <aside aria-label={m.details} className={`space-y-4 ${className}`}>
      {setup.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold text-ink">{m.ranFirst}</h2>
          {setup.map((r, i) => <StatementHeader key={i} result={r} showSql />)}
        </section>
      )}
      {plan && (
        <section className="space-y-1 text-sm text-ink-soft">
          <h2 className="font-semibold text-ink">{m.summary}</h2>
          {slowest && <p>{m.slowest} <strong className="text-ink">{slowest.type}{slowest.relation ? m.onTable(slowest.relation) : ""}</strong> ({slowest.selfMs?.toFixed(2)} ms).</p>}
          {seqScans.map((s) => <p key={s.id}>{m.readsAll} <strong className="text-ink">{s.relation}</strong> (Seq Scan){s.details.find(([k]) => k === "Filter") ? m.thenFilters : ""}.</p>)}
        </section>
      )}
      {node ? <PlanNodeDetails node={node} /> : <p className="text-sm text-muted">{m.pick}</p>}
    </aside>
  );
}
