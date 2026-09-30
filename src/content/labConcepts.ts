import type { Concept } from "@/content/concepts";
import type { LabConceptId } from "@/lib/sim/types";

export const LAB_CONCEPTS: Record<LabConceptId, Concept> = {
  compositeIndex: {
    name: "Composite index", tagline: "Several columns, one order",
    question: "What is a composite index?",
    definition: "An index on more than one column. Entries are sorted by the first column, then by the second within equal first values, and so on, so its usefulness depends on which columns a query filters or sorts by.",
    purpose: ["Answers filters on a leading prefix of its columns", "Can return rows already sorted, skipping a Sort step", "Makes multi-column lookups far more selective"],
    caveat: "Put the column you filter by equality first. PostgreSQL 18 can sometimes skip-scan a missing first column, but don't count on it.",
  },
  tuple: {
    name: "Tuple layout", tagline: "Inside an 8 KB page",
    question: "How is a row stored on a page?",
    definition: "A heap page has a 24-byte header, an array of 4-byte line pointers growing from the front, and tuples growing from the back. Each tuple has a header (with xmin, xmax and t_ctid) followed by the column data.",
    purpose: ["Line pointers give rows stable addresses (ctid = page, slot)", "Free space is the gap between the pointers and the tuples", "Tuple headers carry the MVCC version information"],
    caveat: "Large values are compressed or moved to a separate TOAST table, so a tuple stays small.",
  },
  transaction: {
    name: "Transactions (ACID)", tagline: "All or nothing",
    question: "What does ACID mean?",
    definition: "A transaction is a group of statements the database treats as one unit. Atomicity: all or nothing. Consistency: constraints always hold. Isolation: concurrent transactions don't see each other's unfinished work. Durability: committed work survives crashes.",
    purpose: ["BEGIN starts a transaction; COMMIT or ROLLBACK ends it", "After an error, the transaction must be rolled back", "Savepoints let you undo part of a transaction"],
    caveat: "Outside BEGIN, every statement runs in its own transaction (autocommit).",
  },
  mvcc: {
    name: "MVCC", tagline: "Many versions, one row",
    question: "What is MVCC?",
    definition: "Multi-version concurrency control keeps old versions of changed rows instead of overwriting them. Each version records the transaction that created it (xmin) and the one that deleted or replaced it (xmax); a snapshot decides which version each query sees.",
    purpose: ["Readers never block writers, and writers never block readers", "Each transaction sees a consistent snapshot", "VACUUM later removes versions nobody can see"],
    caveat: "Other databases implement MVCC differently (e.g. with undo logs); this lesson shows PostgreSQL's approach.",
  },
  wal: {
    name: "Write-ahead log", tagline: "Log first, data later",
    question: "What is the write-ahead log?",
    definition: "An append-only log of every change, written before the changed data pages. A commit only has to wait for its log records to reach disk; the data pages can be written later, in bulk.",
    purpose: ["Makes COMMIT fast and durable", "Lets the database recover after a crash", "Feeds replication and point-in-time recovery"],
    caveat: "Positions in the WAL are LSNs; pg_walinspect reads its records.",
  },
  recovery: {
    name: "Crash recovery", tagline: "Replay from the checkpoint",
    question: "How does crash recovery work?",
    definition: "After an unclean shutdown, PostgreSQL reads the last checkpoint's redo point from the control file and replays every WAL record from there, restoring the data files to the last committed state.",
    purpose: ["Checkpoints bound how much log must be replayed", "Full-page images repair pages torn mid-write", "Transactions without a commit record stay invisible"],
    caveat: "Recovery ends with a new checkpoint; its redo point moves to the end of the replayed log.",
  },
};
