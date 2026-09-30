// Starting points for the plan visualizer. Earlier statements run first; the last one is explained.
export const PLAN_SAMPLES: { id: string; title: string; sql: string }[] = [
  {
    id: "join", title: "Join and aggregate",
    sql: `SELECT c.name, count(DISTINCT o.id) AS orders, sum(oi.quantity * oi.unit_price) AS spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.name
ORDER BY spent DESC;`,
  },
  { id: "seq", title: "Filter without an index", sql: `DROP INDEX IF EXISTS events_account_idx;\nSELECT * FROM events WHERE account_id = 42;` },
  { id: "index", title: "Filter with an index", sql: `CREATE INDEX IF NOT EXISTS events_account_idx ON events (account_id);\nSELECT * FROM events WHERE account_id = 42;` },
  { id: "topn", title: "Sort and limit", sql: `SELECT id, kind, amount FROM events ORDER BY amount DESC LIMIT 10;` },
  { id: "group", title: "Group a big table", sql: `SELECT kind, count(*), round(avg(amount), 1) AS avg_amount FROM events GROUP BY kind;` },
  { id: "window", title: "Window function", sql: `SELECT account_id, created_at, amount,\n       sum(amount) OVER (PARTITION BY account_id ORDER BY created_at) AS running_total\nFROM events WHERE account_id <= 3;` },
  { id: "exists", title: "EXISTS subquery", sql: `SELECT name FROM customers c\nWHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'paid');` },
  { id: "cte", title: "CTE with a join", sql: `WITH big_spenders AS (\n  SELECT account_id, sum(amount) AS total FROM events GROUP BY account_id HAVING sum(amount) > 50000\n)\nSELECT b.account_id, b.total, count(*) AS refunds\nFROM big_spenders b JOIN events e ON e.account_id = b.account_id AND e.kind = 'refund'\nGROUP BY b.account_id, b.total ORDER BY b.total DESC LIMIT 10;` },
];
