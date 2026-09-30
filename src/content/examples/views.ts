import type { ExampleGroup } from "./types";

export const VIEWS: ExampleGroup = {
  id: "views", title: "Views",
  examples: [
    {
      id: "view", title: "CREATE VIEW", summary: "Save a query under a name.",
      sql: `CREATE OR REPLACE VIEW customer_order_totals AS
SELECT c.id, c.name, count(DISTINCT o.id) AS orders,
       coalesce(sum(oi.quantity * oi.unit_price), 0) AS spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id, c.name;

SELECT * FROM customer_order_totals ORDER BY spent DESC;`,
      notice: "A view stores the query, not the data: every SELECT runs it again against the current tables.",
    },
    {
      id: "updatable-view", title: "Updatable view WITH CHECK OPTION", summary: "Write through a simple view, safely.",
      sql: `CREATE OR REPLACE VIEW affordable_products AS
SELECT id, name, price FROM products WHERE price < 100
WITH CHECK OPTION;

UPDATE affordable_products SET price = 32.00 WHERE name = 'Desk lamp';
SELECT * FROM affordable_products ORDER BY price;

-- Would move the row out of the view, so the CHECK OPTION rejects it:
UPDATE affordable_products SET price = 150.00 WHERE name = 'Desk lamp';`,
      notice: "Simple views are updatable: the first UPDATE changes products. The second is refused because the row would leave the view.",
      expectError: true,
    },
    {
      id: "materialized-view", title: "Materialized view and REFRESH", summary: "Store a query's result; refresh it on demand.",
      sql: `DROP MATERIALIZED VIEW IF EXISTS category_sales;

CREATE MATERIALIZED VIEW category_sales AS
SELECT p.category, sum(oi.quantity) AS units
FROM order_items oi JOIN products p ON p.id = oi.product_id
GROUP BY p.category;

SELECT * FROM category_sales ORDER BY category;

-- A new sale of two books...
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (2, 5, 2, 29.00)
ON CONFLICT (order_id, product_id) DO UPDATE SET quantity = order_items.quantity + 2;

SELECT * FROM category_sales WHERE category = 'books';  -- still the old number
REFRESH MATERIALIZED VIEW category_sales;
SELECT * FROM category_sales WHERE category = 'books';  -- now up to date`,
      notice: "The materialized view keeps its stored result until REFRESH; compare the two 'books' results.",
    },
  ],
};
