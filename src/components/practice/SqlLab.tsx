"use client";

import { useState } from "react";
import { ExampleInfo } from "@/components/practice/ExampleInfo";
import { LibraryPanel } from "@/components/practice/LibraryPanel";
import { DbStatus } from "@/components/practice/DbStatus";
import { RunToolbar } from "@/components/practice/RunToolbar";
import { ResultsList } from "@/components/sql/ResultsList";
import { SqlEditor } from "@/components/sql/SqlEditor";
import { ALL_EXAMPLES, type SqlExample } from "@/content/examples";
import { useDatabase } from "@/hooks/useDatabase";
import { useSqlRunner } from "@/hooks/useSqlRunner";
import { SHOP_SEED } from "@/lib/db/seeds";

const SHOP = { key: "shop", sql: SHOP_SEED };
const panel = "rounded-xl border border-line bg-surface shadow-card";

// Practice: a real PostgreSQL playground with every example one click away.
export function SqlLab({ initialSql }: { initialSql?: string }) {
  const db = useDatabase(SHOP);
  const runner = useSqlRunner(db);
  const [example, setExample] = useState<SqlExample | null>(initialSql ? null : ALL_EXAMPLES[0]);
  const [sql, setSql] = useState(initialSql ?? ALL_EXAMPLES[0].sql);
  const [continueOnError, setContinueOnError] = useState(Boolean(example?.continueOnError));

  const pick = (e: SqlExample) => { setExample(e); setSql(e.sql); setContinueOnError(Boolean(e.continueOnError)); runner.clear(); };
  const load = (text: string) => { setExample(null); setSql(text); };
  const run = () => { if (db.status === "ready") runner.run(sql, continueOnError); };

  return (
    <div className="flex flex-1 flex-col gap-3 lg:grid lg:min-h-0 lg:grid-cols-[minmax(240px,18rem)_minmax(0,1fr)_minmax(260px,21rem)]">
      <section aria-labelledby="lab-title" className={`${panel} flex min-h-0 flex-col gap-3 p-4 lg:col-start-2 lg:row-start-1`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 id="lab-title" className="text-lg font-extrabold tracking-wide text-ink uppercase">SQL Lab</h1>
            <p className="text-sm text-muted">Write and run any SQL against a sample shop database.</p>
          </div>
          <DbStatus status={db.status} error={db.error} />
        </div>
        <SqlEditor id="lab-sql" label="SQL script" value={sql} onChange={(v) => { setSql(v); if (example && v !== example.sql) setExample(null); }} onRun={run} className="h-64 shrink-0 lg:h-[42%]" />
        <RunToolbar onRun={run} running={runner.running} ready={db.status === "ready"} continueOnError={continueOnError} onContinueChange={setContinueOnError}
          onReset={() => { runner.clear(); db.reset(); }} sql={sql} />
        <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto">
          {runner.results === null ? <p className="py-6 text-center text-sm text-muted">Results appear here. Each statement gets its own result.</p>
            : runner.results.length === 0 ? <p className="py-6 text-center text-sm text-muted">Nothing to run: the editor has no statements.</p>
            : <ResultsList results={runner.results} skipped={runner.skipped} />}
        </div>
      </section>
      <LibraryPanel className={`${panel} lg:col-start-1 lg:row-start-1`} db={db} current={example?.id ?? null} onPick={pick} onQuery={load} />
      <aside aria-label="About this example" className={`${panel} p-5 lg:col-start-3 lg:row-start-1 lg:overflow-y-auto`}>
        <ExampleInfo example={example} />
      </aside>
    </div>
  );
}
