import { INDEX, PAGE_CAPACITY, ROWS_PER_PAGE, TABLE, TXID, locate } from "@/lib/sim/data";
import { commonSteps } from "@/lib/sim/commonSteps";
import { findRow, scanPlan } from "@/lib/sim/findRow";
import { commitStep, writeReturnStep } from "@/lib/sim/writeCommon";
import type { ParsedQuery, SimOptions, SimStep, Simulation } from "@/lib/sim/types";

// UPDATE and DELETE: find the row exactly as a SELECT would, then change its
// page in memory (MVCC versions, not overwrites), log it, and commit.
export function buildChange(query: ParsedQuery, options: SimOptions): Simulation {
  const update = query.kind === "update";
  const verb = update ? "UPDATE" : "DELETE";
  const found = findRow(query, options);
  const plan = [`${update ? "Update" : "Delete"} on ${TABLE}`, ...scanPlan(query, options).map((l) => `  ->  ${l.trim()}`)];
  const row = found.row;
  const at = row ? locate(row.id)! : null;
  const newTuple = update && at ? { page: at.page, slot: ROWS_PER_PAGE + 1 } : null;
  const steps: SimStep[] = [...commonSteps(query, options, plan), ...found.steps];

  if (row && at) {
    const changed = Object.keys(query.values).join(", ");
    steps.push(update ? {
      id: "write", component: "bufferPool", writePage: at.page, wal: ["Heap HOT_UPDATE"],
      title: `Write a new version of row ${row.id}`,
      what: `The old version in slot ${at.slot} gets xmax = ${TXID} (this transaction). A new version with ${changed} changed goes into free slot ${newTuple!.slot} of the same page, with xmin = ${TXID}. A WAL record describing the change is added.`,
      why: `PostgreSQL never overwrites rows (MVCC): others may still need the old version. No indexed column changed and page ${at.page} had room (${ROWS_PER_PAGE} of ${PAGE_CAPACITY} slots used), so this is a HOT update: ${INDEX} needs no new entry.`,
      notice: `Page ${at.page} turns dirty (changed in memory, not yet in its data file) and a Heap record appears on the WAL shelf, not yet flushed.`,
    } : {
      id: "write", component: "bufferPool", writePage: at.page, wal: ["Heap DELETE"],
      title: `Mark row ${row.id} as deleted`,
      what: `The tuple in slot ${at.slot} gets xmax = ${TXID}. Its bytes stay on the page; once this transaction commits, new snapshots stop seeing it. A WAL record is added.`,
      why: `Transactions that started earlier may still need to read the row, so it can't be erased yet. VACUUM removes it later, when nobody can see it. The index entry also stays until then.`,
      notice: `Page ${at.page} turns dirty and a Heap DELETE record appears on the WAL shelf, not yet flushed.`,
    });
    steps.push(commitStep("buffer-wal", at.page), writeReturnStep(`${verb} 1`, `${verb} 1 means one row was ${update ? "updated" : "deleted"}.`));
  } else {
    steps.push({
      ...writeReturnStep(`${verb} 0`, `No row has id = ${query.id}, so nothing was changed. No transaction id was needed and nothing was written to the WAL.`),
      edge: "buffer-client",
    });
  }

  const after = row && update ? { ...row, ...query.values } : null;
  return {
    query, kind: query.kind, options, plan, steps, rows: [], txid: TXID,
    pointer: found.pointer, rowPage: at?.page ?? null,
    pointerLabel: found.pointer ? `→ page ${found.pointer.page}, slot ${found.pointer.slot}` : null,
    commandTag: `${verb} ${row ? 1 : 0}`, error: null,
    change: row ? { before: row, after } : null, newTuple,
    initialBuffer: found.initialBuffer, tablePagesVisited: found.tablePagesVisited, pagesFromDisk: found.pagesFromDisk,
    indexPagesVisited: found.indexPagesVisited, rowsExamined: found.rowsExamined,
  };
}

