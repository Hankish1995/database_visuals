"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";
import { openSeeded, type SeedSpec } from "@/lib/db/openSeeded";
import { runScript, type RunOptions } from "@/lib/db/runScript";
import type { StatementResult } from "@/lib/db/types";

export type DbStatus = "loading" | "ready" | "error";

// One in-browser PostgreSQL for a page. Queries run one at a time, in order;
// `version` bumps after every run or reset so views (like the schema browser)
// know to re-read the catalog.
export function useDatabase(spec: SeedSpec) {
  const [status, setStatus] = useState<DbStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const dbRef = useRef<PGlite | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const specRef = useRef(spec);

  const open = useCallback(async () => {
    setStatus("loading");
    setError(null);
    const old = dbRef.current;
    dbRef.current = null;
    await old?.close().catch(() => {});
    try {
      dbRef.current = await openSeeded(specRef.current);
      setStatus("ready");
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Opening is async; the state updates happen after awaits, not synchronously in the effect.
    queue.current = queue.current.then(open);
    return () => {
      queue.current = queue.current.then(async () => { await dbRef.current?.close().catch(() => {}); dbRef.current = null; });
    };
  }, [open]);

  const run = useCallback((script: string, options?: RunOptions): Promise<StatementResult[]> => {
    const job = queue.current.then(async () => {
      if (!dbRef.current) throw new Error("The database isn't ready yet.");
      const results = await runScript(dbRef.current, script, options);
      setVersion((v) => v + 1);
      return results;
    });
    queue.current = job.catch(() => {});
    return job;
  }, []);

  const reset = useCallback(() => {
    const job = queue.current.then(open);
    queue.current = job;
    return job;
  }, [open]);

  /** Direct access for special actions (snapshots, crash simulation); runs in the same queue. */
  const withDb = useCallback(<T,>(fn: (db: PGlite) => Promise<T>): Promise<T> => {
    const job = queue.current.then(() => {
      if (!dbRef.current) throw new Error("The database isn't ready yet.");
      return fn(dbRef.current);
    });
    queue.current = job.catch(() => {});
    return job;
  }, []);

  const replace = useCallback((db: PGlite) => { dbRef.current = db; setVersion((v) => v + 1); }, []);

  return { status, error, version, run, reset, withDb, replace, db: dbRef };
}

export type Database = ReturnType<typeof useDatabase>;
