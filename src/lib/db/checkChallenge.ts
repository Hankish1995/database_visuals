import type { Challenge } from "@/content/challenges";
import { openSeeded, type SeedSpec } from "@/lib/db/openSeeded";
import { formatCell, runScript } from "@/lib/db/runScript";
import type { StatementResult } from "@/lib/db/types";
import { findPlanNodes, parsePlan } from "@/lib/plan/parsePlan";

export interface CheckOutcome {
  passed: boolean;
  message: string;
  /** Everything the learner's SQL produced (and the probe, when there is one). */
  results: StatementResult[];
  got?: StatementResult;
  expected?: StatementResult;
}

async function runFresh(seed: SeedSpec, script: string, probe?: string) {
  const db = await openSeeded(seed);
  try {
    const results = await runScript(db, script);
    const failed = results.find((r) => r.error);
    if (failed || !probe) return { results, failed };
    const probed = await runScript(db, probe);
    return { results: [...results, ...probed], failed: probed.find((r) => r.error), probeFailed: probed.some((r) => r.error) };
  } finally {
    await db.close();
  }
}

const lastQuery = (results: StatementResult[]) => [...results].reverse().find((r) => r.columns.length > 0);
// Numbers compare by value, so 178.00 and 178 match.
const norm = (v: unknown) => { const s = formatCell(v); return /^-?\d+(\.\d+)?$/.test(s) ? String(Number(s)) : s; };
const rowKeys = (r: StatementResult) => r.rows.map((row) => Object.values(row).map(norm).join("\u0001"));

export async function checkChallenge(challenge: Challenge, sql: string, seed: SeedSpec): Promise<CheckOutcome> {
  if (!sql.trim()) return { passed: false, message: "Write some SQL first.", results: [] };
  const { check } = challenge;
  const probe = check.kind === "result" ? check.probe : `EXPLAIN (FORMAT JSON) ${check.query}`;
  const mine = await runFresh(seed, sql, probe);
  if (mine.failed) {
    const where = "probeFailed" in mine && mine.probeFailed ? "Your SQL ran, but checking it failed" : "Your SQL failed";
    return { passed: false, message: `${where}: ${mine.failed.error!.message}`, results: mine.results };
  }
  const got = lastQuery(mine.results);
  if (!got) return { passed: false, message: "Your SQL didn't return any rows to check. End with a SELECT.", results: mine.results };

  if (check.kind === "uses-index") {
    const plan = parsePlan(got.rows[0]["QUERY PLAN"]);
    const seq = findPlanNodes(plan, (n) => n.type === "Seq Scan" && n.relation === check.table);
    const indexed = findPlanNodes(plan, (n) => Boolean(n.index));
    const passed = seq.length === 0 && indexed.length > 0;
    return {
      passed, results: mine.results, got,
      message: passed ? `Solved: the plan uses ${indexed[0].index}.` : `The plan still reads ${check.table} with a Seq Scan. Try a different index.`,
    };
  }

  const reference = await runFresh(seed, challenge.solution, check.probe);
  const expected = lastQuery(reference.results)!;
  const [a, b] = [rowKeys(got), rowKeys(expected)];
  if (got.columns.length !== expected.columns.length) {
    return { passed: false, message: `Expected ${expected.columns.length} column(s), got ${got.columns.length}.`, results: mine.results, got, expected };
  }
  if (a.length !== b.length) {
    return { passed: false, message: `Expected ${b.length} row(s), got ${a.length}.`, results: mine.results, got, expected };
  }
  const same = check.ordered ? a.every((k, i) => k === b[i]) : [...a].sort().join("\n") === [...b].sort().join("\n");
  const message = same ? "Solved! Your result matches." : check.ordered && [...a].sort().join("\n") === [...b].sort().join("\n")
    ? "Right rows, wrong order." : "Some values don't match the expected result.";
  return { passed: same, message, results: mine.results, got, expected };
}
