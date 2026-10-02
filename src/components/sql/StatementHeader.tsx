import { CircleAlert, CircleCheck } from "lucide-react";
import type { StatementResult } from "@/lib/db/types";
import { useMessages, type Messages } from "@/i18n";

function outcome(m: Messages["sql"], r: StatementResult): string {
  if (r.error) return m.failed;
  if (r.columns.length) return m.rows(r.rows.length);
  if (r.affectedRows !== null && /^(INSERT|UPDATE|DELETE|MERGE|COPY)/.test(r.command)) return m.affected(r.affectedRows);
  return m.done;
}

/** One line per statement: its command, the outcome in words, and the time. */
export function StatementHeader({ result, showSql }: { result: StatementResult; showSql?: boolean }) {
  const m = useMessages().sql;
  const failed = Boolean(result.error);
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs">
      {failed ? <CircleAlert className="size-3.5 shrink-0 text-miss" aria-hidden /> : <CircleCheck className="size-3.5 shrink-0 text-ok" aria-hidden />}
      <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono font-semibold ${failed ? "bg-miss-soft text-miss" : "bg-subtle text-ink-soft"}`}>{result.command || "SQL"}</span>
      {showSql && <code className="min-w-0 truncate font-mono text-muted" title={result.sql}>{result.sql.replace(/\s+/g, " ")}</code>}
      <span className="ml-auto shrink-0 text-muted">{outcome(m, result)} · {result.ms < 1 ? "<1" : Math.round(result.ms)} ms</span>
    </div>
  );
}
