import { LAB_CONCEPTS } from "@/content/labConcepts";
import type { ConceptId } from "@/lib/sim/types";

export interface Concept {
  name: string;
  /** Short line shown under the component in the diagrams. */
  tagline: string;
  question: string;
  definition: string;
  purpose: string[];
  caveat?: string;
}

// Concise definitions. PostgreSQL is the modeled engine; where behaviour
// differs between engines, the caveat says so.
export const CONCEPTS: Record<ConceptId, Concept> = {
  client: {
    name: "Client",
    tagline: "Sends SQL",
    question: "What is the client?",
    definition: "Any program that connects to the database server and sends it SQL: an application, a driver, or a tool like psql. It receives result rows or an error back.",
    purpose: ["Opens a connection (a PostgreSQL backend process serves it)", "Sends query text and parameters", "Reads result rows as they arrive"],
  },
  parser: {
    name: "Parser",
    tagline: "SQL → syntax tree",
    question: "What does the parser do?",
    definition: "The parser turns SQL text into a tree the rest of the database can reason about. It checks grammar first, then resolves table and column names against the system catalog.",
    purpose: ["Tokenises the text and checks syntax", "Builds a parse tree of the statement", "Resolves names like users and id (analysis)"],
    caveat: "PostgreSQL also runs a rewriter here (for views and rules). This model folds it into one step.",
  },
  planner: {
    name: "Query planner",
    tagline: "Chooses a plan",
    question: "What is the query planner?",
    definition: "The planner (or optimizer) considers different ways to run a query, such as an index scan or a sequential scan, estimates each one's cost from table statistics, and picks the cheapest.",
    purpose: ["Enumerates candidate plans", "Estimates cost from statistics like row counts", "Hands the chosen plan to the executor"],
    caveat: "Estimates can be wrong when statistics are stale; EXPLAIN shows the plan a real database picked.",
  },
  executor: {
    name: "Executor",
    tagline: "Runs the plan",
    question: "What is the executor?",
    definition: "The executor walks the plan tree and produces rows. Each plan node asks its children for rows, fetching the pages it needs through the buffer manager.",
    purpose: ["Runs plan nodes such as Index Scan or Seq Scan", "Applies filters to candidate rows", "Streams result rows back to the client"],
  },
  btree: {
    name: "B-tree index",
    tagline: "users_pkey (id)",
    question: "What is a B-tree index?",
    definition: "A B-tree is a sorted, balanced tree of keys stored in its own pages. Inner pages route a search toward the right leaf; leaf entries hold the key and a pointer (page, slot) to the row in the table.",
    purpose: ["Finds a key in a few page reads, even in huge tables", "Keeps keys ordered, which also helps range queries and ORDER BY", "Backs primary keys and unique constraints"],
    caveat: "Index pages are cached in the buffer pool like table pages. This model draws them separately for clarity.",
  },
  bufferPool: {
    name: "Buffer pool",
    tagline: "Shared memory",
    question: "What is the buffer pool?",
    definition: "The buffer pool is a shared memory cache of recently used disk pages. When a query needs a page, the database checks the buffer pool before reading from disk.",
    purpose: ["Avoids disk reads by keeping hot pages in memory", "Is shared by every connection", "Evicts cold pages when full (PostgreSQL uses a clock-sweep policy)"],
    caveat: "Databases cache whole pages, not individual rows. Pool size is configurable (shared_buffers in PostgreSQL).",
  },
  disk: {
    name: "Disk pages",
    tagline: "Table data file",
    question: "What is a disk page?",
    definition: "Tables and indexes are stored on disk as fixed-size pages (8 KB by default in PostgreSQL). Each page holds a header, pointers to its tuples, and the tuple data itself.",
    purpose: ["The unit of storage and of I/O", "Read into the buffer pool on a cache miss", "Written back later, after the change is logged"],
    caveat: "The operating system also caches files, so a buffer-pool miss is not always a physical disk read.",
  },
  row: {
    name: "Row / tuple",
    tagline: "The result",
    question: "What is a row (tuple)?",
    definition: "A row is one record in a table. On a page it's stored as a tuple: a small header plus the column values. An index pointer identifies it by page number and slot.",
    purpose: ["Holds one record's column values", "Is addressed by (page, slot), called a TID in PostgreSQL", "Carries version information used for MVCC visibility"],
    caveat: "An UPDATE in PostgreSQL writes a new tuple version, so one row can have several tuples over time.",
  },
  cache: {
    name: "Cache hit and miss",
    tagline: "Is the page in memory?",
    question: "What are cache hits and misses?",
    definition: "A cache hit means the page a query needs is already in the buffer pool, so it's read from memory. A cache miss means it isn't, so the page must first be read from storage.",
    purpose: ["Hits are cheap: memory access only", "Misses cost an I/O and then take a buffer slot", "A high hit ratio usually means the working set fits in memory"],
    caveat: "Use the cache control above the scene to replay this query with a hit or a miss.",
  },
  ...LAB_CONCEPTS,
};
