import { PAGE_CAPACITY, ROWS_PER_PAGE, TABLE, TXID, locate } from "@/lib/sim/data";
import { commonSteps } from "@/lib/sim/commonSteps";
import { findRow, scanPlan } from "@/lib/sim/findRow";
import { commitStep, writeReturnStep } from "@/lib/sim/writeCommon";
import type { SimText } from "@/lib/sim/text/en";
import type { ParsedQuery, SimOptions, SimStep, Simulation } from "@/lib/sim/types";

// UPDATE and DELETE: find the row exactly as a SELECT would, then change its
// page in memory (MVCC versions, not overwrites), log it, and commit.
export function buildChange(t: SimText, query: ParsedQuery, options: SimOptions): Simulation {
  const update = query.kind === "update";
  const verb = update ? "UPDATE" : "DELETE";
  const found = findRow(t, query, options);
  const plan = [`${update ? "Update" : "Delete"} on ${TABLE}`, ...scanPlan(query, options).map((l) => `  ->  ${l.trim()}`)];
  const row = found.row;
  const at = row ? locate(row.id)! : null;
  const newTuple = update && at ? { page: at.page, slot: ROWS_PER_PAGE + 1 } : null;
  const steps: SimStep[] = [...commonSteps(t, query, options, plan), ...found.steps];

  if (row && at) {
    steps.push(update
      ? { id: "write", component: "bufferPool", writePage: at.page, wal: ["Heap HOT_UPDATE"],
          ...t.updateWrite(row.id, at.slot, newTuple!.slot, Object.keys(query.values).join(", "), TXID, at.page, ROWS_PER_PAGE, PAGE_CAPACITY) }
      : { id: "write", component: "bufferPool", writePage: at.page, wal: ["Heap DELETE"], ...t.deleteWrite(row.id, at.slot, TXID, at.page) });
    steps.push(commitStep(t, "buffer-wal", at.page), writeReturnStep(t, `${verb} 1`, t.changedDetail(`${verb} 1`, query.kind)));
  } else {
    steps.push({ ...writeReturnStep(t, `${verb} 0`, t.noMatchDetail(query.id)), edge: "buffer-client" });
  }

  const after = row && update ? { ...row, ...query.values } : null;
  return {
    query, kind: query.kind, options, plan, steps, rows: [], txid: TXID,
    pointer: found.pointer, rowPage: at?.page ?? null,
    pointerLabel: found.pointer ? t.pointer(found.pointer.page, found.pointer.slot) : null,
    commandTag: `${verb} ${row ? 1 : 0}`, error: null,
    change: row ? { before: row, after } : null, newTuple,
    initialBuffer: found.initialBuffer, tablePagesVisited: found.tablePagesVisited, pagesFromDisk: found.pagesFromDisk,
    indexPagesVisited: found.indexPagesVisited, rowsExamined: found.rowsExamined,
  };
}

