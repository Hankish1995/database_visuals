import type { PGlite } from "@electric-sql/pglite";
import { openDatabase, snapshot } from "@/lib/db/engine";
import type { ExtensionName } from "@/lib/db/types";

export interface RecoveryReport {
  redoBefore: string;
  logEndBefore: string;
  checkpointAfter: string;
  redoAfter: string;
  /** WAL records between the old redo point and the old end of log: what recovery replayed. */
  replayed: Record<string, unknown>[];
}

// A real crash: copy the data directory as it is right now (no shutdown, no
// checkpoint), throw the running server away, and start a new one from the
// copy. PostgreSQL sees an unclean shutdown and replays the WAL.
export async function crashAndRecover(db: PGlite, extensions: ExtensionName[]): Promise<{ db: PGlite; report: RecoveryReport }> {
  const before = (await db.query<{ redo_lsn: string; log_end: string }>(
    "SELECT redo_lsn::text, pg_current_wal_lsn()::text AS log_end FROM pg_control_checkpoint()")).rows[0];
  const image = await snapshot(db);
  await db.close().catch(() => {});

  const recovered = await openDatabase({ extensions, loadDataDir: image });
  const after = (await recovered.query<{ checkpoint_lsn: string; redo_lsn: string }>(
    "SELECT checkpoint_lsn::text, redo_lsn::text FROM pg_control_checkpoint()")).rows[0];
  const replayed = extensions.includes("pg_walinspect")
    ? (await recovered.query<Record<string, unknown>>(
        "SELECT start_lsn, resource_manager, record_type, description FROM pg_get_wal_records_info($1::pg_lsn, $2::pg_lsn)",
        [before.redo_lsn, before.log_end])).rows
    : [];
  return {
    db: recovered,
    report: { redoBefore: before.redo_lsn, logEndBefore: before.log_end, checkpointAfter: after.checkpoint_lsn, redoAfter: after.redo_lsn, replayed },
  };
}
