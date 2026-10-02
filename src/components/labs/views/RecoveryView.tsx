import { CircleCheck, Zap } from "lucide-react";
import { WalRecords } from "@/components/labs/views/WalRecords";
import { RichText } from "@/components/ui/RichText";
import { useMessages } from "@/i18n";
import type { RecoveryReport } from "@/lib/db/crash";

export function RecoveryView({ report }: { report: RecoveryReport }) {
  const m = useMessages().labs;
  return (
    <div className="space-y-3 text-sm">
      <ol className="grid gap-2 md:grid-cols-3">
        <li className="rounded-lg border border-miss-line bg-miss-soft p-3">
          <p className="flex items-center gap-1.5 font-semibold text-miss"><Zap className="size-4" aria-hidden /> {m.crashed}</p>
          <p className="mt-1 text-xs text-ink-soft"><RichText text={m.crashedBody(report.redoBefore, report.logEndBefore)} /></p>
        </li>
        <li className="rounded-lg border border-accent/30 bg-accent-soft p-3">
          <p className="font-semibold text-accent">{m.replayed(report.replayed.length)}</p>
          <p className="mt-1 text-xs text-ink-soft">{m.replayedBody}</p>
        </li>
        <li className="rounded-lg border border-ok/30 bg-ok-soft p-3">
          <p className="flex items-center gap-1.5 font-semibold text-ok"><CircleCheck className="size-4" aria-hidden /> {m.recovered}</p>
          <p className="mt-1 text-xs text-ink-soft"><RichText text={m.recoveredBody(report.checkpointAfter)} /></p>
        </li>
      </ol>
      {report.replayed.length > 0 && (
        <WalRecords records={{ sql: "", command: "SELECT", columns: [], rows: report.replayed, affectedRows: null, notices: [], error: null, ms: 0 }} />
      )}
    </div>
  );
}
