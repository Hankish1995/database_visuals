import type { Concept } from "@/content/concepts";

export function Overview({ concept, onOpenCache }: { concept: Concept; onOpenCache?: () => void }) {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <h3 className="font-semibold text-ink">{concept.question}</h3>
        <p className="mt-1 leading-relaxed text-ink-soft">{concept.definition}</p>
      </section>
      <section>
        <h3 className="font-semibold text-ink">Purpose</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">
          {concept.purpose.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </section>
      {concept.caveat && (
        <p className="rounded-lg border border-line bg-subtle px-3 py-2 text-xs leading-relaxed text-muted">
          <strong className="font-semibold text-ink-soft">Keep in mind: </strong>{concept.caveat}
        </p>
      )}
      {onOpenCache && (
        <button type="button" onClick={onOpenCache} className="text-sm font-medium text-accent hover:underline">Cache hits and misses explained →</button>
      )}
    </div>
  );
}
