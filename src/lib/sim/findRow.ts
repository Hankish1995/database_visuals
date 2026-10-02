import type { SimText } from "@/lib/sim/text/en";
import { BTREE, INDEX, OTHER_CACHED_PAGES, TABLE, TABLE_PAGES, USERS, USER_COUNT, btreePath, locate, rowsOnPage } from "@/lib/sim/data";
import type { CachedPage, ParsedQuery, SimOptions, SimStep, TupleLocation, UserRow } from "@/lib/sim/types";

export const pageRange = (page: number) => { const r = rowsOnPage(page); return `${r[0].id}–${r.at(-1)!.id}`; };

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
export function findRow(t: SimText, query: ParsedQuery, options: SimOptions): FoundRow {
  return options.useIndex ? viaIndex(t, query, options) : viaScan(t, query, options);
}

function viaIndex(t: SimText, query: ParsedQuery, options: SimOptions): FoundRow {
  const id = query.id!;
  const pointer = locate(id);
  const path = btreePath(id);
  const leaf = BTREE.find((n) => n.id === path.at(-1))!;
  const hit = options.cache === "hit";
  const route = BTREE.filter((n) => path.includes(n.id)).map((n) => `${n.low}–${n.high}`).join(" → ");
  const steps: SimStep[] = [{ id: "index", component: "btree", edge: "executor-btree", btreeNodes: path, ...t.indexLookup(id, route, pointer, leaf) }];
  if (pointer) {
    steps.push({
      id: "buffer", component: "bufferPool", edge: "btree-buffer", checkPages: [pointer.page], cacheResult: options.cache,
      ...t.bufferCheck(pointer.page, hit),
    });
    if (!hit) steps.push(diskRead(t, [pointer.page], t.diskWhyIndex(pointer.page, pageRange(pointer.page))));
  }
  return {
    steps, pointer, row: pointer ? USERS[id - 1] : null,
    initialBuffer: [...OTHER_CACHED_PAGES, ...(hit && pointer ? [{ relation: TABLE, page: pointer.page }] : [])],
    tablePagesVisited: pointer ? [pointer.page] : [], pagesFromDisk: pointer && !hit ? [pointer.page] : [],
    indexPagesVisited: path.length, rowsExamined: pointer ? 1 : 0,
  };
}

function viaScan(t: SimText, query: ParsedQuery, options: SimOptions): FoundRow {
  const id = query.id!;
  const hit = options.cache === "hit";
  // Cold run: one users page happens to be cached already, the rest come from disk.
  const warm = hit ? TABLE_PAGES : [16];
  const cold = TABLE_PAGES.filter((p) => !warm.includes(p));
  const row = locate(id) ? USERS[id - 1] : null;
  const steps: SimStep[] = [{
    id: "buffer", component: "bufferPool", edge: "executor-buffer", checkPages: TABLE_PAGES, cacheResult: hit ? "hit" : "partial",
    ...t.scanCheck(TABLE_PAGES, warm, cold, hit, id),
  }];
  if (!hit) steps.push(diskRead(t, cold, t.diskWhyScan));
  steps.push({ id: "filter", component: "executor", edge: "executor-buffer", ...t.filter(USER_COUNT, id, TABLE_PAGES, row !== null, query.kind === "select") });
  return {
    steps, pointer: null, row, initialBuffer: [...OTHER_CACHED_PAGES, ...warm.map((page) => ({ relation: TABLE, page }))],
    tablePagesVisited: TABLE_PAGES, pagesFromDisk: cold, indexPagesVisited: 0, rowsExamined: USER_COUNT,
  };
}

export function diskRead(t: SimText, pages: number[], why: string): SimStep {
  return { id: "disk", component: "disk", edge: "disk-buffer", loadPages: pages, ...t.disk(pages, why) };
}

/** The plan text, as EXPLAIN would print it, for finding WHERE id = n. */
export function scanPlan(query: ParsedQuery, options: SimOptions): string[] {
  return options.useIndex
    ? [`Index Scan using ${INDEX} on ${TABLE}`, `  Index Cond: (id = ${query.id})`]
    : [`Seq Scan on ${TABLE}`, `  Filter: (id = ${query.id})`];
}
