"use client";

import { useState } from "react";
import { ExampleLibrary } from "@/components/practice/ExampleLibrary";
import { SchemaBrowser } from "@/components/practice/SchemaBrowser";
import { Segmented } from "@/components/ui/Segmented";
import type { SqlExample } from "@/content/examples";
import type { Database } from "@/hooks/useDatabase";
import { useMessages } from "@/i18n";

interface Props { db: Database; current: string | null; onPick: (e: SqlExample) => void; onQuery: (sql: string) => void; className?: string }

/** Left panel: the example library, or the live schema. */
export function LibraryPanel({ db, current, onPick, onQuery, className = "" }: Props) {
  const m = useMessages().practice;
  const [tab, setTab] = useState<"examples" | "schema">("examples");
  return (
    <nav aria-label={m.panel} className={`flex min-h-0 flex-col ${className}`}>
      <div className="p-3 pb-2">
        <Segmented label={m.show} value={tab} onChange={setTab} options={[{ value: "examples", label: m.examples }, { value: "schema", label: m.schema }]} />
      </div>
      <div className="max-h-[28rem] overflow-y-auto px-2 pb-3 lg:max-h-none lg:min-h-0 lg:flex-1">
        {tab === "examples" ? <ExampleLibrary current={current} onPick={onPick} /> : <SchemaBrowser db={db} onQuery={onQuery} />}
      </div>
    </nav>
  );
}
