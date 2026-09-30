import type { LabLesson } from "./types";

export const RECOVERY_LAB: LabLesson = {
  id: "recovery",
  intro: "Changed pages live in memory and reach the data files later, so a crash can leave the files behind the truth. The WAL has everything. On restart, PostgreSQL finds the last checkpoint and replays the log from there. This lesson really crashes the in-browser database and lets it recover.",
  extensions: ["pg_walinspect"],
  setup: `CREATE EXTENSION pg_walinspect;
CREATE TABLE ledger (id integer PRIMARY KEY, entry text NOT NULL);`,
  steps: [
    {
      id: "checkpoint", title: "Checkpoint: a known-good starting point", view: "tables",
      body: "A checkpoint writes every changed page to the data files and records where in the log it started (the redo point). Recovery never needs to look further back than that.",
      observe: "redo_lsn is where replay would begin if the database crashed now.",
      sql: `CHECKPOINT;
SELECT checkpoint_lsn, redo_lsn, redo_wal_file FROM pg_control_checkpoint();`,
    },
    {
      id: "changes", title: "Commit some work after the checkpoint", view: "tables",
      body: "These commits are safely in the WAL, but the pages they changed may still be only in memory.",
      observe: "Three committed rows, and the log has moved past the redo point.",
      sql: `INSERT INTO ledger VALUES (1, 'opening balance'), (2, 'coffee'), (3, 'rent');
UPDATE ledger SET entry = 'coffee and cake' WHERE id = 2;
SELECT * FROM ledger ORDER BY id;
SELECT redo_lsn, pg_current_wal_lsn() AS log_end FROM pg_control_checkpoint();`,
    },
    {
      id: "pending", title: "What recovery would have to replay", view: "wal",
      body: "Everything between the redo point and the end of the log is what a crash right now would need to redo.",
      observe: "The checkpoint's own records, some full-page images, then the inserts, the update and their commits, in order.",
      sql: `SELECT start_lsn, resource_manager, record_type, record_length, fpi_length, description
FROM pg_get_wal_records_info((SELECT redo_lsn FROM pg_control_checkpoint()), pg_current_wal_lsn());`,
    },
    {
      id: "crash", title: "Crash!", view: "recovery", action: "crash",
      body: "This copies the database's files exactly as they are, with no shutdown and no checkpoint (like pulling the power cord), then starts a new server from that copy. It finds the database was not shut down cleanly and replays the WAL from the redo point.",
      observe: "The old redo point, the records replayed, and the new checkpoint written when recovery finished.",
      sql: "",
    },
    {
      id: "survived", title: "Everything committed survived", view: "tables",
      body: "The rows are back, rebuilt from the log. Work that had not committed when the crash happened would not be: it has no commit record, so its versions stay invisible.",
      observe: "All three rows, with the updated entry. The checkpoint's redo point moved forward: recovery ended with a fresh checkpoint.",
      sql: `SELECT * FROM ledger ORDER BY id;
SELECT checkpoint_lsn, redo_lsn FROM pg_control_checkpoint();`,
    },
  ],
};
