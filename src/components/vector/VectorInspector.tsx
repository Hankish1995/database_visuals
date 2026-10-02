"use client";

import { Waypoints } from "lucide-react";
import { Overview } from "@/components/inspector/Overview";
import { RichText } from "@/components/ui/RichText";
import { useContent } from "@/content/localized";
import { VECTOR_CONCEPT_ORDER } from "@/content/vectorConcepts";
import { useMessages } from "@/i18n";
import { HNSW_TEXT } from "@/lib/hnsw/text";
import { useLocale } from "@/lib/prefs";
import type { HnswDemo } from "@/hooks/useHnswDemo";

// The HNSW lesson's inspector: the key terms (pick one to read it), and a
// plain-language reading of the search on screen.
export function VectorInspector({ demo, className = "" }: { demo: HnswDemo; className?: string }) {
  const m = useMessages();
  const v = m.vector;
  const concepts = useContent().vectorConcepts;
  const queryName = HNSW_TEXT[useLocale()].queryName(demo.query.label);
  const concept = concepts[demo.concept];
  const { frame, result, exact, k } = demo;
  const missed = exact.filter((n) => !result.results.some((r) => r.id === n.id));

  return (
    <aside aria-label={m.inspector.region} className={`flex flex-col rounded-xl border border-line bg-surface shadow-card lg:min-h-0 ${className}`}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Waypoints className="size-6 text-accent" aria-hidden />
        <h2 className="text-base font-bold uppercase tracking-wide text-ink">{concept.name}</h2>
      </div>
      <div role="radiogroup" aria-label={v.termPicker} className="mx-5 flex flex-wrap gap-1">
        {VECTOR_CONCEPT_ORDER.map((id) => (
          <button key={id} type="button" role="radio" aria-checked={demo.concept === id} onClick={() => demo.setConcept(id)}
            className={`rounded-md border px-2 py-1 text-xs font-medium ${demo.concept === id ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-muted hover:text-ink"}`}>
            {concepts[id].short}
          </button>
        ))}
      </div>
      <div className="space-y-4 px-5 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <Overview concept={concept} />
        <section className="rounded-lg border border-line bg-subtle px-3 py-2.5 text-sm">
          <h3 className="font-semibold text-ink">{v.thisSearch}</h3>
          {frame.done ? (
            <p className="mt-1 leading-relaxed text-ink-soft">
              <RichText text={v.summary(result.efSearch, queryName, result.visited, demo.graph.nodes.length, k - missed.length, k, Math.round(demo.recall * 100))
                + (missed.length > 0 ? v.missedSome(missed.map((n) => n.id)) : v.foundAll)} />
            </p>
          ) : (
            <p className="mt-1 text-ink-soft">{v.runToSee}</p>
          )}
        </section>
        <p className="text-xs leading-relaxed text-muted">
          {v.about}
        </p>
      </div>
    </aside>
  );
}
