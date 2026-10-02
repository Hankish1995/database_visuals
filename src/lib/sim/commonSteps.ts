import type { SimText } from "@/lib/sim/text/en";
import type { ParsedQuery, SimOptions, SimStep, UserRow } from "@/lib/sim/types";

const VERB = { select: "SELECT", insert: "INSERT", update: "UPDATE", delete: "DELETE" } as const;

/** Client -> parser -> planner -> executor: the same shape for every statement. */
export function commonSteps(t: SimText, query: ParsedQuery, options: SimOptions, plan: string[]): SimStep[] {
  const verb = VERB[query.kind];
  return [
    { id: "client", component: "client", ...t.client(verb, query.kind !== "select") },
    { id: "parse", component: "parser", edge: "client-parser", ...t.parse(query) },
    { id: "plan", component: "planner", edge: "parser-planner", ...t.plan(query, verb, options.useIndex, plan) },
    { id: "execute", component: "executor", edge: "planner-executor", ...t.execute(query, options.useIndex) },
  ];
}

export function returnStep(t: SimText, query: ParsedQuery, rows: UserRow[], source: string | null): SimStep {
  return { id: "return", component: "row", edge: "buffer-client", ...t.returnRows(query, rows.length > 0, source) };
}
