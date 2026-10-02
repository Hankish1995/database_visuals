import { StatementResultCard } from "@/components/sql/StatementResultCard";
import type { StatementResult } from "@/lib/db/types";
import { useMessages } from "@/i18n";

/** Every statement's result, in order. `skipped` counts statements not run after a stop-on-error. */
export function ResultsList({ results, skipped = 0 }: { results: StatementResult[]; skipped?: number }) {
  const m = useMessages().sql;
  return (
    <div className="space-y-2">
      {results.map((r, i) => <StatementResultCard key={i} result={r} />)}
      {skipped > 0 && <p className="px-1 text-xs text-muted">{m.skipped(skipped)}</p>}
    </div>
  );
}
