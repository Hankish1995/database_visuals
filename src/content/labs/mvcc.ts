import type { LabLesson } from "./types";

// Every version on page 0, with the commit status of the transactions that created and ended it.
const VERSIONS = `SELECT lp, lp_flags, t_xmin, t_xmax, t_ctid,
       CASE WHEN t_xmin IS NOT NULL THEN pg_xact_status(t_xmin::text::xid8) END AS xmin_status,
       CASE WHEN t_xmax::text <> '0' THEN pg_xact_status(t_xmax::text::xid8) END AS xmax_status
FROM heap_page_items(get_raw_page('stock', 0));`;

export const MVCC_LAB: LabLesson = {
  id: "mvcc",
  intro: "MVCC (multi-version concurrency control) lets readers and writers work at once without blocking each other. Instead of changing a row in place, PostgreSQL keeps versions: each is stamped with the transaction that created it (xmin) and the one that ended it (xmax), and every query decides which version it may see.",
  extensions: ["pageinspect"],
  setup: `CREATE EXTENSION pageinspect;
CREATE TABLE stock (id integer, item text, qty integer);`,
  steps: [
    {
      id: "born", title: "A row is born", view: "versions",
      body: "The INSERT runs in its own transaction; that transaction's id becomes the new version's xmin. xmax is 0: nothing has ended this version.",
      observe: "One version, xmin = the inserting transaction (committed), xmax = 0. It's the live version.",
      sql: `INSERT INTO stock VALUES (1, 'apples', 10);
SELECT xmin, xmax, ctid, * FROM stock;
${VERSIONS}`,
    },
    {
      id: "update", title: "UPDATE adds a version", view: "versions",
      body: "The update doesn't touch the old version's data. It sets the old version's xmax to its own transaction id and writes a new version whose xmin is that same id.",
      observe: "Two versions of one row. The old one is ended by the transaction that created the new one.",
      sql: `UPDATE stock SET qty = 7 WHERE id = 1;
SELECT xmin, xmax, ctid, * FROM stock;
${VERSIONS}`,
    },
    {
      id: "aborted", title: "A rolled-back update leaves a dead version", view: "versions",
      body: "This update is rolled back. Its new version was already written to the page, but its creating transaction is marked aborted, so no snapshot will ever see it.",
      observe: "A version whose xmin status is 'aborted'. The live version even carries the aborted transaction in its xmax, but since that transaction aborted, the version is still live: the table shows qty 7.",
      sql: `BEGIN;
UPDATE stock SET qty = 0 WHERE id = 1;
ROLLBACK;
SELECT xmin, xmax, ctid, * FROM stock;
${VERSIONS}`,
    },
    {
      id: "snapshots", title: "Which version does a snapshot see?", view: "versions",
      body: "Another update adds a third committed version. A snapshot sees a version if its xmin had committed before the snapshot, and its xmax hadn't. Drag the snapshot slider below the table to see what a transaction started at each moment would read.",
      observe: "Older snapshots see older quantities. That's how a long report keeps a consistent view while others keep updating.",
      sql: `UPDATE stock SET qty = 4 WHERE id = 1;
${VERSIONS}`,
    },
    {
      id: "delete", title: "DELETE only marks the version", view: "versions",
      body: "DELETE also just sets xmax. The bytes stay on the page, because a transaction that started earlier might still need to read them.",
      observe: "The table is empty, yet every version is still on the page. The last one now has an xmax.",
      sql: `DELETE FROM stock WHERE id = 1;
SELECT count(*) AS visible_rows FROM stock;
${VERSIONS}`,
    },
    {
      id: "vacuum", title: "VACUUM removes dead versions", view: "versions",
      body: "Once no running transaction can see a version, it is dead. A new row arrives first (so the page has something live to keep), then VACUUM frees the dead versions' space and marks their line pointers unused, ready for reuse. A page with nothing live at the end of the table would be cut off the file entirely.",
      observe: "The old line pointers are now flag 0 (unused) with no tuple data; only the new pears row is live.",
      sql: `INSERT INTO stock VALUES (2, 'pears', 3);
VACUUM stock;
${VERSIONS}`,
    },
  ],
};
