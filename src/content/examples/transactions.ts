import type { ExampleGroup } from "./types";

export const TRANSACTIONS: ExampleGroup = {
  id: "transactions", title: "Transactions",
  examples: [
    {
      id: "commit", title: "BEGIN … COMMIT", summary: "Two changes that succeed or fail together.",
      sql: `BEGIN;
UPDATE accounts SET balance = balance - 20 WHERE id = 1;
UPDATE accounts SET balance = balance + 20 WHERE id = 3;
COMMIT;

SELECT * FROM accounts ORDER BY id;`,
      notice: "Both updates become visible together at COMMIT; no one could see money 'in flight'.",
    },
    {
      id: "rollback", title: "ROLLBACK", summary: "Undo everything since BEGIN.",
      sql: `BEGIN;
DELETE FROM order_items;
SELECT count(*) AS items_inside_transaction FROM order_items;
ROLLBACK;

SELECT count(*) AS items_after_rollback FROM order_items;`,
      notice: "Inside the transaction the table looks empty; after ROLLBACK every row is back.",
    },
    {
      id: "savepoint", title: "SAVEPOINT", summary: "Undo part of a transaction.",
      sql: `BEGIN;
UPDATE accounts SET balance = balance + 1 WHERE id = 2;
SAVEPOINT before_risky_step;
UPDATE accounts SET balance = balance - 1000 WHERE id = 2;  -- breaks the CHECK
ROLLBACK TO SAVEPOINT before_risky_step;
COMMIT;

SELECT * FROM accounts WHERE id = 2;`,
      notice: "The failed statement is undone back to the savepoint; the +1 before it still commits.",
      continueOnError: true,
    },
    {
      id: "aborted", title: "An error aborts the transaction", summary: "Why you must ROLLBACK after a failure.",
      sql: `BEGIN;
SELECT 1 / 0;          -- error
SELECT 'still here?';  -- refused: the transaction is aborted
ROLLBACK;
SELECT 'fresh start' AS status;`,
      notice: "After an error PostgreSQL ignores every command until ROLLBACK (or ROLLBACK TO a savepoint).",
      continueOnError: true,
    },
    {
      id: "isolation", title: "Isolation level and snapshot", summary: "See the snapshot a transaction reads from.",
      sql: `BEGIN ISOLATION LEVEL REPEATABLE READ;
SHOW transaction_isolation;
SELECT pg_current_xact_id() AS my_xid, pg_current_snapshot() AS snapshot;
COMMIT;`,
      notice: "REPEATABLE READ takes one snapshot for the whole transaction; the MVCC lesson shows how rows are checked against it.",
    },
  ],
};
