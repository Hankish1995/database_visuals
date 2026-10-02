"use client";

import { useState, useSyncExternalStore } from "react";
import { ChallengeList } from "@/components/challenges/ChallengeList";
import { ChallengeView } from "@/components/challenges/ChallengeView";
import { CHALLENGES } from "@/content/challenges";
import { useContent } from "@/content/localized";
import { useMessages } from "@/i18n";
import { solvedStore } from "@/lib/solvedStore";

const panel = "rounded-xl border border-line bg-surface shadow-card";

// Challenges: write SQL, then it's checked against a reference solution on
// two fresh copies of the database.
export function ChallengesWorkspace() {
  const [currentId, setCurrentId] = useState(CHALLENGES[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const solvedRaw = useSyncExternalStore(solvedStore.subscribe, solvedStore.getSnapshot, solvedStore.getServerSnapshot);
  const solved = new Set(solvedRaw.split(",").filter(Boolean));
  const m = useMessages().challenges;
  const challenge = useContent().challenges.find((c) => c.id === currentId)!;

  return (
    <div className="flex flex-1 flex-col gap-3 lg:grid lg:min-h-0 lg:grid-cols-[minmax(240px,19rem)_minmax(0,1fr)]">
      <div className={`${panel} lg:flex lg:min-h-0 lg:flex-col`}>
        <ChallengeList current={currentId} solved={solved} onPick={setCurrentId} />
      </div>
      <section aria-label={m.region} className={`${panel} p-4 lg:min-h-0 lg:overflow-y-auto lg:p-5`}>
        <ChallengeView key={challenge.id} challenge={challenge} draft={drafts[challenge.id] ?? challenge.starter}
          onDraft={(sql) => setDrafts((d) => ({ ...d, [challenge.id]: sql }))} onSolved={() => solvedStore.markSolved(challenge.id)} />
      </section>
    </div>
  );
}
