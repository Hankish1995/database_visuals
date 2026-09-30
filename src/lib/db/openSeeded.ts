import type { PGlite } from "@electric-sql/pglite";
import { openDatabase, snapshot } from "@/lib/db/engine";
import { runScript } from "@/lib/db/runScript";
import type { ExtensionName } from "@/lib/db/types";

// Seeding runs once per seed; later opens (resets, fresh challenge checks)
// start from a checkpointed snapshot of the seeded database, which is much faster.
const snapshots = new Map<string, Promise<Blob>>();

export interface SeedSpec {
  key: string;
  sql: string;
  extensions?: ExtensionName[];
}

async function buildSnapshot(spec: SeedSpec): Promise<Blob> {
  const db = await openDatabase({ extensions: spec.extensions });
  const results = await runScript(db, spec.sql);
  const failed = results.find((r) => r.error);
  if (failed) throw new Error(`Seed failed at "${failed.sql.slice(0, 80)}": ${failed.error!.message}`);
  await db.query("CHECKPOINT");
  const blob = await snapshot(db);
  await db.close();
  return blob;
}

export async function openSeeded(spec: SeedSpec): Promise<PGlite> {
  let snap = snapshots.get(spec.key);
  if (!snap) {
    snap = buildSnapshot(spec);
    snapshots.set(spec.key, snap);
    snap.catch(() => snapshots.delete(spec.key));
  }
  return openDatabase({ extensions: spec.extensions, loadDataDir: await snap });
}
