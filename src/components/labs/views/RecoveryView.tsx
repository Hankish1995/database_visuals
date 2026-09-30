import { CircleCheck, Zap } from "lucide-react";
import { WalRecords } from "@/components/labs/views/WalRecords";
import type { RecoveryReport } from "@/lib/db/crash";

export function RecoveryView({ report }: { report: RecoveryReport }) {
  return (
    <div className="space-y-3 text-sm">
      <ol className="grid gap-2 md:grid-cols-3">
        <li className="rounded-lg border border-miss-line bg-miss-soft p-3">
          <p className="flex items-center gap-1.5 font-semibold text-miss"><Zap className="size-4" aria-hidden /> Crashed</p>
          <p className="mt-1 text-xs text-ink-soft">Files copied mid-flight. Last checkpoint&apos;s redo point: <code className="font-mono">{report.redoBefore}</code>; log ended at <code className="font-mono">{report.logEndBefore}</code>.</p>
        </li>
        <li className="rounded-lg border border-accent/30 bg-accent-soft p-3">
          <p className="font-semibold text-accent">Replayed {report.replayed.length} WAL records</p>
          <p className="mt-1 text-xs text-ink-soft">The new server found an unclean shutdown and redid every record from the redo point to the end of the log.</p>
        </li>
        <li className="rounded-lg border border-ok/30 bg-ok-soft p-3">
          <p className="flex items-center gap-1.5 font-semibold text-ok"><CircleCheck className="size-4" aria-hidden /> Recovered</p>
          <p className="mt-1 text-xs text-ink-soft">Recovery finished with a new checkpoint at <code className="font-mono">{report.checkpointAfter}</code>.</p>
        </li>
      </ol>
      {report.replayed.length > 0 && (
        <WalRecords records={{ sql: "", command: "SELECT", columns: [], rows: report.replayed, affectedRows: null, notices: [], error: null, ms: 0 }} />
      )}
    </div>
  );
}
