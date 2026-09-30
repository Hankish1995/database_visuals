import { BUFFER_SLOTS, INDEX, PAGE_SIZE_KB, TABLE, TABLE_PAGES } from "@/lib/sim/data";
import type { SceneState } from "@/lib/sim/sceneState";
import type { ComponentId, ConceptId, Simulation } from "@/lib/sim/types";

export type Tone = "neutral" | "active" | "ok" | "miss" | "info";
export interface RunStatus { tone: Tone; title: string; body: string }
export type Extra = "parseTree" | "plan" | "page" | "result" | "wal";
export interface RunFacts { status: RunStatus; rows: [string, string][]; extra: Extra | null }

const pagesText = (pages: number[]) => (pages.length ? pages.join(", ") : "none");

/** What the inspector says about one concept in the current run. */
export function runFacts(concept: ConceptId, sim: Simulation, scene: SceneState): RunFacts {
  return { status: statusOf(concept, sim, scene), rows: detailsOf(concept, sim, scene), extra: EXTRAS[concept] ?? null };
}

const EXTRAS: Partial<Record<ConceptId, Extra | null>> = {
  client: "result", parser: "parseTree", planner: "plan", executor: "plan", btree: null, bufferPool: "page", disk: "page", row: "result", cache: null, wal: "wal",
};

function statusOf(concept: ConceptId, sim: Simulation, scene: SceneState): RunStatus {
  if (scene.status === "idle") return { tone: "neutral", title: "Not run yet", body: "Press Run query to watch this part of the query flow." };
  if (concept === "wal" && sim.kind === "select") return { tone: "neutral", title: "Not used by a read", body: "A SELECT changes nothing, so it writes nothing to the WAL." };
  if (concept === "wal" && scene.wal.length > 0) {
    const flushed = scene.wal.every((w) => w.flushed);
    if (scene.failed) return { tone: "miss", title: "Aborted", body: "The transaction failed; its abort record needs no flush and its changes stay invisible." };
    return flushed ? { tone: "ok", title: "Flushed: the change is durable", body: "COMMIT waited for these records to reach disk." }
      : { tone: "active", title: `${scene.wal.length} record(s) waiting in memory`, body: "They reach disk at COMMIT." };
  }
  if (concept === "btree" && !sim.options.useIndex && sim.kind !== "insert") return { tone: "neutral", title: "Not used in this plan", body: `${INDEX} is disabled, so the planner chose a sequential scan.` };
  if ((concept === "bufferPool" || concept === "cache") && scene.cacheResult) return cacheStatus(sim, scene);
  if (concept === "cache") return { tone: "neutral", title: "No page checked yet", body: "The buffer pool hasn't been asked for a users page yet." };
  if (concept === "disk" && sim.pagesFromDisk.length === 0 && (scene.status === "done" || scene.cacheResult)) {
    return { tone: "ok", title: "No disk read needed", body: "Every page this query needed was already in memory." };
  }
  const component = concept as ComponentId;
  if (scene.active === component) return { tone: "active", title: "Active now", body: scene.step?.title ?? "" };
  if (scene.visited.has(component)) return { tone: "ok", title: "Done", body: `Finished its part of this ${sim.steps.length}-step run.` };
  return { tone: "neutral", title: "Not reached yet", body: "This component comes later in the run." };
}

function cacheStatus(sim: Simulation, scene: SceneState): RunStatus {
  const checked = sim.tablePagesVisited;
  if (scene.cacheResult === "hit") {
    return { tone: "ok", title: "Cache hit: page found in memory", body: `${checked.length === 1 ? `Page ${checked[0]} was` : "All pages were"} already in the buffer pool, so no disk read was needed.` };
  }
  const missing = sim.pagesFromDisk;
  return {
    tone: "miss",
    title: scene.cacheResult === "partial" ? `Cache miss on ${missing.length} of ${checked.length} pages` : "Cache miss: page read from disk",
    body: `${missing.length === 1 ? `Page ${missing[0]} was` : `Pages ${missing.join(", ")} were`} not in the buffer pool, so the database read ${missing.length === 1 ? "it" : "them"} from disk into memory.`,
  };
}

