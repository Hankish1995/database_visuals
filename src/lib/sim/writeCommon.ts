import type { EdgeId, SimStep } from "@/lib/sim/types";

/** COMMIT: the commit record, then a WAL flush. The data page stays dirty in memory. */
export function commitStep(edge: EdgeId, page: number): SimStep {
  return {
    id: "commit", component: "wal", edge, wal: ["Transaction COMMIT"], flush: true,
    title: "Commit: flush the WAL to disk",
    what: `COMMIT adds a commit record and waits until the WAL up to it is written to disk. Page ${page} itself stays dirty in memory; the checkpointer or background writer writes it to the data file later.`,
    why: "Writing one sequential log record is much faster than writing every changed page. If the server crashed now, replaying the WAL would redo the change.",
    notice: "The WAL records turn solid: they're durable. Page " + page + " is still marked dirty in the buffer pool.",
  };
}

export function writeReturnStep(tag: string, detail: string): SimStep {
  return {
    id: "return", component: "row", edge: "wal-client",
    title: `Client gets "${tag}"`,
    what: `The server replies with the command tag ${tag}. ${detail}`,
    why: "Without RETURNING, a write sends back only how many rows it affected, not the rows themselves.",
    notice: "The result shows the row before and after. The run is complete.",
  };
}
