import type { ExampleGroup } from "./types";

export const INDEXES: ExampleGroup = {
  id: "indexes", title: "Indexes & plans",
  examples: [
    {
      id: "explain-index", title: "Seq scan vs. index scan", summary: "EXPLAIN ANALYZE before and after an index.",
      sql: `DROP INDEX IF EXISTS events_account_idx;
EXPLAIN ANALYZE SELECT * FROM events WHERE account_id = 42;

CREATE INDEX events_account_idx ON events (account_id);
EXPLAIN ANALYZE SELECT * FROM events WHERE account_id = 42;`,
      notice: "Compare the plans: a Seq Scan reading all 50,000 rows, then a Bitmap or Index Scan touching about 100.",
    },
    {
      id: "partial-index", title: "Partial index", summary: "Index only the rows you query.",
      sql: `CREATE INDEX IF NOT EXISTS events_refunds_idx ON events (created_at) WHERE kind = 'refund';

EXPLAIN SELECT * FROM events WHERE kind = 'refund' AND created_at >= '2025-06-01' AND created_at < '2025-06-02';

SELECT pg_size_pretty(pg_relation_size('events_refunds_idx')) AS partial_index_size;`,
      notice: "The index covers only refunds (a quarter of the rows), so it's smaller, and the plan can use it.",
    },
    {
      id: "covering-index", title: "Covering index (Index Only Scan)", summary: "INCLUDE columns so the table isn't read.",
      sql: `CREATE INDEX IF NOT EXISTS events_account_amount ON events (account_id) INCLUDE (amount);
VACUUM events;  -- updates the visibility map, which index-only scans rely on

EXPLAIN ANALYZE SELECT account_id, sum(amount) FROM events WHERE account_id BETWEEN 10 AND 12 GROUP BY account_id;`,
      notice: "Look for Index Only Scan with Heap Fetches: 0 -- every needed value came from the index.",
    },
    {
      id: "gin-jsonb", title: "GIN index on JSONB", summary: "Index containment queries on documents.",
      sql: `CREATE INDEX IF NOT EXISTS products_details_gin ON products USING gin (details);
SET enable_seqscan = off;  -- the table is tiny; force the planner to show the index option
EXPLAIN SELECT name FROM products WHERE details @> '{"ports": 7}';
RESET enable_seqscan;
SELECT name, details FROM products WHERE details @> '{"ports": 7}';`,
      notice: "A GIN index maps each key/value inside the JSON to rows, so @> containment can use it.",
    },
  ],
};
