"use client";

import { useCallback, useState } from "react";
import type { Database } from "@/hooks/useDatabase";
import { splitSql } from "@/lib/db/splitSql";
import type { StatementResult } from "@/lib/db/types";
import { planFromRows, type ParsedPlan } from "@/lib/plan/parsePlan";

/** Why there's no plan: `message` is PostgreSQL's own error text, when there is one. */
export interface PlanProblem { kind: "empty" | "explain" | "setup" | "failed"; message?: string }
export interface PlanRun { setup: StatementResult[]; explained: StatementResult | null; plan: ParsedPlan | null; problem: PlanProblem | null }

// Runs every statement but the last as-is, then EXPLAINs the last one.
export function usePlanRunner(db: Database) {
  const [result, setResult] = useState<PlanRun | null>(null);
  const [running, setRunning] = useState(false);
  const { run: runDb } = db;

  const run = useCallback(async (sql: string, analyze: boolean) => {
    const statements = splitSql(sql);
    const target = statements.at(-1);
    if (!target) return setResult({ setup: [], explained: null, plan: null, problem: { kind: "empty" } });
    if (/^\s*explain\b/i.test(target)) return setResult({ setup: [], explained: null, plan: null, problem: { kind: "explain" } });
    setRunning(true);
    try {
      const before = statements.slice(0, -1).join(";\n");
      const setup = before ? await runDb(before) : [];
      const failed = setup.find((r) => r.error);
      if (failed) return setResult({ setup, explained: null, plan: null, problem: { kind: "setup", message: failed.error!.message } });
      const options = analyze ? "ANALYZE, BUFFERS, FORMAT JSON" : "FORMAT JSON";
      const [explained] = await runDb(`EXPLAIN (${options}) ${target}`);
      const plan = explained.error ? null : planFromRows(explained.rows);
      const problem: PlanProblem | null = explained.error ? { kind: "failed", message: explained.error.message } : null;
      setResult({ setup, explained, plan, problem });
    } finally {
      setRunning(false);
    }
  }, [runDb]);

  return { result, running, run };
}
