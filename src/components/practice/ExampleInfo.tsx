import { Eye, TriangleAlert } from "lucide-react";
import type { SqlExample } from "@/content/examples";

const TABLES = [
  ["customers", "6 customers in 5 cities"], ["products", "7 products with tags (array) and details (jsonb)"],
  ["orders", "7 orders with a status"], ["order_items", "line items; cascade-deleted with their order"],
  ["accounts", "3 bank accounts (balance ≥ 0)"], ["audit_log", "empty, for trigger examples"], ["events", "50,000 rows for index and plan work"],
];

/** Explains the loaded example, or the sample database when writing freely. */
export function ExampleInfo({ example }: { example: SqlExample | null }) {
  return (
    <div className="space-y-4 text-sm">
      {example ? (
        <>
          <div>
            <h2 className="text-base font-bold text-ink">{example.title}</h2>
            <p className="mt-1 text-ink-soft">{example.summary}</p>
          </div>
          <p className="flex gap-2 rounded-lg border border-accent/20 bg-accent-soft/60 px-3 py-2 text-ink-soft">
            <Eye className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /><span><strong className="text-ink">What to notice: </strong>{example.notice}</span>
          </p>
          {(example.expectError || example.continueOnError) && (
            <p className="flex gap-2 rounded-lg border border-line bg-subtle px-3 py-2 text-xs text-ink-soft">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
              {example.expectError ? "This example ends in an error on purpose: it shows the database refusing bad data." : "This example causes an error on purpose, so it runs with “Keep going after errors” on."}
            </p>
          )}
        </>
      ) : (
        <div>
          <h2 className="text-base font-bold text-ink">Your own SQL</h2>
          <p className="mt-1 text-ink-soft">Anything PostgreSQL supports works here: DDL, DML, functions, procedures, triggers, transactions, EXPLAIN.</p>
        </div>
      )}
      <section>
        <h3 className="font-semibold text-ink">The sample shop database</h3>
        <ul className="mt-1.5 space-y-1">
          {TABLES.map(([name, what]) => <li key={name} className="text-xs text-ink-soft"><code className="font-mono font-semibold text-ink">{name}</code>: {what}</li>)}
        </ul>
        <p className="mt-2 text-xs text-muted">Changes last until you reset the database or leave the page.</p>
      </section>
    </div>
  );
}
