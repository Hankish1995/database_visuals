import { formatCell } from "@/lib/db/runScript";
import type { StatementResult } from "@/lib/db/types";
import { useMessages } from "@/i18n";

const MAX_ROWS = 200;

/** Rows of one statement. NULL is shown distinctly; long results are capped with a note. */
export function ResultTable({ result, caption, highlight }: { result: StatementResult; caption?: string; highlight?: (row: Record<string, unknown>) => boolean }) {
  const m = useMessages().sql;
  const shown = result.rows.slice(0, MAX_ROWS);
  return (
    <div className="max-h-80 overflow-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-left font-mono text-xs">
        <caption className="sr-only">{caption ?? m.resultOf(result.command)}</caption>
        <thead className="sticky top-0 bg-subtle text-muted">
          <tr>{result.columns.map((c, i) => <th key={`${c.name}-${i}`} scope="col" className="border-b border-line px-2.5 py-1.5 font-semibold whitespace-nowrap">{c.name}</th>)}</tr>
        </thead>
        <tbody>
          {shown.map((row, r) => (
            <tr key={r} className={`border-t border-line/70 ${highlight?.(row) ? "bg-flow-soft" : "odd:bg-surface even:bg-subtle/50"}`}>
              {result.columns.map((c, i) => {
                const value = row[c.name];
                const text = formatCell(value);
                return (
                  <td key={i} title={text.length > 60 ? text : undefined} className={`max-w-[28rem] truncate px-2.5 py-1 whitespace-nowrap ${value === null ? "text-muted italic" : "text-ink"}`}>
                    {text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {result.rows.length > MAX_ROWS && <p className="border-t border-line bg-subtle px-2.5 py-1 text-xs text-muted">{m.showing(MAX_ROWS, result.rows.length)}</p>}
    </div>
  );
}
