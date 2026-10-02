import { INDEX, TABLE } from "@/lib/sim/data";
import { SUPPORTED_SQL } from "@/lib/sim/supported";
import { USER_COLUMNS, type ParsedQuery, type StatementKind } from "@/lib/sim/types";

// English narration for the Query flow simulation. The generators in
// src/lib/sim decide WHICH steps happen and with what numbers; these
// functions only phrase them. hi.ts implements the same SimText shape.

export interface StepText { title: string; what: string; why: string; notice: string }

const pageList = (pages: number[]) => pages.length === 1 ? `page ${pages[0]}` : `pages ${pages.slice(0, -1).join(", ")} and ${pages.at(-1)}`;
const cols = (q: ParsedQuery) => (q.selectAll ? "all columns" : q.columns.join(", "));
const lookup = (useIndex: boolean, id: number | null) => useIndex
  ? `For one id on a primary key, an index scan using ${INDEX} is far cheaper than reading the whole table.`
  : `${INDEX} is off for lookups in this run, so finding id = ${id} means reading every page of ${TABLE}.`;

function tree(q: ParsedQuery): string {
  const set = Object.entries(q.values).map(([k, v]) => `${k} = ${typeof v === "string" ? `'${v}'` : v}`).join(", ");
  switch (q.kind) {
    case "select": return `SELECT ${cols(q)} FROM ${TABLE} WHERE id = ${q.id}`;
    case "insert": return `INSERT INTO ${TABLE} (${Object.keys(q.values).join(", ")}) with one row of values`;
    case "update": return `UPDATE ${TABLE} SET ${set} WHERE id = ${q.id}`;
    case "delete": return `DELETE FROM ${TABLE} WHERE id = ${q.id}`;
  }
}

