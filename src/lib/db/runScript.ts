import { commandOf, splitSql } from "@/lib/db/splitSql";
import type { SqlError, StatementResult } from "@/lib/db/types";

/** The subset of PGlite this module needs; keeps the runner testable and engine-agnostic. */
export interface Queryable {
  query<T>(sql: string, params?: unknown[], options?: { onNotice?: (n: { message?: string }) => void }): Promise<{
    rows: T[];
    fields: { name: string }[];
    affectedRows?: number;
  }>;
  /** PGlite delivers LISTEN/NOTIFY messages here; optional so plain query engines work too. */
  onNotification?(callback: (channel: string, payload: string) => void): () => void;
}

export interface RunOptions {
  /** Keep going after an error (lessons use this to show an aborted transaction and its ROLLBACK). */
  continueOnError?: boolean;
}

export async function runScript(db: Queryable, script: string, options: RunOptions = {}): Promise<StatementResult[]> {
  const results: StatementResult[] = [];
  for (const sql of splitSql(script)) {
    const result = await runStatement(db, sql);
    results.push(result);
    if (result.error && !options.continueOnError) break;
  }
  return results;
}

export async function runStatement(db: Queryable, sql: string): Promise<StatementResult> {
  const notices: string[] = [];
  const started = performance.now();
  const base = { sql, command: commandOf(sql), notices };
  const stopListening = db.onNotification?.((channel, payload) => notices.push(`NOTIFY ${channel}: ${payload}`));
  try {
    const r = await db.query<Record<string, unknown>>(sql, [], { onNotice: (n) => notices.push(n.message ?? "") });
    const isQuery = r.fields.length > 0;
    return { ...base, columns: r.fields.map((f) => ({ name: f.name })), rows: r.rows, affectedRows: isQuery ? null : r.affectedRows ?? null, error: null, ms: performance.now() - started };
  } catch (e) {
    return { ...base, columns: [], rows: [], affectedRows: null, error: toSqlError(e), ms: performance.now() - started };
  } finally {
    stopListening?.();
  }
}

export function toSqlError(e: unknown): SqlError {
  const err = e as { message?: string; detail?: string; hint?: string; code?: string };
  return { message: err.message ?? String(e), detail: err.detail || undefined, hint: err.hint || undefined, code: err.code || undefined };
}

/** Text for one cell: JSON for objects, ISO for dates, "NULL" for null. */
export function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return value.toISOString().replace("T", " ").replace(".000Z", "Z");
  if (value instanceof Uint8Array) return `\\x${Array.from(value.slice(0, 24), (b) => b.toString(16).padStart(2, "0")).join("")}${value.length > 24 ? "…" : ""}`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
