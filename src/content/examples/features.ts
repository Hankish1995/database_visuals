import type { ExampleGroup } from "./types";

export const FEATURES: ExampleGroup = {
  id: "features", title: "More PostgreSQL",
  examples: [
    {
      id: "jsonb", title: "JSONB", summary: "Query and build JSON documents.",
      sql: `SELECT name, details->>'switch' AS switch, (details->>'ports')::int AS ports
FROM products WHERE details ? 'switch' OR details ? 'ports';

SELECT jsonb_build_object('customer', c.name, 'orders', jsonb_agg(o.id ORDER BY o.id)) AS doc
FROM customers c JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;`,
      notice: "->> extracts text, ? tests for a key, and jsonb_agg builds arrays from rows.",
    },
    {
      id: "arrays", title: "Arrays", summary: "Overlap, contains and unnest.",
      sql: `SELECT name, tags FROM products WHERE tags && ARRAY['usb'];

SELECT tag, count(*) FROM products, unnest(tags) AS tag GROUP BY tag ORDER BY count(*) DESC, tag;`,
      notice: "&& means 'shares any element'; unnest turns an array into rows you can group.",
    },
    {
      id: "full-text", title: "Full-text search", summary: "Match words, not substrings.",
      sql: `SELECT name,
       ts_rank(to_tsvector('english', name || ' ' || category), query) AS rank
FROM products, plainto_tsquery('english', 'desk furniture') AS query
WHERE to_tsvector('english', name || ' ' || category) @@ query
ORDER BY rank DESC;`,
      notice: "Words are stemmed and matched as lexemes; ts_rank orders by relevance.",
    },
    {
      id: "series", title: "generate_series calendar", summary: "Fill gaps: orders per day, including zero days.",
      sql: `SELECT d::date AS day, count(o.id) AS orders
FROM generate_series(date '2025-06-15', date '2025-06-22', interval '1 day') AS d
LEFT JOIN orders o ON o.ordered_at::date = d::date
GROUP BY d ORDER BY d;`,
      notice: "Days without orders still appear, with 0, because the calendar drives the join.",
    },
    {
      id: "listen-notify", title: "LISTEN and NOTIFY", summary: "Send messages between sessions.",
      sql: `LISTEN order_events;
NOTIFY order_events, 'order 7 was paid';
SELECT pg_notify('order_events', 'sent from a function call');`,
      notice: "The notifications this session receives are listed under the statements that sent them.",
    },
    {
      id: "rls", title: "Row-level security", summary: "Each user sees only their own rows.",
      sql: `DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'shop_customer') THEN CREATE ROLE shop_customer; END IF;
END $$;
GRANT SELECT ON orders TO shop_customer;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_orders ON orders;
CREATE POLICY own_orders ON orders FOR SELECT TO shop_customer
  USING (customer_id = current_setting('app.customer_id')::int);

SET app.customer_id = '2';
SET ROLE shop_customer;
SELECT id, customer_id, status FROM orders;  -- only customer 2's orders
RESET ROLE;
SELECT count(*) AS all_orders_as_owner FROM orders;`,
      notice: "As shop_customer the policy filters the table to customer 2. The owner (a superuser here) bypasses it.",
    },
    {
      id: "cursor", title: "Cursors", summary: "Fetch a large result a few rows at a time.",
      sql: `BEGIN;
DECLARE recent CURSOR FOR SELECT id, kind, created_at FROM events ORDER BY created_at DESC;
FETCH 3 FROM recent;
FETCH 3 FROM recent;
CLOSE recent;
COMMIT;`,
      notice: "Each FETCH continues where the last one stopped; the query runs once.",
    },
    {
      id: "prepared", title: "Prepared statements", summary: "Parse and plan once, execute many times.",
      sql: `DEALLOCATE ALL;
PREPARE customers_in(text) AS SELECT name, email FROM customers WHERE city = $1;
EXECUTE customers_in('Pune');
EXECUTE customers_in('London');`,
      notice: "$1 is a parameter; the same prepared statement runs with different values.",
    },
    {
      id: "system-columns", title: "Hidden system columns", summary: "ctid, xmin and xmax on every row.",
      sql: `SELECT ctid, xmin, xmax, * FROM accounts ORDER BY id;`,
      notice: "ctid is the row's physical location (page, slot); xmin/xmax are the transactions that created and deleted it.",
    },
    {
      id: "catalog", title: "Ask the catalog", summary: "The database describes itself.",
      sql: `SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders' ORDER BY ordinal_position;

SELECT relname AS table, pg_size_pretty(pg_total_relation_size(oid)) AS total_size
FROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
ORDER BY pg_total_relation_size(oid) DESC;`,
      notice: "information_schema is the SQL-standard view; pg_class and friends are PostgreSQL's own catalogs.",
    },
  ],
};