function detailsOf(concept: ConceptId, sim: Simulation, scene: SceneState): [string, string][] {
  const { query, options } = sim;
  const done = scene.status === "done" || scene.resultShown;
  switch (concept) {
    case "client": return [["Statement", query.sql], ["Server replied", done ? sim.commandTag : "waiting"]];
    case "parser": return [["Statement", query.kind.toUpperCase()], ["Table", TABLE],
      ...(query.kind === "select" ? [["Columns", query.selectAll ? "* (all)" : query.columns.join(", ")] as [string, string]] : []),
      ...(Object.keys(query.values).length ? [[query.kind === "insert" ? "Values for" : "SET", Object.keys(query.values).join(", ")] as [string, string]] : []),
      ...(query.kind === "insert" ? [] : [["Filter", `id = ${query.id}`] as [string, string]])];
    case "planner": return [["Plan", sim.plan.map((l) => l.replace(/^\s*(->\s*)?/, "")).join(" → ")], ["Index pages to read", String(sim.indexPagesVisited)], ["Table pages to read", String(sim.tablePagesVisited.length)]];
    case "executor": return [["Top plan node", sim.plan[0]], ["Rows examined", String(sim.rowsExamined)],
      [query.kind === "select" ? "Rows returned" : "Rows changed", query.kind === "select" ? String(sim.rows.length) : sim.error ? "0 (failed)" : String(sim.change?.after || sim.change?.before ? 1 : 0)]];
    case "btree": return [["Index", `${INDEX} on ${TABLE}(id)`], ["Levels", "3 (root, inner, leaf)"], ["Key", String(query.id ?? sim.change?.after?.id ?? "")],
      ["Entry", sim.pointerLabel ?? (options.useIndex ? "key not found" : "not used")], ["Index pages visited", String(sim.indexPagesVisited)]];
    case "bufferPool": return [["Slots", `${scene.buffer.filter(Boolean).length} of ${BUFFER_SLOTS} in use`], ["users pages in memory", pagesText(scene.buffer.flatMap((p) => (p?.relation === TABLE ? [p.page] : [])))],
      ["Pages this statement needs", pagesText(sim.tablePagesVisited)], ["Dirty (changed, not yet written)", pagesText(scene.dirtyPages)]];
    case "wal": return [["Transaction", query.kind === "select" ? "none needed" : String(sim.txid)], ["Records so far", String(scene.wal.length)],
      ["Flushed to disk", scene.wal.length ? (scene.wal.every((w) => w.flushed) ? "yes" : "not yet") : "nothing to flush"]];
    case "disk": return [["Page size", `${PAGE_SIZE_KB} KB`], ["users table pages", `${TABLE_PAGES[0]}–${TABLE_PAGES.at(-1)}`], ["Read from disk this run", pagesText(sim.pagesFromDisk)]];
    case "row": if (query.kind !== "select") return [["Command tag", sim.commandTag], ["Transaction", String(sim.txid)], ...(sim.newTuple && !sim.error ? [["New version at", `page ${sim.newTuple.page}, slot ${sim.newTuple.slot}`] as [string, string]] : [])];
      return sim.rows.length && sim.rowPage
      ? [["Location", sim.pointer ? `page ${sim.pointer.page}, slot ${sim.pointer.slot}` : `page ${sim.rowPage}`], ["Columns returned", query.columns.join(", ")]]
      : [["Matching rows", "0"]];
    default: return [];
    case "cache": return [["Mode for this run", options.cache === "hit" ? "Warm cache (hit)" : "Cold cache (miss)"], ["Pages from memory", String(sim.tablePagesVisited.length - sim.pagesFromDisk.length)], ["Pages from disk", String(sim.pagesFromDisk.length)]];
  }
}
