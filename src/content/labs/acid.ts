import type { LabLesson } from "./types";

export const ACID_LAB: LabLesson = {
  id: "acid",
  intro: "A transaction groups changes so they behave as one: Atomic (all or nothing), Consistent (rules always hold), Isolated (others don't see half-done work) and Durable (once committed, it survives a crash).",
  extensions: [],
  setup: `CREATE TABLE accounts (
  owner   text PRIMARY KEY,
  balance numeric(10,2) NOT NULL CHECK (balance >= 0)
);
INSERT INTO accounts VALUES ('Asha', 100.00), ('Ben', 50.00);`,
  steps: [
    {
      id: "commit", title: "A transfer that commits", view: "tables",
      body: "Moving money is two updates. Wrapped in BEGIN … COMMIT they become visible together, at the moment of COMMIT.",
      observe: "Asha has 70 and Ben has 80; the total is still 150.",
      sql: `BEGIN;
UPDATE accounts SET balance = balance - 30 WHERE owner = 'Asha';
UPDATE accounts SET balance = balance + 30 WHERE owner = 'Ben';
COMMIT;
SELECT owner, balance, (SELECT sum(balance) FROM accounts) AS total FROM accounts ORDER BY owner;`,
    },
    {
      id: "atomic", title: "Atomicity: all or nothing", view: "tables",
      body: "This transfer credits Ben first, then tries to take 500 from Asha, which breaks the balance >= 0 rule. After an error the transaction is aborted: every further command is refused until ROLLBACK undoes the whole thing.",
      observe: "Two errors (the failed check, then the refused SELECT). After ROLLBACK, Ben's credit is gone too: nothing happened.",
      sql: `BEGIN;
UPDATE accounts SET balance = balance + 500 WHERE owner = 'Ben';
UPDATE accounts SET balance = balance - 500 WHERE owner = 'Asha';
SELECT * FROM accounts;
ROLLBACK;
SELECT owner, balance FROM accounts ORDER BY owner;`,
      expectedErrors: 2,
    },
    {
      id: "consistent", title: "Consistency: the rules always hold", view: "tables",
      body: "Constraints are checked on every change, inside or outside a transaction. No statement can leave the data breaking a declared rule.",
      observe: "The overdraft is rejected and the balances are unchanged.",
      sql: `UPDATE accounts SET balance = balance - 1000 WHERE owner = 'Ben';
SELECT owner, balance FROM accounts ORDER BY owner;`,
      expectedErrors: 1,
    },
    {
      id: "isolated", title: "Isolation: reading from a snapshot", view: "tables",
      body: "At REPEATABLE READ a transaction reads from one snapshot: a list of which transactions had committed when it started. Work committed later by others stays invisible to it. (This page has one session; the MVCC lesson shows how rows are checked against a snapshot.)",
      observe: "pg_current_snapshot() shows xmin:xmax:running -- the range that decides what this transaction can see.",
      sql: `BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT pg_current_xact_id() AS my_transaction, pg_current_snapshot() AS snapshot;
SELECT sum(balance) AS total_in_my_snapshot FROM accounts;
COMMIT;`,
    },
    {
      id: "durable", title: "Durability: committed means logged", view: "tables",
      body: "COMMIT returns only after the change is written to the write-ahead log. If the server crashed now, replaying the log would bring the change back (the Crash recovery lesson does exactly that).",
      observe: "The WAL insert position moved forward by the bytes this small update produced.",
      sql: `SELECT set_config('lab.before', pg_current_wal_insert_lsn()::text, false) AS wal_position_before;
UPDATE accounts SET balance = balance + 1 WHERE owner = 'Ben';
SELECT pg_current_wal_insert_lsn() AS wal_position_after,
       pg_wal_lsn_diff(pg_current_wal_insert_lsn(), current_setting('lab.before')::pg_lsn) AS wal_bytes_written;`,
    },
  ],
};
