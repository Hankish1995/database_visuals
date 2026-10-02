import { CircleCheck, Circle } from "lucide-react";
import { useContent } from "@/content/localized";
import { useMessages } from "@/i18n";

const LEVEL = { Easy: "text-ok", Medium: "text-accent", Hard: "text-index" };

export function ChallengeList({ current, solved, onPick }: { current: string; solved: Set<string>; onPick: (id: string) => void }) {
  const m = useMessages().challenges;
  const CHALLENGES = useContent().challenges;
  return (
    <nav aria-label={m.title} className="flex min-h-0 flex-col">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-bold tracking-wide text-ink uppercase">{m.title}</h2>
        <p className="text-xs text-muted">{m.solvedCount(solved.size, CHALLENGES.length)}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={m.progress} aria-valuemin={0} aria-valuemax={CHALLENGES.length} aria-valuenow={solved.size}>
          <div className="h-full rounded-full bg-ok" style={{ width: `${(solved.size / CHALLENGES.length) * 100}%` }} />
        </div>
      </div>
      <ul className="max-h-80 space-y-0.5 overflow-y-auto px-2 pb-3 lg:max-h-none lg:min-h-0 lg:flex-1">
        {CHALLENGES.map((c) => {
          const done = solved.has(c.id);
          return (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c.id)} aria-current={current === c.id ? "true" : undefined}
                className={`flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left ${current === c.id ? "border-accent/50 bg-accent-soft" : "border-transparent hover:bg-subtle"}`}>
                {done ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-label={m.solved} /> : <Circle className="mt-0.5 size-4 shrink-0 text-line-strong" aria-label={m.notSolved} />}
                <span className="min-w-0">
                  <span className="block text-sm text-ink">{c.title}</span>
                  <span className="block text-xs text-muted"><span className={`font-semibold ${LEVEL[c.level]}`}>{m.level[c.level]}</span> · {c.topic}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
