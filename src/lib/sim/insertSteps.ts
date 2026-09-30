import { INDEX, INSERT_PAGE, NEXT_ID, OTHER_CACHED_PAGES, PAGE_CAPACITY, ROWS_PER_PAGE, TABLE, TXID, btreePath, locate } from "@/lib/sim/data";
import { commonSteps } from "@/lib/sim/commonSteps";
import { diskRead } from "@/lib/sim/findRow";
import { commitStep, writeReturnStep } from "@/lib/sim/writeCommon";
import type { ParsedQuery, SimOptions, SimStep, Simulation, UserRow } from "@/lib/sim/types";

// INSERT: find a page with room, write the tuple, add the key to the index
// (which also enforces uniqueness), log everything, commit.
export function buildInsert(query: ParsedQuery, options: SimOptions): Simulation {
  const id = query.id ?? NEXT_ID;
  const clash = query.id !== null ? locate(query.id) : null;
  const hit = options.cache === "hit";
  const slot = ROWS_PER_PAGE + 1;
  const row: UserRow = { id, name: query.values.name!, email: query.values.email!, created_at: query.values.created_at ?? new Date().toISOString().slice(0, 10) };
  const path = btreePath(id);
  const plan = [`Insert on ${TABLE}`, "  ->  Result"];
  const error = clash ? `duplicate key value violates unique constraint "${INDEX}" (Key (id)=(${id}) already exists.)` : null;

  const steps: SimStep[] = [...commonSteps(query, options, plan), {
    id: "space", component: "bufferPool", edge: "executor-buffer", checkPages: [INSERT_PAGE], cacheResult: options.cache,
    title: `Find room: page ${INSERT_PAGE}`,
    what: `The free space map says page ${INSERT_PAGE} has room (${ROWS_PER_PAGE} of ${PAGE_CAPACITY} slots used), so the new row goes there. Page ${INSERT_PAGE} is ${hit ? "already in the buffer pool: a cache hit" : "not in the buffer pool: a cache miss"}.`,
    why: "A heap table keeps rows in no particular order: a new row goes wherever there's space, not next to its neighbouring ids.",
    notice: hit ? `Page ${INSERT_PAGE} is highlighted in memory.` : `The status card reads Cache miss: page ${INSERT_PAGE} must be read first, even to add a row to it.`,
  }];
  if (!hit) steps.push(diskRead([INSERT_PAGE], "A page must be in memory to change it, even just to add a row."));
  steps.push({
    id: "write", component: "bufferPool", writePage: INSERT_PAGE, wal: ["Heap INSERT"],
    title: `Write the new tuple into page ${INSERT_PAGE}`,
    what: `The row (id ${id}, '${row.name}') is placed in slot ${slot} with xmin = ${TXID}, this transaction's id. Until it commits, no other transaction can see it. A Heap INSERT record is added to the WAL.`,
    why: "The change happens in memory; the WAL record is what makes it recoverable if the server crashes before the page is written out.",
    notice: `Page ${INSERT_PAGE} turns dirty, and a Heap INSERT record appears on the WAL shelf, not yet flushed.`,
  });
  steps.push(clash ? {
    id: "index", component: "btree", edge: "buffer-btree", btreeNodes: path, failed: true,
    title: `Duplicate key: id ${id} already exists`,
    what: `Adding ${id} to ${INDEX}, the leaf already holds ${id} (pointing to page ${clash.page}, slot ${clash.slot}), and that row is live. The primary key must be unique, so the insert fails.`,
    why: "Uniqueness is checked in the index at the moment the key is added; the heap tuple was already written, which is why the failure has to roll back.",
    notice: "The existing entry is highlighted under the leaf and the step is marked as an error.",
  } : {
    id: "index", component: "btree", edge: "buffer-btree", btreeNodes: path, wal: ["Btree INSERT_LEAF"],
    title: `Add key ${id} to ${INDEX}`,
    what: `The executor descends ${INDEX} to the right leaf and adds ${id} → (page ${INSERT_PAGE}, slot ${slot}). The key is new, so the uniqueness check passes. A Btree record is added to the WAL.`,
    why: "Every index on a table must learn about every new row, which is why each extra index makes writes slower.",
    notice: `The new entry appears under the leaf, and a second record joins the WAL shelf.`,
  });
  steps.push(clash ? {
    id: "abort", component: "wal", edge: "btree-wal", wal: ["Transaction ABORT"], failed: true,
    title: "The transaction aborts",
    what: `The error aborts transaction ${TXID}. An abort record is logged. The tuple already written to page ${INSERT_PAGE} stays there, but its xmin is an aborted transaction, so nobody will ever see it; VACUUM reclaims it later.`,
    why: "Atomicity: a failed statement leaves no visible trace, even though some of its work reached the page.",
    notice: "An ABORT record joins the WAL shelf. Nothing needs to be flushed for an abort.",
  } : commitStep("btree-wal", INSERT_PAGE));
  steps.push(clash
    ? {
        ...writeReturnStep("ERROR", `The error is: ${error}`), title: "Client gets an error", failed: true,
        why: "Run on its own (autocommit), the failed statement's transaction is already rolled back. Inside BEGIN … COMMIT, the client would have to ROLLBACK before doing anything else.",
        notice: "The result shows the error. The table is unchanged. The run is complete.",
      }
    : writeReturnStep("INSERT 0 1", `"0" is a historical field (an object id that's always 0 now) and "1" is the number of rows inserted.`));

  return {
    query, kind: "insert", options, plan, steps, rows: [], txid: TXID,
    pointer: clash, rowPage: INSERT_PAGE,
    pointerLabel: clash ? `${id} exists → page ${clash.page}, slot ${clash.slot}` : `${id} → page ${INSERT_PAGE}, slot ${slot} (new)`,
    commandTag: clash ? "ERROR" : "INSERT 0 1", error,
    change: { before: null, after: clash ? null : row }, newTuple: { page: INSERT_PAGE, slot },
    initialBuffer: [...OTHER_CACHED_PAGES, ...(hit ? [{ relation: TABLE, page: INSERT_PAGE }] : [])],
    tablePagesVisited: [INSERT_PAGE], pagesFromDisk: hit ? [] : [INSERT_PAGE], indexPagesVisited: path.length, rowsExamined: 0,
  };
}
