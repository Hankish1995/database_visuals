"use client";

import { useCallback, useState } from "react";
import type { Database } from "@/hooks/useDatabase";
import { splitSql } from "@/lib/db/splitSql";
import type { StatementResult } from "@/lib/db/types";

/** Runs a script on a page's database and keeps the latest results. */
export function useSqlRunner(db: Database) {
  const [results, setResults] = useState<StatementResult[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [running, setRunning] = useState(false);
  const { run: runDb } = db;

  const run = useCallback(async (sql: string, continueOnError: boolean) => {
    const total = splitSql(sql).length;
    if (total === 0) { setResults([]); setSkipped(0); return []; }
    setRunning(true);
    try {
      const res = await runDb(sql, { continueOnError });
      setResults(res);
      setSkipped(total - res.length);
      return res;
    } finally {
      setRunning(false);
    }
  }, [runDb]);

  return { results, skipped, running, run, clear: () => setResults(null) };
}
