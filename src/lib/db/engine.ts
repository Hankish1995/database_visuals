import type { PGlite } from "@electric-sql/pglite";
import type { ExtensionName } from "@/lib/db/types";

// Real PostgreSQL 18, compiled to WebAssembly, running in this tab (PGlite).
// Nothing leaves the browser. Everything is loaded on demand, so pages that
// don't need a database never download it.

const EXTENSIONS: Record<ExtensionName, () => Promise<unknown>> = {
  pageinspect: async () => (await import("@electric-sql/pglite/contrib/pageinspect")).pageinspect,
  pg_walinspect: async () => (await import("@electric-sql/pglite/contrib/pg_walinspect")).pg_walinspect,
  pg_buffercache: async () => (await import("@electric-sql/pglite/contrib/pg_buffercache")).pg_buffercache,
  pg_visibility: async () => (await import("@electric-sql/pglite/contrib/pg_visibility")).pg_visibility,
  pgcrypto: async () => (await import("@electric-sql/pglite/contrib/pgcrypto")).pgcrypto,
  pg_trgm: async () => (await import("@electric-sql/pglite/contrib/pg_trgm")).pg_trgm,
};

export interface OpenOptions {
  extensions?: ExtensionName[];
  /** A data directory to start from: a snapshot, or a "crashed" copy to recover. */
  loadDataDir?: Blob | File;
}

export async function openDatabase({ extensions = [], loadDataDir }: OpenOptions = {}): Promise<PGlite> {
  const { PGlite } = await import("@electric-sql/pglite");
  const loaded = Object.fromEntries(await Promise.all(extensions.map(async (name) => [name, await EXTENSIONS[name]()])));
  const db = new PGlite({ extensions: loaded, loadDataDir });
  await db.waitReady;
  return db;
}

/** A copy of the whole data directory, as it is on "disk" right now -- no checkpoint first. */
export async function snapshot(db: PGlite): Promise<Blob> {
  return db.dumpDataDir("none");
}
