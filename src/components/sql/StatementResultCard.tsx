import { Info, MessageSquareText } from "lucide-react";
import { ResultTable } from "@/components/sql/ResultTable";
import { StatementHeader } from "@/components/sql/StatementHeader";
import type { StatementResult } from "@/lib/db/types";

/** A statement's full outcome: header, error (with detail and hint), notices, and rows. */
export function StatementResultCard({ result, showSql = true }: { result: StatementResult; showSql?: boolean }) {
  const { error } = result;
  return (
    <div className="space-y-2 rounded-lg border border-line bg-surface p-2.5">
      <StatementHeader result={result} showSql={showSql} />
      {error && (
        <div role="alert" className="rounded-md border border-miss-line bg-miss-soft px-2.5 py-2 text-xs text-miss">
          <p className="font-semibold">ERROR: {error.message}</p>
          {error.detail && <p className="mt-0.5 text-ink-soft">DETAIL: {error.detail}</p>}
          {error.hint && <p className="mt-0.5 text-ink-soft">HINT: {error.hint}</p>}
        </div>
      )}
      {result.notices.length > 0 && (
        <ul className="space-y-0.5 rounded-md border border-accent/20 bg-accent-soft/60 px-2.5 py-1.5 text-xs text-ink-soft">
          {result.notices.map((n, i) => (
            <li key={i} className="flex gap-1.5">
              {n.startsWith("NOTIFY") ? <MessageSquareText className="mt-0.5 size-3 shrink-0 text-accent" aria-hidden /> : <Info className="mt-0.5 size-3 shrink-0 text-accent" aria-hidden />}
              <span className="font-mono">{n}</span>
            </li>
          ))}
        </ul>
      )}
      {result.columns.length > 0 && <ResultTable result={result} />}
    </div>
  );
}
