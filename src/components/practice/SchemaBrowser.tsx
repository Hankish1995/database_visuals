"use client";

import { useEffect, useState } from "react";
import { useMessages, type Messages } from "@/i18n";
import { loadCatalog, type Catalog, type CatalogEntry } from "@/lib/db/catalog";
import type { Database } from "@/hooks/useDatabase";

const GROUPS: (keyof Catalog)[] = ["tables", "views", "materializedViews", "functions", "procedures", "triggers", "indexes", "sequences"];

/** The short line under each object, phrased from the catalog's raw value. */
function detail(m: Messages["practice"], key: keyof Catalog, info: CatalogEntry["info"]): string {
  switch (key) {
    case "tables": return info === null ? m.partitioned : m.rowsEst(info);
    case "views": return m.view;
    case "materializedViews": return info === "true" ? m.populated : m.notPopulated;
    case "functions": return m.returns(info ?? "");
    case "triggers": case "indexes": return m.on(info ?? "");
    case "sequences": return m.sequence;
    default: return info ?? "";
  }
}

// What exists in the database right now. Re-read after every run, so objects
// you create appear straight away. Tables offer a quick SELECT.
export function SchemaBrowser({ db, onQuery }: { db: Database; onQuery: (sql: string) => void }) {
  const m = useMessages().practice;
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const { status, version, withDb } = db;

  useEffect(() => {
    if (status !== "ready") return;
    let live = true;
    withDb((d) => loadCatalog(d)).then((c) => { if (live) setCatalog(c); }).catch(() => {});
    return () => { live = false; };
  }, [status, version, withDb]);

  if (!catalog) return <p className="px-2.5 py-2 text-sm text-muted">{m.readingCatalog}</p>;
  return (
    <div className="space-y-3">
      {GROUPS.map((key) => (
        <section key={key} aria-label={m.groups[key]}>
          <h3 className="px-2.5 text-xs font-semibold tracking-wide text-muted uppercase">{m.groups[key]} ({catalog[key].length})</h3>
          {catalog[key].length === 0 ? <p className="px-2.5 py-1 text-xs text-muted">{m.noneYet}</p> : (
            <ul className="mt-1 space-y-0.5">
              {catalog[key].map((entry) => (
                <li key={entry.name}>
                  <details className="group rounded-lg px-2.5 py-1 hover:bg-subtle open:bg-subtle">
                    <summary className="cursor-pointer list-none text-sm">
                      <span className="font-mono text-[13px] text-ink">{entry.name}</span>
                      <span className="block text-xs text-muted">{detail(m, key, entry.info)}</span>
                    </summary>
                    {entry.definition && <pre className="mt-1 max-h-48 overflow-auto rounded border border-line bg-surface p-2 font-mono text-[11px] whitespace-pre-wrap text-ink-soft">{entry.definition}</pre>}
                    {(key === "tables" || key === "views" || key === "materializedViews") && (
                      <button type="button" onClick={() => onQuery(`SELECT * FROM ${entry.name} LIMIT 50;`)} className="mt-1 text-xs font-medium text-accent hover:underline">
                        {key === "tables" ? m.queryTable : m.queryView}
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
