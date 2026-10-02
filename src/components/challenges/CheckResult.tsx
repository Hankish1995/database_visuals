import { CircleCheck, CircleX } from "lucide-react";
import { ResultTable } from "@/components/sql/ResultTable";
import { ResultsList } from "@/components/sql/ResultsList";
import type { CheckOutcome } from "@/lib/db/checkChallenge";
import { useMessages } from "@/i18n";

/** The verdict, then your result next to the expected one, then everything your SQL printed. */
export function CheckResult({ outcome }: { outcome: CheckOutcome }) {
  const m = useMessages().challenges;
  const Icon = outcome.passed ? CircleCheck : CircleX;
  return (
    <div className="space-y-3">
      <p role="status" className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${outcome.passed ? "border-ok/30 bg-ok-soft text-ok" : "border-miss-line bg-miss-soft text-miss"}`}>
        <Icon className="size-4 shrink-0" aria-hidden /> {m.verdict(outcome.verdict)}
      </p>
      {!outcome.passed && outcome.got && outcome.expected && (
        <div className="grid gap-3 xl:grid-cols-2">
          <figure><figcaption className="mb-1 text-xs font-semibold text-ink">{m.yourResult}</figcaption><ResultTable result={outcome.got} caption={m.yourResult} /></figure>
          <figure><figcaption className="mb-1 text-xs font-semibold text-ink">{m.expected}</figcaption><ResultTable result={outcome.expected} caption={m.expectedResult} /></figure>
        </div>
      )}
      {outcome.results.length > 0 && (
        <details className="rounded-lg border border-line p-2">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">{m.everything(outcome.results.length)}</summary>
          <div className="mt-2"><ResultsList results={outcome.results} /></div>
        </details>
      )}
    </div>
  );
}
