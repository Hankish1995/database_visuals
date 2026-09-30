import type { LabLesson } from "./types";

// Marks the current log position in a session setting (which writes no WAL itself).
const MARK = `SELECT set_config('lab.from', pg_current_wal_insert_lsn()::text, false) AS log_position_before;`;
const RECORDS = `SELECT start_lsn, resource_manager, record_type, record_length, fpi_length, description
FROM pg_get_wal_records_info(current_setting('lab.from')::pg_lsn, pg_current_wal_lsn());`;
const BYTES = `SELECT pg_wal_lsn_diff(pg_current_wal_insert_lsn(), current_setting('lab.from')::pg_lsn) AS wal_bytes_written;`;
const STATS = `SELECT "resource_manager/record_type" AS resource_manager, count, record_size, fpi_size, combined_size
FROM pg_get_wal_stats(current_setting('lab.from')::pg_lsn, pg_current_wal_lsn())
WHERE count > 0 ORDER BY combined_size DESC;`;

export const WAL_LAB: LabLesson = {
  id: "wal",
  intro: "The write-ahead log (WAL) is an append-only record of every change. The rule: a change is written to the log before the changed data page reaches disk, and COMMIT waits only for the log. That's what makes commits fast and crash-safe. These steps read the real log with pg_walinspect.",
  extensions: ["pg_walinspect"],
  setup: `CREATE EXTENSION pg_walinspect;
CREATE TABLE notes (id integer PRIMARY KEY, body text);`,
  steps: [
    {
      id: "position", title: "Where the log is now", view: "tables",
      body: "Positions in the log are LSNs (log sequence numbers): byte offsets into the WAL stream, written like 0/1A2B3C4. The WAL is stored in 16 MB segment files.",
      observe: "The current insert position and the segment file it falls in.",
      sql: `SELECT pg_current_wal_insert_lsn() AS insert_position, pg_walfile_name(pg_current_wal_lsn()) AS segment_file;`,
    },
    {
      id: "insert", title: "One INSERT, as log records", view: "wal",
      body: "Inserting one row writes a record for the table (Heap), records for the primary-key index (Btree) and one for the commit (Transaction). The index was empty, so it also logs creating its root page.",
      observe: "Heap INSERT+INIT (a new page), Btree NEWROOT and INSERT_LEAF, then Transaction COMMIT: tens of bytes each. Any XLOG FPI_FOR_HINT records are full-page images, explained in a later step.",
      sql: `${MARK}
INSERT INTO notes VALUES (1, 'hello');
${RECORDS}`,
    },
    {
      id: "update", title: "An UPDATE", view: "wal",
      body: "No indexed column changed, so this is a HOT (heap-only tuple) update: the index doesn't need a new entry, and neither does the log.",
      observe: "A Heap HOT_UPDATE record, then the commit, and no Btree record this time.",
      sql: `${MARK}
UPDATE notes SET body = 'hello, world' WHERE id = 1;
${RECORDS}`,
    },
    {
      id: "bulk", title: "A bulk insert", view: "tables",
      body: "Every row and index entry is logged. pg_get_wal_stats sums the records by kind.",
      observe: "Thousands of Heap and Btree records: WAL volume grows with the amount of data changed.",
      sql: `${MARK}
INSERT INTO notes SELECT g, 'note ' || g FROM generate_series(2, 2001) g;
${BYTES}
${STATS}`,
    },
    {
      id: "fpi", title: "Full-page images after a checkpoint", view: "wal",
      body: "The first time a page changes after a checkpoint, PostgreSQL logs a full copy of it (a full-page image, FPI), so a page left half-written by a crash can be restored whole. The page is full of rows by now, so the copy is big; an almost-empty page would be small, because the unused middle of the page is left out.",
      observe: "A one-row update, yet thousands of bytes of fpi_length (on the update itself, or on an FPI_FOR_HINT record just before it). Update the same page again and it would be tens of bytes.",
      sql: `CHECKPOINT;
${MARK}
UPDATE notes SET body = 'after a checkpoint' WHERE id = 1;
${RECORDS}`,
    },
    {
      id: "unlogged", title: "Unlogged tables skip the log", view: "tables",
      body: "An UNLOGGED table's changes aren't written to the WAL. It's faster, but after a crash the table is emptied, because there's no log to rebuild it from.",
      observe: "Compare with the previous step: the same 2,000 rows write next to no WAL.",
      sql: `CREATE UNLOGGED TABLE scratch_notes (id integer PRIMARY KEY, body text);
${MARK}
INSERT INTO scratch_notes SELECT g, 'note ' || g FROM generate_series(1, 2000) g;
${BYTES}`,
    },
  ],
};
