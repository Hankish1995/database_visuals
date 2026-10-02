import type { Concept } from "@/content/concepts";
import { useMessages } from "@/i18n";

export function Overview({ concept, onOpenCache }: { concept: Concept; onOpenCache?: () => void }) {
  const m = useMessages().inspector;
  return (
    <div className="space-y-4 text-sm">
      <section>
        <h3 className="font-semibold text-ink">{concept.question}</h3>
        <p className="mt-1 leading-relaxed text-ink-soft">{concept.definition}</p>
      </section>
      <section>
        <h3 className="font-semibold text-ink">{m.purpose}</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-soft">
          {concept.purpose.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </section>
      {concept.caveat && (
        <p className="rounded-lg border border-line bg-subtle px-3 py-2 text-xs leading-relaxed text-muted">
          <strong className="font-semibold text-ink-soft">{m.keepInMind} </strong>{concept.caveat}
        </p>
      )}
      {onOpenCache && (
        <button type="button" onClick={onOpenCache} className="text-sm font-medium text-accent hover:underline">{m.cacheLink}</button>
      )}
    </div>
  );
}
