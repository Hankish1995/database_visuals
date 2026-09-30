// The simulation is a deterministic, simplified model of how PostgreSQL
// answers `SELECT ... FROM users WHERE id = n`. Nothing here renders:
// the 3D scene, the 2D diagram and the text all read the same steps.

export type ComponentId = "client" | "parser" | "planner" | "executor" | "btree" | "bufferPool" | "disk" | "wal" | "row";
/** Concepts taught by the hands-on lab lessons. */
export type LabConceptId = "compositeIndex" | "tuple" | "transaction" | "mvcc" | "wal" | "recovery";
/** Everything the inspector can explain: the components, the cache hit/miss concept, and the lab topics. */
export type ConceptId = ComponentId | "cache" | LabConceptId;

export type EdgeId =
  | "client-parser"
  | "parser-planner"
  | "planner-executor"
  | "executor-btree"
  | "btree-buffer"
  | "executor-buffer"
  | "disk-buffer"
  | "buffer-client"
  | "buffer-btree"
  | "buffer-wal"
  | "btree-wal"
  | "wal-client";

export type CacheMode = "miss" | "hit";

export interface SimOptions {
  useIndex: boolean;
  cache: CacheMode;
}

export const USER_COLUMNS = ["id", "name", "email", "created_at"] as const;
export type UserColumn = (typeof USER_COLUMNS)[number];

export interface UserRow {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export type StatementKind = "select" | "insert" | "update" | "delete";

/** Values written by an INSERT (all given columns) or an UPDATE (its SET list). */
export type RowValues = Partial<{ id: number; name: string; email: string; created_at: string }>;

export interface ParsedQuery {
  kind: StatementKind;
  sql: string;
  /** SELECT: the columns returned. Writes: every column. */
  columns: UserColumn[];
  selectAll: boolean;
  /** The row the statement is about: WHERE id = n, or the new row's id for INSERT (null = from the sequence). */
  id: number | null;
  values: RowValues;
}

/** A page held in a buffer-pool slot. Page numbers are per relation (table or index file). */
export interface CachedPage {
  relation: string;
  page: number;
}

export interface TupleLocation {
  page: number;
  slot: number;
}

export type CacheResult = "hit" | "miss" | "partial";

export interface SimStep {
  id: string;
  component: ComponentId;
  title: string;
  what: string;
  why: string;
  notice: string;
  /** The path the query marker travels to reach this step. */
  edge?: EdgeId;
  /** B-tree node ids on the lookup path, lit from this step on. */
  btreeNodes?: string[];
  /** users-table pages the buffer pool is asked for in this step. */
  checkPages?: number[];
  cacheResult?: CacheResult;
  /** users-table pages read from disk into the buffer pool in this step. */
  loadPages?: number[];
  /** A users page this step changes in memory (it becomes dirty). */
  writePage?: number;
  /** WAL records this step appends, e.g. "Heap INSERT". */
  wal?: string[];
  /** COMMIT: everything in the WAL so far is flushed to disk. */
  flush?: boolean;
  /** The step where the statement fails. */
  failed?: boolean;
}

export interface Simulation {
  query: ParsedQuery;
  kind: StatementKind;
  options: SimOptions;
  /** What the server replies, e.g. "SELECT 1", "INSERT 0 1", "UPDATE 1", or the error. */
  commandTag: string;
  error: string | null;
  /** The row before and after a write (null where it doesn't exist). */
  change: { before: UserRow | null; after: UserRow | null } | null;
  /** Where a write put the new tuple version, if it wrote one. */
  newTuple: TupleLocation | null;
  /** Caption for the index pointer in the scene, e.g. "→ page 17, slot 14". */
  pointerLabel: string | null;
  txid: number;
  steps: SimStep[];
  plan: string[];
  /** Where the index says the row lives; null for a table scan or a missing key. */
  pointer: TupleLocation | null;
  rows: UserRow[];
  /** The users page the returned row lives on, if any row matched. */
  rowPage: number | null;
  initialBuffer: CachedPage[];
  tablePagesVisited: number[];
  pagesFromDisk: number[];
  indexPagesVisited: number;
  rowsExamined: number;
}
