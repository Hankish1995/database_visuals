// Results of running SQL against the in-browser PostgreSQL (PGlite).
export interface Column { name: string }

export interface StatementResult {
  /** The statement as written (trimmed). */
  sql: string;
  /** e.g. "SELECT", "CREATE TRIGGER", "CALL". */
  command: string;
  columns: Column[];
  rows: Record<string, unknown>[];
  affectedRows: number | null;
  notices: string[];
  error: SqlError | null;
  ms: number;
}

export interface SqlError {
  message: string;
  detail?: string;
  hint?: string;
  code?: string;
}

export type ExtensionName = "pageinspect" | "pg_walinspect" | "pg_buffercache" | "pg_visibility" | "pgcrypto" | "pg_trgm";
