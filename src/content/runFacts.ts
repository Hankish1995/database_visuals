import { BUFFER_SLOTS, INDEX, PAGE_SIZE_KB, TABLE, TABLE_PAGES } from "@/lib/sim/data";
import type { SceneState } from "@/lib/sim/sceneState";
import type { ComponentId, ConceptId, Simulation } from "@/lib/sim/types";
import { RUN_TEXT, type RunText } from "@/content/runFactsText";
import type { Locale } from "@/lib/prefs";

export type Tone = "neutral" | "active" | "ok" | "miss" | "info";
export interface RunStatus { tone: Tone; title: string; body: string }
export type Extra = "parseTree" | "plan" | "page" | "result" | "wal";
export interface RunFacts { status: RunStatus; rows: [string, string][]; extra: Extra | null }

const pagesText = (t: RunText, pages: number[]) => (pages.length ? pages.join(", ") : t.none);

/** What the inspector says about one concept in the current run. */
export function runFacts(concept: ConceptId, sim: Simulation, scene: SceneState, locale: Locale = "en"): RunFacts {
  const t = RUN_TEXT[locale];
  return { status: statusOf(t, concept, sim, scene), rows: detailsOf(t, concept, sim, scene), extra: EXTRAS[concept] ?? null };
}

const EXTRAS: Partial<Record<ConceptId, Extra | null>> = {
  client: "result", parser: "parseTree", planner: "plan", executor: "plan", btree: null, bufferPool: "page", disk: "page", row: "result", cache: null, wal: "wal",
};

function statusOf(t: RunText, concept: ConceptId, sim: Simulation, scene: SceneState): RunStatus {
  if (scene.status === "idle") return { tone: "neutral", ...t.notRun };
  if (concept === "wal" && sim.kind === "select") return { tone: "neutral", ...t.walRead };
  if (concept === "wal" && scene.wal.length > 0) {
    const flushed = scene.wal.every((w) => w.flushed);
    if (scene.failed) return { tone: "miss", ...t.walAborted };
    return flushed ? { tone: "ok", ...t.walFlushed } : { tone: "active", ...t.walPending(scene.wal.length) };
  }
  if (concept === "btree" && !sim.options.useIndex && sim.kind !== "insert") return { tone: "neutral", ...t.indexOff(INDEX) };
  if ((concept === "bufferPool" || concept === "cache") && scene.cacheResult) return cacheStatus(t, sim, scene);
  if (concept === "cache") return { tone: "neutral", ...t.noPageYet };
  if (concept === "disk" && sim.pagesFromDisk.length === 0 && (scene.status === "done" || scene.cacheResult)) {
    return { tone: "ok", ...t.noDiskRead };
  }
  const component = concept as ComponentId;
  if (scene.active === component) return { tone: "active", title: t.activeNow, body: scene.step?.title ?? "" };
  if (scene.visited.has(component)) return { tone: "ok", ...t.finished(sim.steps.length) };
  return { tone: "neutral", ...t.notReached };
}

function cacheStatus(t: RunText, sim: Simulation, scene: SceneState): RunStatus {
  const checked = sim.tablePagesVisited;
  if (scene.cacheResult === "hit") return { tone: "ok", ...t.cacheHit(checked) };
  const missing = sim.pagesFromDisk;
  return { tone: "miss", ...t.cacheMiss(missing, checked.length, scene.cacheResult === "partial") };
}

function detailsOf(t: RunText, concept: ConceptId, sim: Simulation, scene: SceneState): [string, string][] {
  const { query, options } = sim;
  const done = scene.status === "done" || scene.resultShown;
  const r = t.rows;
  const pages = (p: number[]) => pagesText(t, p);
  switch (concept) {
    case "client": return [[r.statement, query.sql], [r.serverReplied, done ? sim.commandTag : r.waiting]];
    case "parser": return [[r.statement, query.kind.toUpperCase()], [r.table, TABLE],
      ...(query.kind === "select" ? [[r.columns, query.selectAll ? r.allColumns : query.columns.join(", ")] as [string, string]] : []),
      ...(Object.keys(query.values).length ? [[query.kind === "insert" ? r.valuesFor : "SET", Object.keys(query.values).join(", ")] as [string, string]] : []),
      ...(query.kind === "insert" ? [] : [[r.filter, `id = ${query.id}`] as [string, string]])];
    case "planner": return [[r.plan, sim.plan.map((l) => l.replace(/^\s*(->\s*)?/, "")).join(" → ")], [r.indexPagesToRead, String(sim.indexPagesVisited)], [r.tablePagesToRead, String(sim.tablePagesVisited.length)]];
    case "executor": return [[r.topNode, sim.plan[0]], [r.rowsExamined, String(sim.rowsExamined)],
      [query.kind === "select" ? r.rowsReturned : r.rowsChanged, query.kind === "select" ? String(sim.rows.length) : sim.error ? r.zeroFailed : String(sim.change?.after || sim.change?.before ? 1 : 0)]];
    case "btree": return [[r.index, `${INDEX} on ${TABLE}(id)`], [r.levels, r.levelsValue], [r.key, String(query.id ?? sim.change?.after?.id ?? "")],
      [r.entry, sim.pointerLabel ?? (options.useIndex ? r.keyNotFound : r.notUsed)], [r.indexPagesVisited, String(sim.indexPagesVisited)]];
    case "bufferPool": return [[r.slots, r.slotsValue(scene.buffer.filter(Boolean).length, BUFFER_SLOTS)], [r.usersPagesInMemory, pages(scene.buffer.flatMap((p) => (p?.relation === TABLE ? [p.page] : [])))],
      [r.pagesNeeded, pages(sim.tablePagesVisited)], [r.dirty, pages(scene.dirtyPages)]];
    case "wal": return [[r.transaction, query.kind === "select" ? r.noneNeeded : String(sim.txid)], [r.recordsSoFar, String(scene.wal.length)],
      [r.flushedToDisk, scene.wal.length ? (scene.wal.every((w) => w.flushed) ? r.yes : r.notYet) : r.nothingToFlush]];
    case "disk": return [[r.pageSize, `${PAGE_SIZE_KB} KB`], [r.usersTablePages, `${TABLE_PAGES[0]}–${TABLE_PAGES.at(-1)}`], [r.readFromDisk, pages(sim.pagesFromDisk)]];
    case "row": if (query.kind !== "select") return [[r.commandTag, sim.commandTag], [r.transaction, String(sim.txid)], ...(sim.newTuple && !sim.error ? [[r.newVersionAt, r.pageSlot(sim.newTuple.page, sim.newTuple.slot)] as [string, string]] : [])];
      return sim.rows.length && sim.rowPage
      ? [[r.location, sim.pointer ? r.pageSlot(sim.pointer.page, sim.pointer.slot) : r.pageOnly(sim.rowPage)], [r.columnsReturned, query.columns.join(", ")]]
      : [[r.matchingRows, "0"]];
    default: return [];
    case "cache": return [[r.mode, options.cache === "hit" ? r.warmCache : r.coldCache], [r.pagesFromMemory, String(sim.tablePagesVisited.length - sim.pagesFromDisk.length)], [r.pagesFromDisk, String(sim.pagesFromDisk.length)]];
  }
}
