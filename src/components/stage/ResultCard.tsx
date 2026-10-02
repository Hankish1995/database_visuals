import { CircleAlert } from "lucide-react";
import type { Simulation, UserRow } from "@/lib/sim/types";
import { useMessages } from "@/i18n";

const COLS = ["id", "name", "email", "created_at"] as const;

const DELETED = "\u0000deleted";

function Rows({ rows, columns, deletedLabel }: { rows: [string, UserRow][]; columns: readonly (keyof UserRow)[]; deletedLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="text-left font-mono text-xs">
        <thead>
          <tr className="text-muted">{rows.some(([l]) => l) && <th scope="col" className="pr-3 pb-1 font-medium" />}{columns.map((c) => <th key={c} scope="col" className="pr-4 pb-1 font-medium">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(([label, row]) => (
            <tr key={label || row.id} className={label === DELETED ? "text-muted line-through" : "text-ink"}>
              {label && <th scope="row" className="pr-3 font-sans text-[11px] font-semibold text-muted no-underline">{label === DELETED ? deletedLabel : label}</th>}
              {columns.map((c) => <td key={c} className="pr-4">{row[c]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** What the client got back: rows for a SELECT, the command tag and changed row for a write, or the error. */
export function ResultCard({ sim, onSelect }: { sim: Simulation; onSelect: () => void }) {
  const { change } = sim;
  const m = useMessages().result;
  const rows: [string, UserRow][] = sim.kind === "select" ? sim.rows.map((r) => ["", r])
    : change ? [...(change.before ? [[sim.kind === "delete" ? DELETED : m.before, change.before] as [string, UserRow]] : []),
                ...(change.after ? [[sim.kind === "insert" ? m.inserted : m.after, change.after] as [string, UserRow]] : [])] : [];
  return (
    <div className={`rounded-xl border bg-surface p-3 ${sim.error ? "border-miss-line" : "border-ok/30"}`}>
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold text-ink">
          {m.serverReplied} <code className={`font-mono ${sim.error ? "text-miss" : "text-ok"}`}>{sim.commandTag}</code>
        </p>
        <button type="button" onClick={onSelect} className="text-xs font-medium text-accent hover:underline">{m.whatIsRow}</button>
      </div>
      {sim.error ? (
        <p role="alert" className="flex gap-1.5 text-xs text-miss"><CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />{m.error(sim.error)}</p>
      ) : rows.length ? (
        <Rows rows={rows} columns={sim.kind === "select" ? sim.query.columns : COLS} deletedLabel={m.deleted} />
      ) : (
        <p className="text-xs text-muted">{sim.kind === "select" ? m.zeroRows : m.nothingChanged}</p>
      )}
    </div>
  );
}
