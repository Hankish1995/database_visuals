import { BTREE, INDEX, OTHER_CACHED_PAGES, TABLE, TABLE_PAGES, USERS, USER_COUNT, btreePath, locate, rowsOnPage } from "@/lib/sim/data";
import type { CachedPage, ParsedQuery, SimOptions, SimStep, TupleLocation, UserRow } from "@/lib/sim/types";

export const pageRange = (page: number) => { const r = rowsOnPage(page); return `${r[0].id}–${r.at(-1)!.id}`; };
export const pageList = (pages: number[]) => pages.length === 1 ? `page ${pages[0]}` : `pages ${pages.slice(0, -1).join(", ")} and ${pages.at(-1)}`;

export interface FoundRow {
  steps: SimStep[];
  pointer: TupleLocation | null;
  row: UserRow | null;
  initialBuffer: CachedPage[];
  tablePagesVisited: number[];
  pagesFromDisk: number[];
  indexPagesVisited: number;
  rowsExamined: number;
}

/** The steps that locate WHERE id = n: through the index, or by scanning every page. Shared by SELECT, UPDATE and DELETE. */
export function findRow(query: ParsedQuery, options: SimOptions): FoundRow {
  return options.useIndex ? viaIndex(query, options) : viaScan(query, options);
}

function viaIndex(query: ParsedQuery, options: SimOptions): FoundRow {
  const id = query.id!;
  const pointer = locate(id);
  const path = btreePath(id);
  const leaf = BTREE.find((n) => n.id === path.at(-1))!;
  const hit = options.cache === "hit";
  const route = BTREE.filter((n) => path.includes(n.id)).map((n) => `${n.low}–${n.high}`).join(" → ");
  const steps: SimStep[] = [{
    id: "index", component: "btree", edge: "executor-btree", btreeNodes: path,
    title: pointer ? `Index finds key ${id}` : `Index has no key ${id}`,
    what: pointer
      ? `The executor descends ${INDEX} from root to leaf (${route}). The leaf entry for ${id} points to table page ${pointer.page}, slot ${pointer.slot}.`
      : `The executor descends ${INDEX} (${route}). Leaf ${leaf.low}–${leaf.high} has no entry for ${id}, so no table page is needed.`,
    why: "A B-tree keeps keys sorted, so a lookup reads a few index pages instead of every table page.",
    notice: pointer
      ? `The violet nodes on the path light up and the pointer (page ${pointer.page}, slot ${pointer.slot}) appears under the leaf.`
      : "The path stops at a leaf and no pointer is produced.",
  }];
  if (pointer) {
    steps.push({
      id: "buffer", component: "bufferPool", edge: "btree-buffer", checkPages: [pointer.page], cacheResult: options.cache,
      title: `Check the buffer pool for page ${pointer.page}`,
      what: `The database looks for page ${pointer.page} of ${TABLE} in the buffer pool. ${hit ? "It's already there: a cache hit." : "It isn't there: a cache miss."}`,
      why: "Memory is far faster than disk, so every page request, read or write, checks the shared cache first.",
      notice: hit ? `Page ${pointer.page} is highlighted in memory and the status reads Cache hit. No disk read follows.` : "The status card reads Cache miss. The page has to come from disk next.",
    });
    if (!hit) steps.push(diskRead([pointer.page], `Databases move whole pages, not single rows. Page ${pointer.page} holds ids ${pageRange(pointer.page)}, so neighbours arrive too.`));
  }
  return {
    steps, pointer, row: pointer ? USERS[id - 1] : null,
    initialBuffer: [...OTHER_CACHED_PAGES, ...(hit && pointer ? [{ relation: TABLE, page: pointer.page }] : [])],
    tablePagesVisited: pointer ? [pointer.page] : [], pagesFromDisk: pointer && !hit ? [pointer.page] : [],
    indexPagesVisited: path.length, rowsExamined: pointer ? 1 : 0,
  };
}

function viaScan(query: ParsedQuery, options: SimOptions): FoundRow {
  const id = query.id!;
  const hit = options.cache === "hit";
  // Cold run: one users page happens to be cached already, the rest come from disk.
  const warm = hit ? TABLE_PAGES : [16];
  const cold = TABLE_PAGES.filter((p) => !warm.includes(p));
  const row = locate(id) ? USERS[id - 1] : null;
  const steps: SimStep[] = [{
    id: "buffer", component: "bufferPool", edge: "executor-buffer", checkPages: TABLE_PAGES, cacheResult: hit ? "hit" : "partial",
    title: `Check the buffer pool for ${pageList(TABLE_PAGES)}`,
    what: hit
      ? `A sequential scan asks for every page of ${TABLE}, in order. All ${TABLE_PAGES.length} are already in the buffer pool.`
      : `A sequential scan asks for every page of ${TABLE}, in order. Only ${pageList(warm)} is cached; ${pageList(cold)} are not.`,
    why: `Without using the index there's no way to know which page holds id ${id}, so every page must be read.`,
    notice: hit ? "All four users pages are highlighted in memory." : "Cached pages are highlighted; the status card reports the misses.",
  }];
  if (!hit) steps.push(diskRead(cold, "The executor can only examine rows that are in memory, and pages are the unit of I/O."));
  steps.push({
    id: "filter", component: "executor", edge: "executor-buffer",
    title: `Test all ${USER_COUNT} rows against id = ${id}`,
    what: `Every row on ${pageList(TABLE_PAGES)} is compared with the filter. ${row ? "One row matches." : "No row matches."}`,
    why: "Without the index the executor can't know the match is unique or where it is, so the scan can't stop early.",
    notice: `${USER_COUNT} rows examined to ${query.kind === "select" ? "return" : "change"} ${row ? 1 : 0}. On a real table that could be millions.`,
  });
  return {
    steps, pointer: null, row, initialBuffer: [...OTHER_CACHED_PAGES, ...warm.map((page) => ({ relation: TABLE, page }))],
    tablePagesVisited: TABLE_PAGES, pagesFromDisk: cold, indexPagesVisited: 0, rowsExamined: USER_COUNT,
  };
}

export function diskRead(pages: number[], why: string): SimStep {
  return {
    id: "disk", component: "disk", edge: "disk-buffer", loadPages: pages,
    title: `Read ${pageList(pages)} from disk`,
    what: `${pages.length === 1 ? `The whole 8 KB page ${pages[0]} is` : "The missing pages are"} read from the table's data file into ${pages.length === 1 ? "a free buffer slot" : "free buffer slots"}.`,
    why,
    notice: `${pageList(pages).replace(/^p/, "P")} ${pages.length === 1 ? "travels" : "travel"} from the disk shelf into the buffer pool, where later queries can reuse ${pages.length === 1 ? "it" : "them"}.`,
  };
}

/** The plan text, as EXPLAIN would print it, for finding WHERE id = n. */
export function scanPlan(query: ParsedQuery, options: SimOptions): string[] {
  return options.useIndex
    ? [`Index Scan using ${INDEX} on ${TABLE}`, `  Index Cond: (id = ${query.id})`]
    : [`Seq Scan on ${TABLE}`, `  Filter: (id = ${query.id})`];
}
