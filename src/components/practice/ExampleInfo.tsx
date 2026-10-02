import { Eye, TriangleAlert } from "lucide-react";
import type { SqlExample } from "@/content/examples";
import { useContent } from "@/content/localized";
import { useMessages } from "@/i18n";

const TABLES = ["customers", "products", "orders", "order_items", "accounts", "audit_log", "events"];

/** Explains the loaded example, or the sample database when writing freely. */
export function ExampleInfo({ example: picked }: { example: SqlExample | null }) {
  const m = useMessages().practice;
  const content = useContent();
  const example = picked && (content.example(picked.id) ?? picked);
  return (
    <div className="space-y-4 text-sm">
      {example ? (
        <>
          <div>
            <h2 className="text-base font-bold text-ink">{example.title}</h2>
            <p className="mt-1 text-ink-soft">{example.summary}</p>
          </div>
          <p className="flex gap-2 rounded-lg border border-accent/20 bg-accent-soft/60 px-3 py-2 text-ink-soft">
            <Eye className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /><span><strong className="text-ink">{m.notice}</strong>{example.notice}</span>
          </p>
          {(example.expectError || example.continueOnError) && (
            <p className="flex gap-2 rounded-lg border border-line bg-subtle px-3 py-2 text-xs text-ink-soft">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
              {example.expectError ? m.expectError : m.continueOnError}
            </p>
          )}
        </>
      ) : (
        <div>
          <h2 className="text-base font-bold text-ink">{m.ownSql}</h2>
          <p className="mt-1 text-ink-soft">{m.ownSqlBody}</p>
        </div>
      )}
      <section>
        <h3 className="font-semibold text-ink">{m.sampleDb}</h3>
        <ul className="mt-1.5 space-y-1">
          {TABLES.map((name) => <li key={name} className="text-xs text-ink-soft"><code className="font-mono font-semibold text-ink">{name}</code>: {m.tables[name]}</li>)}
        </ul>
        <p className="mt-2 text-xs text-muted">{m.persistence}</p>
      </section>
    </div>
  );
}
