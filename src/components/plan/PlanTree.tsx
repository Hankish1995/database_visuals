import { PlanNodeCard } from "@/components/plan/PlanNodeCard";
import type { ParsedPlan, PlanNode } from "@/lib/plan/parsePlan";

interface Props {
  plan: ParsedPlan;
  selectedId?: string | null;
  onSelect?: (node: PlanNode) => void;
  compact?: boolean;
}

// The plan as an indented tree: each node's inputs are nested under it.
// Rows flow upward, from the leaves to the root.
export function PlanTree({ plan, selectedId, onSelect, compact }: Props) {
  const total = plan.root.totalMs || 1;
  const render = (node: PlanNode, depth: number) => (
    <li key={node.id} className={depth ? "relative pl-5 before:absolute before:top-0 before:left-2 before:h-5 before:w-3 before:rounded-bl-md before:border-b before:border-l before:border-line-strong" : ""}>
      <PlanNodeCard node={node} heat={(node.selfMs ?? 0) / total} selected={selectedId === node.id} compact={compact}
        onSelect={onSelect ? () => onSelect(node) : undefined} />
      {node.children.length > 0 && <ul className="mt-1.5 space-y-1.5 border-l border-transparent">{node.children.map((c) => render(c, depth + 1))}</ul>}
    </li>
  );
  return (
    <div>
      <ul aria-label="Query plan" className="space-y-1.5">{render(plan.root, 0)}</ul>
      {(plan.planningMs !== null || plan.executionMs !== null) && (
        <p className="mt-2 text-xs text-muted">
          {plan.planningMs !== null && <>Planning {plan.planningMs.toFixed(2)} ms</>}
          {plan.executionMs !== null && <> · Execution {plan.executionMs.toFixed(2)} ms</>}
          {!plan.analyzed && "Estimates only (EXPLAIN without ANALYZE): the query was not run."}
        </p>
      )}
    </div>
  );
}