export const simEn = {
  pageList,
  errors: {
    empty: "Type a statement to run, for example: SELECT * FROM users WHERE id = 42;",
    oneAtATime: "Run one statement at a time.",
    returning: "RETURNING isn't part of this animation.",
    notAnimated: (verb: string) => `${verb} isn't animated here. Supported: ${SUPPORTED_SQL}.`,
    noTable: (table: string) => `There is no table "${table}" in this model. Only "users" exists.`,
    whereOnlyId: "Only a WHERE id = <number> filter is animated.",
    whereMissing: (verb: string) => `Add a filter: WHERE id = <number>. ${verb} without one would touch every row.`,
    idWhole: "The id must be a whole number.",
    selectUnreadable: `Couldn't read that query. Supported: ${SUPPORTED_SQL}.`,
    unknownColumn: (name: string) => `users has no column "${name || "(empty)"}". Columns: ${USER_COLUMNS.join(", ")}.`,
    insertUnreadable: "Couldn't read that INSERT. Try: INSERT INTO users (name, email) VALUES ('Dana', 'dana@example.com');",
    listColumns: "List the columns: INSERT INTO users (name, email) VALUES (…).",
    countMismatch: (c: number, v: number) => `${c} column(s) but ${v} value(s).`,
    notNull: "name and email are NOT NULL: give both.",
    updateUnreadable: "Couldn't read that UPDATE. Try: UPDATE users SET email = 'bob@new.example' WHERE id = 42;",
    setUnreadable: (part: string) => `Couldn't read "${part}". Write column = 'value'.`,
    pkUpdate: "Changing the primary key isn't animated; update name, email or created_at.",
    pkChange: "Changing the primary key isn't animated.",
    deleteUnreadable: "Couldn't read that DELETE. Try: DELETE FROM users WHERE id = 42;",
    noDefault: (col: string) => `${col} has no default.`,
    idPositive: "id must be a positive whole number.",
    quoted: (col: string) => `${col} needs a quoted text value, like '…'.`,
    dateFormat: "created_at must look like '2025-06-30'.",
    blank: (col: string) => `${col} can't be empty.`,
  },
  source: (page: number, slot: number | null) => (slot === null ? `page ${page}` : `slot ${slot} of page ${page}`),
  pointer: (page: number, slot: number) => `→ page ${page}, slot ${slot}`,
  keyExists: (id: number, page: number, slot: number) => `${id} exists → page ${page}, slot ${slot}`,
  keyNew: (id: number, page: number, slot: number) => `${id} → page ${page}, slot ${slot} (new)`,

  client: (verb: string, write: boolean): StepText => ({
    title: `Client sends the ${verb}`,
    what: "The application sends the SQL text to the database server over its connection.",
    why: write ? "Every change goes through the server, which enforces constraints, logging and concurrency for all clients." : "The server does all of the planning and data access; the client only sends text and waits for rows.",
    notice: "The query marker leaves the client and heads for the parser.",
  }),
  parse: (q: ParsedQuery): StepText => ({
    title: "Parser builds a syntax tree",
    what: `The text is split into tokens and checked against SQL grammar, giving a tree: ${tree(q)}. Names like "${TABLE}" are then resolved against the catalog.`,
    why: "Later stages work on a structured tree, not raw text. Syntax errors stop here, before any data is touched.",
    notice: "The parser lights up. Open it in the inspector to see the tree.",
  }),
  plan: (q: ParsedQuery, verb: string, useIndex: boolean, plan: string[]): StepText => ({
    title: q.kind === "insert" ? "Planner makes an insert plan" : useIndex ? "Planner picks an index scan" : "Planner falls back to a table scan",
    what: q.kind === "insert"
      ? `An INSERT with VALUES has nothing to search for, so the plan is simple: build one row and hand it to "${plan[0]}".`
      : q.kind !== "select" ? `${verb} first has to find the row, just like a SELECT. ${lookup(useIndex, q.id)}` : `The planner estimates the cost of candidate plans. ${lookup(useIndex, q.id)}`,
    why: "Choosing how to reach data up front avoids unnecessary page reads, which are the expensive part.",
    notice: `The chosen plan is "${plan.map((l) => l.trim()).join(" ")}".`,
  }),
  execute: (q: ParsedQuery, useIndex: boolean): StepText => ({
    title: "Executor runs the plan",
    what: q.kind === "insert"
      ? `The executor builds the new tuple: ${q.id === null ? "id comes from the users_id_seq sequence" : `id is ${q.id}, as given`}${q.values.created_at ? "" : ", and created_at gets its default (today)"}.`
      : "The executor carries out the plan node by node and asks the storage layer for the pages it needs.",
    why: q.kind !== "select" ? "Writes happen in pages in memory first; the executor also has to keep every index on the table up to date." : "The plan says how; the executor does the work, pulling rows one at a time as they are needed.",
    notice: q.kind === "insert" ? "Next, it looks for a page with room for the row." : useIndex ? "Next, the marker heads to the B-tree index." : "Next, the marker heads straight to the table's pages.",
  }),
  returnRows: (q: ParsedQuery, found: boolean, source: string | null): StepText => ({
    title: found ? "Return the row to the client" : "Return zero rows",
    what: found
      ? `The executor reads the tuple from ${source}, checks this row version is visible to the query (MVCC), keeps ${cols(q)}, and sends it to the client.`
      : `No row has id = ${q.id}. The client receives an empty result, which is not an error.`,
    why: found ? "Only the requested row leaves the server; the rest of the page stays cached for later queries." : "An empty result is a normal answer for a filter that matches nothing.",
    notice: found ? "The result appears below the scene. The run is complete." : "The result table is empty. The run is complete.",
  }),

  indexLookup: (id: number, route: string, at: { page: number; slot: number } | null, leaf: { low: number; high: number }): StepText => ({
    title: at ? `Index finds key ${id}` : `Index has no key ${id}`,
    what: at
      ? `The executor descends ${INDEX} from root to leaf (${route}). The leaf entry for ${id} points to table page ${at.page}, slot ${at.slot}.`
      : `The executor descends ${INDEX} (${route}). Leaf ${leaf.low}–${leaf.high} has no entry for ${id}, so no table page is needed.`,
    why: "A B-tree keeps keys sorted, so a lookup reads a few index pages instead of every table page.",
    notice: at
      ? `The violet nodes on the path light up and the pointer (page ${at.page}, slot ${at.slot}) appears under the leaf.`
      : "The path stops at a leaf and no pointer is produced.",
  }),
  bufferCheck: (page: number, hit: boolean): StepText => ({
    title: `Check the buffer pool for page ${page}`,
    what: `The database looks for page ${page} of ${TABLE} in the buffer pool. ${hit ? "It's already there: a cache hit." : "It isn't there: a cache miss."}`,
    why: "Memory is far faster than disk, so every page request, read or write, checks the shared cache first.",
    notice: hit ? `Page ${page} is highlighted in memory and the status reads Cache hit. No disk read follows.` : "The status card reads Cache miss. The page has to come from disk next.",
  }),
  diskWhyIndex: (page: number, range: string) => `Databases move whole pages, not single rows. Page ${page} holds ids ${range}, so neighbours arrive too.`,
  scanCheck: (pages: number[], warm: number[], cold: number[], hit: boolean, id: number): StepText => ({
    title: `Check the buffer pool for ${pageList(pages)}`,
    what: hit
      ? `A sequential scan asks for every page of ${TABLE}, in order. All ${pages.length} are already in the buffer pool.`
      : `A sequential scan asks for every page of ${TABLE}, in order. Only ${pageList(warm)} is cached; ${pageList(cold)} are not.`,
    why: `Without using the index there's no way to know which page holds id ${id}, so every page must be read.`,
    notice: hit ? "All four users pages are highlighted in memory." : "Cached pages are highlighted; the status card reports the misses.",
  }),
  diskWhyScan: "The executor can only examine rows that are in memory, and pages are the unit of I/O.",
  filter: (count: number, id: number, pages: number[], matched: boolean, select: boolean): StepText => ({
    title: `Test all ${count} rows against id = ${id}`,
    what: `Every row on ${pageList(pages)} is compared with the filter. ${matched ? "One row matches." : "No row matches."}`,
    why: "Without the index the executor can't know the match is unique or where it is, so the scan can't stop early.",
    notice: `${count} rows examined to ${select ? "return" : "change"} ${matched ? 1 : 0}. On a real table that could be millions.`,
  }),
  disk: (pages: number[], why: string): StepText => ({
    title: `Read ${pageList(pages)} from disk`,
    what: `${pages.length === 1 ? `The whole 8 KB page ${pages[0]} is` : "The missing pages are"} read from the table's data file into ${pages.length === 1 ? "a free buffer slot" : "free buffer slots"}.`,
    why,
    notice: `${pageList(pages).replace(/^p/, "P")} ${pages.length === 1 ? "travels" : "travel"} from the disk shelf into the buffer pool, where later queries can reuse ${pages.length === 1 ? "it" : "them"}.`,
  }),

  space: (page: number, used: number, capacity: number, hit: boolean): StepText => ({
    title: `Find room: page ${page}`,
    what: `The free space map says page ${page} has room (${used} of ${capacity} slots used), so the new row goes there. Page ${page} is ${hit ? "already in the buffer pool: a cache hit" : "not in the buffer pool: a cache miss"}.`,
    why: "A heap table keeps rows in no particular order: a new row goes wherever there's space, not next to its neighbouring ids.",
    notice: hit ? `Page ${page} is highlighted in memory.` : `The status card reads Cache miss: page ${page} must be read first, even to add a row to it.`,
  }),
  diskWhyInsert: "A page must be in memory to change it, even just to add a row.",
  insertWrite: (id: number, name: string, page: number, slot: number, txid: number): StepText => ({
    title: `Write the new tuple into page ${page}`,
    what: `The row (id ${id}, '${name}') is placed in slot ${slot} with xmin = ${txid}, this transaction's id. Until it commits, no other transaction can see it. A Heap INSERT record is added to the WAL.`,
    why: "The change happens in memory; the WAL record is what makes it recoverable if the server crashes before the page is written out.",
    notice: `Page ${page} turns dirty, and a Heap INSERT record appears on the WAL shelf, not yet flushed.`,
  }),
  duplicate: (id: number, page: number, slot: number): StepText => ({
    title: `Duplicate key: id ${id} already exists`,
    what: `Adding ${id} to ${INDEX}, the leaf already holds ${id} (pointing to page ${page}, slot ${slot}), and that row is live. The primary key must be unique, so the insert fails.`,
    why: "Uniqueness is checked in the index at the moment the key is added; the heap tuple was already written, which is why the failure has to roll back.",
    notice: "The existing entry is highlighted under the leaf and the step is marked as an error.",
  }),
  indexAdd: (id: number, page: number, slot: number): StepText => ({
    title: `Add key ${id} to ${INDEX}`,
    what: `The executor descends ${INDEX} to the right leaf and adds ${id} → (page ${page}, slot ${slot}). The key is new, so the uniqueness check passes. A Btree record is added to the WAL.`,
    why: "Every index on a table must learn about every new row, which is why each extra index makes writes slower.",
    notice: "The new entry appears under the leaf, and a second record joins the WAL shelf.",
  }),
  abort: (txid: number, page: number): StepText => ({
    title: "The transaction aborts",
    what: `The error aborts transaction ${txid}. An abort record is logged. The tuple already written to page ${page} stays there, but its xmin is an aborted transaction, so nobody will ever see it; VACUUM reclaims it later.`,
    why: "Atomicity: a failed statement leaves no visible trace, even though some of its work reached the page.",
    notice: "An ABORT record joins the WAL shelf. Nothing needs to be flushed for an abort.",
  }),
  insertFailed: (error: string): StepText => ({
    title: "Client gets an error",
    what: `The server replies with the command tag ERROR. The error is: ${error}`,
    why: "Run on its own (autocommit), the failed statement's transaction is already rolled back. Inside BEGIN … COMMIT, the client would have to ROLLBACK before doing anything else.",
    notice: "The result shows the error. The table is unchanged. The run is complete.",
  }),
  insertDetail: `"0" is a historical field (an object id that's always 0 now) and "1" is the number of rows inserted.`,

  updateWrite: (id: number, slot: number, newSlot: number, changed: string, txid: number, page: number, used: number, capacity: number): StepText => ({
    title: `Write a new version of row ${id}`,
    what: `The old version in slot ${slot} gets xmax = ${txid} (this transaction). A new version with ${changed} changed goes into free slot ${newSlot} of the same page, with xmin = ${txid}. A WAL record describing the change is added.`,
    why: `PostgreSQL never overwrites rows (MVCC): others may still need the old version. No indexed column changed and page ${page} had room (${used} of ${capacity} slots used), so this is a HOT update: ${INDEX} needs no new entry.`,
    notice: `Page ${page} turns dirty (changed in memory, not yet in its data file) and a Heap record appears on the WAL shelf, not yet flushed.`,
  }),
  deleteWrite: (id: number, slot: number, txid: number, page: number): StepText => ({
    title: `Mark row ${id} as deleted`,
    what: `The tuple in slot ${slot} gets xmax = ${txid}. Its bytes stay on the page; once this transaction commits, new snapshots stop seeing it. A WAL record is added.`,
    why: "Transactions that started earlier may still need to read the row, so it can't be erased yet. VACUUM removes it later, when nobody can see it. The index entry also stays until then.",
    notice: `Page ${page} turns dirty and a Heap DELETE record appears on the WAL shelf, not yet flushed.`,
  }),
  changedDetail: (tag: string, kind: StatementKind) => `${tag} means one row was ${kind === "update" ? "updated" : "deleted"}.`,
  noMatchDetail: (id: number | null) => `No row has id = ${id}, so nothing was changed. No transaction id was needed and nothing was written to the WAL.`,

  commit: (page: number): StepText => ({
    title: "Commit: flush the WAL to disk",
    what: `COMMIT adds a commit record and waits until the WAL up to it is written to disk. Page ${page} itself stays dirty in memory; the checkpointer or background writer writes it to the data file later.`,
    why: "Writing one sequential log record is much faster than writing every changed page. If the server crashed now, replaying the WAL would redo the change.",
    notice: `The WAL records turn solid: they're durable. Page ${page} is still marked dirty in the buffer pool.`,
  }),
  writeReturn: (tag: string, detail: string): StepText => ({
    title: `Client gets "${tag}"`,
    what: `The server replies with the command tag ${tag}. ${detail}`,
    why: "Without RETURNING, a write sends back only how many rows it affected, not the rows themselves.",
    notice: "The result shows the row before and after. The run is complete.",
  }),
};

export type SimText = typeof simEn;
