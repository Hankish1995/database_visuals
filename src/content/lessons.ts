import type { ComponentId, LabConceptId, SimOptions } from "@/lib/sim/types";

// "ready" = the animated Query flow lesson, "focus" = the Query flow scene
// zoomed in on one component, "lab" = a hands-on lesson on real PostgreSQL,
// "vector" = the interactive HNSW / ef_search simulation (no database).
export type LessonKind = "ready" | "focus" | "lab" | "vector";

export interface Lesson {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  kind: LessonKind;
  focus?: ComponentId;
  preset?: Partial<SimOptions>;
  /** Lab lessons: which lab (see content/labs) and the concept the inspector explains. */
  lab?: string;
  concept?: LabConceptId;
}

export interface LessonSection {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}

export const LESSON_SECTIONS: LessonSection[] = [
  {
    id: "query", number: 1, title: "Query processing", subtitle: "From SQL text to result rows",
    lessons: [
      { id: "query-flow", number: "1.1", title: "Query flow", subtitle: "Reads and writes, step by step", kind: "ready" },
      { id: "parsing", number: "1.2", title: "Parsing", subtitle: "How SQL becomes a syntax tree", kind: "focus", focus: "parser" },
      { id: "planning", number: "1.3", title: "Planning", subtitle: "Cost estimates and plan choice", kind: "focus", focus: "planner" },
      { id: "execution", number: "1.4", title: "Execution", subtitle: "Running the plan", kind: "focus", focus: "executor" },
    ],
  },
  {
    id: "indexes", number: 2, title: "Indexes", subtitle: "How indexes work and when to use them",
    lessons: [
      { id: "btree", number: "2.1", title: "B-tree lookups", subtitle: "Root to leaf in a few reads", kind: "focus", focus: "btree", preset: { useIndex: true } },
      { id: "index-vs-scan", number: "2.2", title: "Index vs. table scan", subtitle: "Why plans differ", kind: "focus", focus: "planner", preset: { useIndex: false } },
      { id: "composite", number: "2.3", title: "Composite indexes", subtitle: "Column order matters", kind: "lab", lab: "composite", concept: "compositeIndex" },
      { id: "hnsw", number: "2.4", title: "HNSW vector search", subtitle: "ef_search, recall and work", kind: "vector" },
    ],
  },
  {
    id: "storage", number: 3, title: "Storage", subtitle: "Pages, tuples and layouts",
    lessons: [
      { id: "pages", number: "3.1", title: "Pages and the buffer pool", subtitle: "Why pages, not rows", kind: "focus", focus: "bufferPool", preset: { cache: "miss" } },
      { id: "tuples", number: "3.2", title: "Tuple layout", subtitle: "Headers, slots and free space", kind: "lab", lab: "tuples", concept: "tuple" },
    ],
  },
  {
    id: "transactions", number: 4, title: "Transactions", subtitle: "ACID, isolation and concurrency",
    lessons: [
      { id: "acid", number: "4.1", title: "ACID basics", subtitle: "The four guarantees", kind: "lab", lab: "acid", concept: "transaction" },
      { id: "mvcc", number: "4.2", title: "MVCC", subtitle: "Readers don't block writers", kind: "lab", lab: "mvcc", concept: "mvcc" },
    ],
  },
  {
    id: "recovery", number: 5, title: "Recovery", subtitle: "Write-ahead logging and crash recovery",
    lessons: [
      { id: "wal", number: "5.1", title: "Write-ahead logging", subtitle: "Log first, then data", kind: "lab", lab: "wal", concept: "wal" },
      { id: "crash", number: "5.2", title: "Crash recovery", subtitle: "Replaying the log", kind: "lab", lab: "recovery", concept: "recovery" },
    ],
  },
];

export const ALL_LESSONS = LESSON_SECTIONS.flatMap((s) => s.lessons);
export const DEFAULT_LESSON_ID = "query-flow";
export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id) ?? ALL_LESSONS[0];
