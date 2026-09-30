import type { ExampleGroup } from "./types";

export const QUERYING: ExampleGroup = {
  id: "querying", title: "Querying",
  examples: [
    {
      id: "filter-sort", title: "Filter and sort", summary: "WHERE, ORDER BY and LIMIT on one table.",
      sql: `SELECT name, category, price
FROM products
WHERE price < 100
ORDER BY price DESC
LIMIT 5;`,
      notice: "Only products under 100 come back, most expensive first, and at most five of them.",
    },
    {
      id: "joins", title: "Inner joins", summary: "Combine orders, customers and order items.",
      sql: `SELECT o.id AS order_id, c.name AS customer, o.status,
       sum(oi.quantity * oi.unit_price) AS order_total
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, c.name, o.status
ORDER BY o.id;`,
      notice: "Each order appears once, with its customer's name and the sum of its line items.",
    },
    {
      id: "left-join", title: "Left join: find missing rows", summary: "Customers who have never ordered.",
      sql: `SELECT c.name, c.city
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;`,
      notice: "A LEFT JOIN keeps every customer; those with no matching order get NULLs, which the WHERE clause keeps.",
    },
    {
      id: "aggregate", title: "Group by and having", summary: "Revenue per category, only the big ones.",
      sql: `SELECT p.category,
       count(DISTINCT oi.order_id) AS orders,
       sum(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY p.category
HAVING sum(oi.quantity * oi.unit_price) > 100
ORDER BY revenue DESC;`,
      notice: "WHERE filters rows before grouping; HAVING filters the groups after aggregation.",
    },
    {
      id: "subquery", title: "Subqueries and EXISTS", summary: "Compare against an aggregate; test for existence.",
      sql: `-- Products priced above the average price
SELECT name, price FROM products
WHERE price > (SELECT avg(price) FROM products);

-- Customers with at least one paid order
SELECT name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'paid');`,
      notice: "Two result sets: a scalar subquery used as a value, then a correlated EXISTS check per customer.",
    },
    {
      id: "cte", title: "Common table expressions", summary: "Name an intermediate result with WITH.",
      sql: `WITH order_totals AS (
  SELECT order_id, sum(quantity * unit_price) AS total
  FROM order_items GROUP BY order_id
)
SELECT c.name, count(*) AS orders, round(avg(t.total), 2) AS avg_order
FROM order_totals t
JOIN orders o ON o.id = t.order_id
JOIN customers c ON c.id = o.customer_id
GROUP BY c.name
ORDER BY avg_order DESC;`,
      notice: "The CTE reads like a temporary view that exists only for this statement.",
    },
    {
      id: "recursive-cte", title: "Recursive CTE", summary: "Walk a management chain of any depth.",
      sql: `WITH RECURSIVE staff(id, name, manager_id) AS (
  VALUES (1, 'Maya (CEO)', NULL::int), (2, 'Omar', 1), (3, 'Lena', 1),
         (4, 'Ravi', 2), (5, 'Sofia', 4), (6, 'Tom', 3)
), chain AS (
  SELECT id, name, manager_id, 0 AS depth, name::text AS path FROM staff WHERE manager_id IS NULL
  UNION ALL
  SELECT s.id, s.name, s.manager_id, c.depth + 1, c.path || ' → ' || s.name
  FROM staff s JOIN chain c ON s.manager_id = c.id
)
SELECT depth, path FROM chain ORDER BY path;`,
      notice: "The recursive part keeps joining new rows to the previous level until no more are found.",
    },
    {
      id: "window", title: "Window functions", summary: "Rankings and running totals without collapsing rows.",
      sql: `SELECT name, category, price,
       rank() OVER (PARTITION BY category ORDER BY price DESC) AS rank_in_category,
       round(price / sum(price) OVER (PARTITION BY category) * 100, 1) AS pct_of_category
FROM products
ORDER BY category, rank_in_category;

SELECT o.customer_id, o.id AS order_id, o.ordered_at::date,
       sum(oi.quantity * oi.unit_price) OVER (PARTITION BY o.customer_id ORDER BY o.ordered_at) AS running_total
FROM orders o JOIN order_items oi ON oi.order_id = o.id
ORDER BY o.customer_id, o.ordered_at;`,
      notice: "Unlike GROUP BY, window functions keep every row and add a computed column beside it.",
    },
    {
      id: "set-ops", title: "UNION, INTERSECT, EXCEPT", summary: "Combine the results of two queries.",
      sql: `SELECT city FROM customers WHERE id <= 3
UNION
SELECT city FROM customers WHERE id >= 3;

SELECT customer_id FROM orders WHERE status = 'shipped'
INTERSECT
SELECT customer_id FROM orders WHERE status = 'paid';

SELECT id FROM customers
EXCEPT
SELECT customer_id FROM orders;`,
      notice: "UNION removes duplicates (UNION ALL wouldn't); INTERSECT keeps common rows; EXCEPT subtracts.",
    },
    {
      id: "lateral", title: "LATERAL join", summary: "Top item of every order, computed per row.",
      sql: `SELECT o.id AS order_id, top.name, top.line_total
FROM orders o
CROSS JOIN LATERAL (
  SELECT p.name, oi.quantity * oi.unit_price AS line_total
  FROM order_items oi JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = o.id
  ORDER BY line_total DESC
  LIMIT 1
) AS top
ORDER BY o.id;`,
      notice: "A LATERAL subquery can refer to columns of the rows before it, like a per-row function call.",
    },
    {
      id: "rollup", title: "ROLLUP and FILTER", summary: "Subtotals and conditional aggregates in one pass.",
      sql: `SELECT coalesce(p.category, 'ALL') AS category,
       sum(oi.quantity) AS units,
       sum(oi.quantity) FILTER (WHERE o.status = 'shipped') AS shipped_units
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
GROUP BY ROLLUP (p.category)
ORDER BY p.category NULLS LAST;`,
      notice: "ROLLUP adds a grand-total row (category NULL, shown as ALL); FILTER restricts one aggregate only.",
    },
  ],
};
