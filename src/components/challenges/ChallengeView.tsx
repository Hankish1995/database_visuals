"use client";

import { useState } from "react";
import { Lightbulb, Loader2, ShieldCheck } from "lucide-react";
import { CheckResult } from "@/components/challenges/CheckResult";
import { SqlCode } from "@/components/sql/SqlCode";
import { SqlEditor } from "@/components/sql/SqlEditor";
import type { Challenge } from "@/content/challenges";
import { checkChallenge, type CheckOutcome } from "@/lib/db/checkChallenge";
import { SHOP_SEED } from "@/lib/db/seeds";
import { useMessages } from "@/i18n";

const SHOP = { key: "shop", sql: SHOP_SEED };

interface Props { challenge: Challenge; draft: string; onDraft: (sql: string) => void; onSolved: () => void }

export function ChallengeView({ challenge, draft, onDraft, onSolved }: Props) {
  const m = useMessages().challenges;
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [checking, setChecking] = useState(false);
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  async function check() {
    setChecking(true);
    try {
      const result = await checkChallenge(challenge, draft, SHOP);
      setOutcome(result);
      if (result.passed) onSolved();
    } catch (e) {
      setOutcome({ passed: false, verdict: { kind: "crashed", error: e instanceof Error ? e.message : String(e) }, results: [] });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <p className="text-xs font-semibold text-muted uppercase">{m.level[challenge.level]} · {challenge.topic}</p>
        <h1 className="text-lg font-bold text-ink">{challenge.title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-soft">{challenge.prompt}</p>
      </div>
      <SqlEditor id="challenge-sql" label={m.yourSql} value={draft} onChange={onDraft} onRun={check} className="h-56 shrink-0" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={check} disabled={checking}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50">
          {checking ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ShieldCheck className="size-4" aria-hidden />} {checking ? m.checking : m.check}
        </button>
        <button type="button" onClick={() => setHints((h) => Math.min(h + 1, challenge.hints.length))} disabled={hints >= challenge.hints.length}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm text-ink-soft hover:border-line-strong disabled:opacity-50">
          <Lightbulb className="size-4" aria-hidden /> {hints === 0 ? m.hint : hints < challenge.hints.length ? m.anotherHint : m.noMoreHints}
        </button>
        <button type="button" onClick={() => setShowSolution((s) => !s)} aria-expanded={showSolution} className="text-sm font-medium text-accent hover:underline">
          {showSolution ? m.hideSolution : m.showSolution}
        </button>
      </div>
      {hints > 0 && <ol className="list-decimal space-y-1 rounded-lg border border-line bg-subtle py-2 pr-3 pl-8 text-sm text-ink-soft">{challenge.hints.slice(0, hints).map((h) => <li key={h}>{h}</li>)}</ol>}
      {showSolution && <SqlCode sql={challenge.solution} />}
      <div aria-live="polite">{outcome && <CheckResult outcome={outcome} />}</div>
    </div>
  );
}
