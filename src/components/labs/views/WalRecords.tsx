import { formatCell } from "@/lib/db/runScript";
import { useMessages } from "@/i18n";
import type { StatementResult } from "@/lib/db/types";

const TONE: Record<string, string> = {
  Heap: "bg-flow-soft text-flow border-flow-bright/40", Heap2: "bg-flow-soft text-flow border-flow-bright/40",
  Btree: "bg-index-soft text-index border-index/30", Transaction: "bg-ok-soft text-ok border-ok/30",
};

// WAL records as a timeline, oldest first. Full-page images are called out.
export function WalRecords({ records }: { records: StatementResult }) {
  const m = useMessages().labs;
  return (
    <ol aria-label={m.walRecords} className="space-y-1">
      {records.rows.map((r, i) => {
        const rm = String(r.resource_manager);
        const fpi = Number(r.fpi_length ?? 0);
        return (
          <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md border border-line bg-surface px-2 py-1 text-xs">
            <span className="w-24 shrink-0 font-mono text-muted">{formatCell(r.start_lsn)}</span>
            <span className={`rounded border px-1.5 py-0.5 font-semibold ${TONE[rm] ?? "border-line bg-subtle text-ink-soft"}`}>{rm}</span>
            <span className="font-mono font-semibold text-ink">{String(r.record_type)}</span>
            {r.record_length !== undefined && <span className="text-muted">{String(r.record_length)} B</span>}
            {fpi > 0 && <span className="rounded bg-miss-soft px-1.5 py-0.5 font-semibold text-miss">{m.fpi(fpi)}</span>}
            {r.description ? <span className="min-w-0 basis-full truncate pl-26 font-mono text-[11px] text-muted" title={String(r.description)}>{String(r.description)}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
