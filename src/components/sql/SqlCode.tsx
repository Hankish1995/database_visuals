import { highlightSql } from "@/components/editor/highlightSql";

/** Read-only, syntax-coloured SQL. */
export function SqlCode({ sql, className = "" }: { sql: string; className?: string }) {
  return (
    <pre className={`overflow-x-auto rounded-lg border border-line bg-subtle px-3 py-2 font-mono text-xs leading-relaxed ${className}`}>
      <code>{highlightSql(sql)}</code>
    </pre>
  );
}
