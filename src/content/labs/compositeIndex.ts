import type { LabLesson } from "./types";

const PLAN = "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)";
const MARCH = "created_at >= '2025-03-01' AND created_at < '2025-04-01'";

export const COMPOSITE_INDEX_LAB: LabLesson = {
  id: "composite",
  intro: "An index on several columns is sorted by the first column, then the second within it, like a phone book sorted by surname, then first name. That order decides which queries it can help.",
  extensions: [],
  setup: `CREATE TABLE events (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id integer NOT NULL, kind text NOT NULL,
  created_at timestamptz NOT NULL, amount integer NOT NULL
);
INSERT INTO events (account_id, kind, created_at, amount)
SELECT (g % 500) + 1, (ARRAY['login','purchase','refund','logout'])[(g % 4) + 1],
       timestamptz '2025-01-01' + g * interval '7 minutes', (g * 37) % 1000
FROM generate_series(1, 50000) g;
ANALYZE events;`,
  steps: [
    {
      id: "no-index", title: "One account's events in March, with no index", view: "plan",
      body: "events has 50,000 rows and only a primary key on id. To find one account's March events the database has nothing to search, so it reads every row.",
      observe: "A Seq Scan with a large 'rows removed by filter' count: almost all the work is thrown away.",
      sql: `${PLAN}
SELECT * FROM events WHERE account_id = 42 AND ${MARCH};`,
    },
    {
      id: "create", title: "Create an index on (account_id, created_at)", view: "plan",
      body: "The index keeps entries sorted by account_id, and by created_at within each account. All of account 42's March events now sit next to each other in the index.",
      observe: "The plan switches to the new index, and only the matching rows are read.",
      sql: `CREATE INDEX events_account_time ON events (account_id, created_at);
ANALYZE events;

${PLAN}
SELECT * FROM events WHERE account_id = 42 AND ${MARCH};`,
    },
    {
      id: "leading", title: "Filter on the first column only", view: "plan",
      body: "A filter on account_id alone matches a prefix of the index order, so the index works just as it would for a single-column index on account_id.",
      observe: "The same index is used, with only account_id in the index condition.",
      sql: `${PLAN}
SELECT * FROM events WHERE account_id = 42;`,
    },
    {
      id: "trailing", title: "Filter on the second column only", view: "plan",
      body: "created_at on its own is scattered across every account's section of the index, so there's no single range to read. PostgreSQL 18 can sometimes 'skip scan' (one probe per account_id) when the first column has few distinct values; otherwise it reads the whole table.",
      observe: "Check which plan you got: a Seq Scan, or an index scan that has to visit all 500 accounts. Either way it's much more work than the first-column query.",
      sql: `${PLAN}
SELECT * FROM events WHERE created_at >= '2025-03-01' AND created_at < '2025-03-02';`,
    },
    {
      id: "order", title: "Sorted results for free", view: "plan",
      body: "Within one account the index is already ordered by created_at. Reading it backwards gives the newest events first, so no sort is needed.",
      observe: "Limit on top of an Index Scan Backward, and no Sort node anywhere.",
      sql: `${PLAN}
SELECT * FROM events WHERE account_id = 42 ORDER BY created_at DESC LIMIT 5;`,
    },
  ],
};
