import { TXID, locate } from "@/lib/sim/data";
import { commonSteps, returnStep } from "@/lib/sim/commonSteps";
import { findRow, scanPlan } from "@/lib/sim/findRow";
import { buildInsert } from "@/lib/sim/insertSteps";
import { buildChange } from "@/lib/sim/changeSteps";
import { simEn, type SimText } from "@/lib/sim/text/en";
import type { ParsedQuery, SimOptions, Simulation } from "@/lib/sim/types";

/** Builds the full, deterministic step sequence for one statement, narrated in `t`'s language. */
export function buildSimulation(query: ParsedQuery, options: SimOptions, t: SimText = simEn): Simulation {
  if (query.kind === "insert") return buildInsert(t, query, options);
  if (query.kind === "update" || query.kind === "delete") return buildChange(t, query, options);
  return buildSelect(t, query, options);
}

function buildSelect(t: SimText, query: ParsedQuery, options: SimOptions): Simulation {
  const found = findRow(t, query, options);
  const plan = scanPlan(query, options);
  const rows = found.row ? [found.row] : [];
  const source = found.pointer ? t.source(found.pointer.page, found.pointer.slot) : found.row ? t.source(locate(query.id!)!.page, null) : null;
  return {
    query, kind: "select", options, plan, rows, txid: TXID,
    steps: [...commonSteps(t, query, options, plan), ...found.steps, returnStep(t, query, rows, source)],
    pointer: found.pointer, rowPage: found.row ? locate(query.id!)!.page : null,
    pointerLabel: found.pointer ? t.pointer(found.pointer.page, found.pointer.slot) : null,
    commandTag: `SELECT ${rows.length}`, error: null, change: null, newTuple: null,
    initialBuffer: found.initialBuffer, tablePagesVisited: found.tablePagesVisited, pagesFromDisk: found.pagesFromDisk,
    indexPagesVisited: found.indexPagesVisited, rowsExamined: found.rowsExamined,
  };
}
