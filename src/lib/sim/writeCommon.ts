import type { SimText } from "@/lib/sim/text/en";
import type { EdgeId, SimStep } from "@/lib/sim/types";

/** COMMIT: the commit record, then a WAL flush. The data page stays dirty in memory. */
export function commitStep(t: SimText, edge: EdgeId, page: number): SimStep {
  return { id: "commit", component: "wal", edge, wal: ["Transaction COMMIT"], flush: true, ...t.commit(page) };
}

export function writeReturnStep(t: SimText, tag: string, detail: string): SimStep {
  return { id: "return", component: "row", edge: "wal-client", ...t.writeReturn(tag, detail) };
}
