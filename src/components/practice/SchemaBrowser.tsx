"use client";

import { useEffect, useState } from "react";
import { loadCatalog, type Catalog } from "@/lib/db/catalog";
import type { Database } from "@/hooks/useDatabase";

const GROUPS: [keyof Catalog, string][] = [
  ["tables", "Tables"], ["views", "Views"], ["materializedViews", "Materialized views"], ["functions", "Functions"],
  ["procedures", "Procedures"], ["triggers", "Triggers"], ["indexes", "Indexes"], ["sequences", "Sequences"],
];

// What exists in the database right now. Re-read after every run, so objects
// you create appear straight away. Tables offer a quick SELECT.
export function SchemaBrowser({ db, onQuery }: { db: Database; onQuery: (sql: string) => void }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const { status, version, withDb } = db;

  useEffect(() => {
    if (status !== "ready") return;
    let live = true;
    withDb((d) => loadCatalog(d)).then((c) => { if (live) setCatalog(c); }).catch(() => {});
    return () => { live = false; };
  }, [status, version, withDb]);

  if (!catalog) return <p className="px-2.5 py-2 text-sm text-muted">Reading the catalog…</p>;
  return (
    <div className="space-y-3">
      {GROUPS.map(([key, title]) => (
        <section key={key} aria-label={title}>
          <h3 className="px-2.5 text-xs font-semibold tracking-wide text-muted uppercase">{title} ({catalog[key].length})</h3>
          {catalog[key].length === 0 ? <p className="px-2.5 py-1 text-xs text-muted">None yet.</p> : (
            <ul className="mt-1 space-y-0.5">
              {catalog[key].map((entry) => (
                <li key={entry.name}>
                  <details className="group rounded-lg px-2.5 py-1 hover:bg-subtle open:bg-subtle">
                    <summary className="cursor-pointer list-none text-sm">
                      <span className="font-mono text-[13px] text-ink">{entry.name}</span>
                      <span className="block text-xs text-muted">{entry.detail}</span>
                    </summary>
                    {entry.definition && <pre className="mt-1 max-h-48 overflow-auto rounded border border-line bg-surface p-2 font-mono text-[11px] whitespace-pre-wrap text-ink-soft">{entry.definition}</pre>}
                    {(key === "tables" || key === "views" || key === "materializedViews") && (
                      <button type="button" onClick={() => onQuery(`SELECT * FROM ${entry.name} LIMIT 50;`)} className="mt-1 text-xs font-medium text-accent hover:underline">
                        Query this {key === "tables" ? "table" : "view"}
                      </button>
                    )}
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
