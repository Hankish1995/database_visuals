import { TXID, locate } from "@/lib/sim/data";
import { commonSteps, returnStep } from "@/lib/sim/commonSteps";
import { findRow, scanPlan } from "@/lib/sim/findRow";
import { buildInsert } from "@/lib/sim/insertSteps";
import { buildChange } from "@/lib/sim/changeSteps";
import type { ParsedQuery, SimOptions, Simulation } from "@/lib/sim/types";

/** Builds the full, deterministic step sequence for one statement. */
export function buildSimulation(query: ParsedQuery, options: SimOptions): Simulation {
  if (query.kind === "insert") return buildInsert(query, options);
  if (query.kind === "update" || query.kind === "delete") return buildChange(query, options);
  return buildSelect(query, options);
}

function buildSelect(query: ParsedQuery, options: SimOptions): Simulation {
  const found = findRow(query, options);
  const plan = scanPlan(query, options);
  const rows = found.row ? [found.row] : [];
  const source = found.pointer ? `slot ${found.pointer.slot} of page ${found.pointer.page}` : found.row ? `page ${locate(query.id!)!.page}` : null;
  return {
    query, kind: "select", options, plan, rows, txid: TXID,
    steps: [...commonSteps(query, options, plan), ...found.steps, returnStep(query, rows, source)],
    pointer: found.pointer, rowPage: found.row ? locate(query.id!)!.page : null,
    pointerLabel: found.pointer ? `→ page ${found.pointer.page}, slot ${found.pointer.slot}` : null,
    commandTag: `SELECT ${rows.length}`, error: null, change: null, newTuple: null,
    initialBuffer: found.initialBuffer, tablePagesVisited: found.tablePagesVisited, pagesFromDisk: found.pagesFromDisk,
    indexPagesVisited: found.indexPagesVisited, rowsExamined: found.rowsExamined,
  };
}
