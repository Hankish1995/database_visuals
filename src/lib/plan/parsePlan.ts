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
  details: [string, string][];
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

const DETAIL_KEYS: [string, string][] = [
  ["Index Cond", "Index condition"], ["Recheck Cond", "Recheck"], ["Filter", "Filter"], ["Rows Removed by Filter", "Rows removed by filter"],
  ["Hash Cond", "Hash condition"], ["Merge Cond", "Merge condition"], ["Join Filter", "Join filter"], ["Sort Key", "Sort key"],
  ["Sort Method", "Sort method"], ["Group Key", "Group key"], ["Heap Fetches", "Heap fetches"], ["Heap Blocks Exact", "Heap blocks"],
  ["Presorted Key", "Presorted key"], ["Subplan Name", "Subplan"], ["CTE Name", "CTE"], ["Function Name", "Function"],
];

function toNode(raw: Raw, path: string): PlanNode {
  const loops = num(raw["Actual Loops"]);
  const perLoop = num(raw["Actual Total Time"]);
  const children = ((raw.Plans as Raw[] | undefined) ?? []).map((c, i) => toNode(c, `${path}.${i}`));
  const totalMs = perLoop !== null && loops !== null ? perLoop * loops : null;
  const childMs = children.reduce((s, c) => s + (c.totalMs ?? 0), 0);
  const details = DETAIL_KEYS.flatMap(([key, label]) => {
    const v = raw[key];
    if (v === undefined || v === null || v === 0) return [];
    return [[label, Array.isArray(v) ? v.join(", ") : String(v)] as [string, string]];
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
