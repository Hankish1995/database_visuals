"use client";

import { Waypoints } from "lucide-react";
import { Overview } from "@/components/inspector/Overview";
import { VECTOR_CONCEPT_ORDER, VECTOR_CONCEPTS } from "@/content/vectorConcepts";
import type { HnswDemo } from "@/hooks/useHnswDemo";

// The HNSW lesson's inspector: the key terms (pick one to read it), and a
// plain-language reading of the search on screen.
export function VectorInspector({ demo, className = "" }: { demo: HnswDemo; className?: string }) {
  const concept = VECTOR_CONCEPTS[demo.concept];
  const { frame, result, exact, k } = demo;
  const missed = exact.filter((n) => !result.results.some((r) => r.id === n.id));

  return (
    <aside aria-label="Inspector" className={`flex flex-col rounded-xl border border-line bg-surface shadow-card lg:min-h-0 ${className}`}>
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Waypoints className="size-6 text-accent" aria-hidden />
        <h2 className="text-base font-bold uppercase tracking-wide text-ink">{concept.name}</h2>
      </div>
      <div role="radiogroup" aria-label="Term to explain" className="mx-5 flex flex-wrap gap-1">
        {VECTOR_CONCEPT_ORDER.map((id) => (
          <button key={id} type="button" role="radio" aria-checked={demo.concept === id} onClick={() => demo.setConcept(id)}
            className={`rounded-md border px-2 py-1 text-xs font-medium ${demo.concept === id ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-muted hover:text-ink"}`}>
            {VECTOR_CONCEPTS[id].short}
          </button>
        ))}
      </div>
      <div className="space-y-4 px-5 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <Overview concept={concept} />
        <section className="rounded-lg border border-line bg-subtle px-3 py-2.5 text-sm">
          <h3 className="font-semibold text-ink">This search</h3>
          {frame.done ? (
            <p className="mt-1 leading-relaxed text-ink-soft">
              With <span className="font-mono">ef_search = {result.efSearch}</span>, {demo.query.label} compared {result.visited} of {demo.graph.nodes.length} vectors
              and found {k - missed.length} of the true {k} nearest ({Math.round(demo.recall * 100)}% recall).
              {missed.length > 0
                ? ` It missed ${missed.map((n) => n.id).join(", ")}: the search stopped before reaching ${missed.length === 1 ? "it" : "them"}. Try a larger ef_search.`
                : " Every true nearest neighbour was found -- for this query, at this setting. Another query or dataset can differ."}
            </p>
          ) : (
            <p className="mt-1 text-ink-soft">Run the search to see what it explored and how close it got to the exact answer.</p>
          )}
        </section>
        <p className="text-xs leading-relaxed text-muted">
          A simplified educational simulation of pgvector&apos;s HNSW search (PostgreSQL itself has no vector index; the pgvector
          extension adds the vector type and the hnsw index). It runs entirely in your browser on a fixed 48-vector dataset.
        </p>
      </div>
    </aside>
  );
}
