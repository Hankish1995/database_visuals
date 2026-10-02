// Turns PostgreSQL's EXPLAIN (FORMAT JSON) output into a typed tree.

export interface PlanNode {
  id: string;
  type: string;
  relation?: string;
  alias?: string;
  index?: string;
  direction?: string;
  joinType?: string;
  strategy?: string;
  estRows: number;
  estCost: number;
  /** null when EXPLAIN ran without ANALYZE. */
  actualRows: number | null;
  loops: number | null;
  /** Total time including children, per loop × loops (ms). */
  totalMs: number | null;
  /** Time spent in this node alone (ms). */
  selfMs: number | null;
  sharedHit: number | null;
  sharedRead: number | null;
  /** Conditions, filters, sort keys... as labelled lines. */
  details: [DetailKey, string][];
  children: PlanNode[];
}

export interface ParsedPlan {
  root: PlanNode;
  planningMs: number | null;
  executionMs: number | null;
  analyzed: boolean;
}

type Raw = Record<string, unknown>;
const num = (v: unknown) => (typeof v === "number" ? v : null);

// EXPLAIN's own keys; the interface labels them in the reader's language.
export const DETAIL_KEYS = [
  "Index Cond", "Recheck Cond", "Filter", "Rows Removed by Filter", "Hash Cond", "Merge Cond", "Join Filter", "Sort Key",
  "Sort Method", "Group Key", "Heap Fetches", "Heap Blocks Exact", "Presorted Key", "Subplan Name", "CTE Name", "Function Name",
] as const;
export type DetailKey = (typeof DETAIL_KEYS)[number];

function toNode(raw: Raw, path: string): PlanNode {
  const loops = num(raw["Actual Loops"]);
  const perLoop = num(raw["Actual Total Time"]);
  const children = ((raw.Plans as Raw[] | undefined) ?? []).map((c, i) => toNode(c, `${path}.${i}`));
  const totalMs = perLoop !== null && loops !== null ? perLoop * loops : null;
  const childMs = children.reduce((s, c) => s + (c.totalMs ?? 0), 0);
  const details = DETAIL_KEYS.flatMap((key) => {
    const v = raw[key];
    if (v === undefined || v === null || v === 0) return [];
    return [[key, Array.isArray(v) ? v.join(", ") : String(v)] as [DetailKey, string]];
  });
  return {
    id: path,
    type: String(raw["Node Type"]),
    relation: raw["Relation Name"] as string | undefined,
    alias: raw.Alias as string | undefined,
    index: raw["Index Name"] as string | undefined,
    direction: raw["Scan Direction"] === "Backward" ? "backward" : undefined,
    joinType: raw["Join Type"] as string | undefined,
    strategy: raw.Strategy as string | undefined,
    estRows: num(raw["Plan Rows"]) ?? 0,
    estCost: num(raw["Total Cost"]) ?? 0,
    actualRows: num(raw["Actual Rows"]),
    loops,
    totalMs,
    selfMs: totalMs === null ? null : Math.max(0, totalMs - childMs),
    sharedHit: num(raw["Shared Hit Blocks"]),
    sharedRead: num(raw["Shared Read Blocks"]),
    details,
    children,
  };
}

/** Accepts the "QUERY PLAN" value (already-parsed JSON, or its text). */
export function parsePlan(value: unknown): ParsedPlan {
  const doc = (typeof value === "string" ? JSON.parse(value) : value) as Raw[];
  const top = doc[0];
  const root = toNode(top.Plan as Raw, "0");
  return { root, planningMs: num(top["Planning Time"]), executionMs: num(top["Execution Time"]), analyzed: root.actualRows !== null };
}

export function findPlanNodes(plan: ParsedPlan, match: (n: PlanNode) => boolean): PlanNode[] {
  const out: PlanNode[] = [];
  const walk = (n: PlanNode) => { if (match(n)) out.push(n); n.children.forEach(walk); };
  walk(plan.root);
  return out;
}

/** Finds the EXPLAIN (FORMAT JSON) result among a script's results, if any. */
export function planFromRows(rows: Record<string, unknown>[]): ParsedPlan | null {
  const value = rows[0]?.["QUERY PLAN"];
  if (value === undefined) return null;
  try { return parsePlan(value); } catch { return null; }
}
