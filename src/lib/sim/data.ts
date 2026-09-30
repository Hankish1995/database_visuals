import type { CachedPage, TupleLocation, UserRow } from "@/lib/sim/types";

// A tiny, fixed users table: 56 rows stored 14 per 8 KB page on heap
// pages 15-18. Real tables hold far more, but the shape is the same.
export const PAGE_SIZE_KB = 8;
export const ROWS_PER_PAGE = 14;
export const FIRST_TABLE_PAGE = 15;
export const USER_COUNT = 56;
/** Tuples a page can hold in this model: pages 15-18 hold 14 each, so each has 2 free slots. */
export const PAGE_CAPACITY = 16;
/** The transaction every write in the model runs as; rows were loaded by an earlier one. */
export const TXID = 1042;
export const LOADED_BY_XID = 1001;
/** users_id_seq's next value. */
export const NEXT_ID = USER_COUNT + 1;
/** The free space map's choice for new rows: the last page, which has room. */
export const INSERT_PAGE = 18;
export const TABLE_PAGES = [15, 16, 17, 18];
export const TABLE = "users";
export const INDEX = "users_pkey";

const NAMES = ["Ada", "Linus", "Grace", "Edsger", "Barbara", "Ken", "Margaret", "Dennis", "Frances", "Donald", "Radia", "Niklaus", "Sophie", "Tim"];
const OVERRIDES: Record<number, string> = { 41: "Alice", 42: "Bob", 43: "Carol" };

function userAt(id: number): UserRow {
  const name = OVERRIDES[id] ?? NAMES[(id * 5) % NAMES.length];
  const day = new Date(Date.UTC(2024, 0, 1 + id * 6));
  return { id, name, email: `${name.toLowerCase()}${id}@example.com`, created_at: day.toISOString().slice(0, 10) };
}

export const USERS: UserRow[] = Array.from({ length: USER_COUNT }, (_, i) => userAt(i + 1));

export function locate(id: number): TupleLocation | null {
  if (id < 1 || id > USER_COUNT) return null;
  return { page: FIRST_TABLE_PAGE + Math.floor((id - 1) / ROWS_PER_PAGE), slot: ((id - 1) % ROWS_PER_PAGE) + 1 };
}

export function rowsOnPage(page: number): UserRow[] {
  const start = (page - FIRST_TABLE_PAGE) * ROWS_PER_PAGE;
  return USERS.slice(start, start + ROWS_PER_PAGE);
}

// users_pkey as a three-level B-tree: root -> two inner nodes -> four leaves.
export interface BTreeNode {
  id: string;
  level: 0 | 1 | 2;
  low: number;
  high: number;
}

export const BTREE: BTreeNode[] = [
  { id: "root", level: 0, low: 1, high: 56 },
  { id: "inner-0", level: 1, low: 1, high: 28 },
  { id: "inner-1", level: 1, low: 29, high: 56 },
  { id: "leaf-0", level: 2, low: 1, high: 14 },
  { id: "leaf-1", level: 2, low: 15, high: 28 },
  { id: "leaf-2", level: 2, low: 29, high: 42 },
  { id: "leaf-3", level: 2, low: 43, high: 56 },
];

export const BTREE_CHILDREN: Record<string, string[]> = {
  root: ["inner-0", "inner-1"],
  "inner-0": ["leaf-0", "leaf-1"],
  "inner-1": ["leaf-2", "leaf-3"],
};

/** Root-to-leaf path a lookup for `id` descends (to the nearest leaf when the key is absent). */
export function btreePath(id: number): string[] {
  const key = Math.min(Math.max(id, 1), USER_COUNT);
  const path = ["root"];
  let current = "root";
  while (BTREE_CHILDREN[current]) {
    const next = BTREE_CHILDREN[current].find((child) => {
      const node = BTREE.find((n) => n.id === child)!;
      return key >= node.low && key <= node.high;
    })!;
    path.push(next);
    current = next;
  }
  return path;
}

export const BUFFER_SLOTS = 12;

/** Pages of other relations already sitting in shared memory before the query runs. */
export const OTHER_CACHED_PAGES: CachedPage[] = [
  { relation: "orders", page: 12 },
  { relation: "orders", page: 23 },
  { relation: "products", page: 8 },
  { relation: "orders", page: 31 },
  { relation: "sessions", page: 44 },
  { relation: "products", page: 58 },
];
