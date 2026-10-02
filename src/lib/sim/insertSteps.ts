import { INDEX, INSERT_PAGE, NEXT_ID, OTHER_CACHED_PAGES, PAGE_CAPACITY, ROWS_PER_PAGE, TABLE, TXID, btreePath, locate } from "@/lib/sim/data";
import { commonSteps } from "@/lib/sim/commonSteps";
import { diskRead } from "@/lib/sim/findRow";
import { commitStep, writeReturnStep } from "@/lib/sim/writeCommon";
import type { SimText } from "@/lib/sim/text/en";
import type { ParsedQuery, SimOptions, SimStep, Simulation, UserRow } from "@/lib/sim/types";

// INSERT: find a page with room, write the tuple, add the key to the index
// (which also enforces uniqueness), log everything, commit.
export function buildInsert(t: SimText, query: ParsedQuery, options: SimOptions): Simulation {
  const id = query.id ?? NEXT_ID;
  const clash = query.id !== null ? locate(query.id) : null;
  const hit = options.cache === "hit";
  const slot = ROWS_PER_PAGE + 1;
  const row: UserRow = { id, name: query.values.name!, email: query.values.email!, created_at: query.values.created_at ?? new Date().toISOString().slice(0, 10) };
  const path = btreePath(id);
  const plan = [`Insert on ${TABLE}`, "  ->  Result"];
  const error = clash ? `duplicate key value violates unique constraint "${INDEX}" (Key (id)=(${id}) already exists.)` : null;

  const steps: SimStep[] = [...commonSteps(t, query, options, plan), {
    id: "space", component: "bufferPool", edge: "executor-buffer", checkPages: [INSERT_PAGE], cacheResult: options.cache,
    ...t.space(INSERT_PAGE, ROWS_PER_PAGE, PAGE_CAPACITY, hit),
  }];
  if (!hit) steps.push(diskRead(t, [INSERT_PAGE], t.diskWhyInsert));
  steps.push({ id: "write", component: "bufferPool", writePage: INSERT_PAGE, wal: ["Heap INSERT"], ...t.insertWrite(id, row.name, INSERT_PAGE, slot, TXID) });
  steps.push(clash
    ? { id: "index", component: "btree", edge: "buffer-btree", btreeNodes: path, failed: true, ...t.duplicate(id, clash.page, clash.slot) }
    : { id: "index", component: "btree", edge: "buffer-btree", btreeNodes: path, wal: ["Btree INSERT_LEAF"], ...t.indexAdd(id, INSERT_PAGE, slot) });
  steps.push(clash
    ? { id: "abort", component: "wal", edge: "btree-wal", wal: ["Transaction ABORT"], failed: true, ...t.abort(TXID, INSERT_PAGE) }
    : commitStep(t, "btree-wal", INSERT_PAGE));
  steps.push(clash
    ? { ...writeReturnStep(t, "ERROR", ""), ...t.insertFailed(error!), failed: true }
    : writeReturnStep(t, "INSERT 0 1", t.insertDetail));

  return {
    query, kind: "insert", options, plan, steps, rows: [], txid: TXID,
    pointer: clash, rowPage: INSERT_PAGE,
    pointerLabel: clash ? t.keyExists(id, clash.page, clash.slot) : t.keyNew(id, INSERT_PAGE, slot),
    commandTag: clash ? "ERROR" : "INSERT 0 1", error,
    change: { before: null, after: clash ? null : row }, newTuple: { page: INSERT_PAGE, slot },
    initialBuffer: [...OTHER_CACHED_PAGES, ...(hit ? [{ relation: TABLE, page: INSERT_PAGE }] : [])],
    tablePagesVisited: [INSERT_PAGE], pagesFromDisk: hit ? [] : [INSERT_PAGE], indexPagesVisited: path.length, rowsExamined: 0,
  };
}
