// SQL challenges, checked against real PostgreSQL. A check runs the learner's
// SQL and the reference solution on two fresh copies of the shop database,
// then compares results: the last query's rows, or a `probe` run afterwards
// (for views, functions, procedures and triggers, whose effect is what matters).

export type ChallengeCheck =
  | { kind: "result"; probe?: string; ordered: boolean }
  | { kind: "uses-index"; query: string; table: string };

export interface Challenge {
  id: string;
  title: string;
  topic: string;
  level: "Easy" | "Medium" | "Hard";
  prompt: string;
  starter: string;
  hints: string[];
  solution: string;
  check: ChallengeCheck;
}

export const CHALLENGES: Challenge[] = [
  {
    id: "hardware-prices", title: "Hardware price list", topic: "SELECT", level: "Easy",
    prompt: "List the name and price of every product in the 'hardware' category, cheapest first.",
    starter: "SELECT ...\nFROM products\n", hints: ["Filter with WHERE category = 'hardware'.", "ORDER BY price sorts ascending by default."],
    solution: "SELECT name, price FROM products WHERE category = 'hardware' ORDER BY price;",
    check: { kind: "result", ordered: true },
  },
  {
    id: "orders-by-status", title: "Orders per status", topic: "GROUP BY", level: "Easy",
    prompt: "Show each order status and how many orders have it, sorted by status name.",
    starter: "SELECT status, ...\nFROM orders\n", hints: ["count(*) counts rows in each group.", "GROUP BY status makes one group per status."],
    solution: "SELECT status, count(*) FROM orders GROUP BY status ORDER BY status;",
    check: { kind: "result", ordered: true },
  },
  {
    id: "customer-spend", title: "What each customer spent", topic: "JOIN", level: "Medium",
    prompt: "For every customer, show their name and the total they spent (quantity × unit_price) on orders that are not cancelled. Customers who spent nothing must appear with 0. Highest total first; break ties by name.",
    starter: "SELECT c.name, ...\nFROM customers c\n", hints: ["Use LEFT JOINs so customers without orders stay in the result.", "Put the status condition in the ON clause, not WHERE, or the LEFT JOIN turns into an inner join.", "coalesce(sum(...), 0) turns a missing total into 0."],
    solution: `SELECT c.name, coalesce(sum(oi.quantity * oi.unit_price), 0) AS spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status <> 'cancelled'
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY c.id, c.name
ORDER BY spent DESC, c.name;`,
    check: { kind: "result", ordered: true },
  },
  {
    id: "priciest-per-category", title: "Most expensive in each category", topic: "Window functions", level: "Medium",
    prompt: "For each category, return the name, category and price of its most expensive product.",
    starter: "", hints: ["rank() OVER (PARTITION BY category ORDER BY price DESC) numbers products within each category.", "Wrap it in a subquery or CTE and keep rank = 1."],
    solution: `SELECT name, category, price FROM (
  SELECT name, category, price, rank() OVER (PARTITION BY category ORDER BY price DESC) AS r FROM products
) ranked WHERE r = 1;`,
    check: { kind: "result", ordered: false },
  },
  {
    id: "above-average", title: "Above-average customers", topic: "Subqueries & CTEs", level: "Medium",
    prompt: "Find the names of customers whose average order value is above the average value of all orders. An order's value is the sum of its items (quantity × unit_price).",
    starter: "WITH order_values AS (\n  \n)\nSELECT ...", hints: ["First compute each order's value in a CTE.", "Then group by customer and compare avg(value) with (SELECT avg(value) FROM order_values)."],
    solution: `WITH order_values AS (
  SELECT o.id, o.customer_id, sum(oi.quantity * oi.unit_price) AS value
  FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY o.id, o.customer_id
)
SELECT c.name FROM order_values v JOIN customers c ON c.id = v.customer_id
GROUP BY c.id, c.name
HAVING avg(v.value) > (SELECT avg(value) FROM order_values);`,
    check: { kind: "result", ordered: false },
  },
  {
    id: "calendar", title: "Orders per day, gaps included", topic: "generate_series", level: "Medium",
    prompt: "List every date from 2025-06-15 to 2025-06-21 with the number of orders placed that day (by ordered_at::date), including days with 0. Sort by date.",
    starter: "", hints: ["generate_series(date '2025-06-15', date '2025-06-21', interval '1 day') makes the calendar.", "LEFT JOIN orders onto it and count(o.id), which ignores NULLs."],
    solution: `SELECT d::date AS day, count(o.id) AS orders
FROM generate_series(date '2025-06-15', date '2025-06-21', interval '1 day') d
LEFT JOIN orders o ON o.ordered_at::date = d::date
GROUP BY d ORDER BY d;`,
    check: { kind: "result", ordered: true },
  },
  {
    id: "paid-view", title: "A view of paid orders", topic: "Views", level: "Medium",
    prompt: "Create a view named paid_orders with three columns: the order id, the customer's name, and the order total (sum of quantity × unit_price), for orders whose status is 'paid'.",
    starter: "CREATE VIEW paid_orders AS\n", hints: ["A view is just CREATE VIEW name AS <select>.", "Join orders, customers and order_items, then GROUP BY the order."],
    solution: `CREATE VIEW paid_orders AS
SELECT o.id, c.name, sum(oi.quantity * oi.unit_price) AS total
FROM orders o JOIN customers c ON c.id = o.customer_id JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'paid'
GROUP BY o.id, c.name;`,
    check: { kind: "result", probe: "SELECT * FROM paid_orders ORDER BY 1;", ordered: true },
  },
  {
    id: "revenue-function", title: "Revenue function", topic: "Functions", level: "Medium",
    prompt: "Write a function product_revenue(p_id integer) that returns the total revenue (sum of quantity × unit_price) of one product, or 0 if it was never ordered.",
    starter: "CREATE FUNCTION product_revenue(p_id integer)\nRETURNS numeric\nLANGUAGE sql\nAS $$\n  \n$$;", hints: ["A LANGUAGE sql function body is a single SELECT.", "coalesce(sum(...), 0) handles products with no order items."],
    solution: `CREATE FUNCTION product_revenue(p_id integer) RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT coalesce(sum(quantity * unit_price), 0) FROM order_items WHERE product_id = p_id
$$;`,
    check: { kind: "result", probe: "SELECT id, product_revenue(id) FROM products ORDER BY id;", ordered: true },
  },
  {
    id: "restock-procedure", title: "Restock procedure", topic: "Procedures", level: "Hard",
    prompt: "Create a procedure restock(p_product_id integer, p_amount integer) that adds p_amount to the product's stock. It must raise an exception, changing nothing, when p_amount is zero or negative.",
    starter: "CREATE PROCEDURE restock(p_product_id integer, p_amount integer)\nLANGUAGE plpgsql\nAS $$\nBEGIN\n  \nEND;\n$$;", hints: ["Check the amount first: IF p_amount <= 0 THEN RAISE EXCEPTION '...'; END IF;", "Then UPDATE products SET stock = stock + p_amount WHERE id = p_product_id."],
    solution: `CREATE PROCEDURE restock(p_product_id integer, p_amount integer) LANGUAGE plpgsql AS $$
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  UPDATE products SET stock = stock + p_amount WHERE id = p_product_id;
END;
$$;`,
    check: {
      kind: "result", ordered: true,
      probe: `CALL restock(7, 5);
CREATE TEMP TABLE restock_check (outcome text);
DO $$ BEGIN
  BEGIN
    CALL restock(1, 0);
    INSERT INTO restock_check VALUES ('accepted an amount of 0');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO restock_check VALUES ('rejected an amount of 0');
  END;
END $$;
SELECT (SELECT stock FROM products WHERE id = 7) AS webcam_stock_after_restock_5,
       (SELECT stock FROM products WHERE id = 1) AS keyboard_stock,
       (SELECT outcome FROM restock_check) AS zero_amount;`,
    },
  },
  {
    id: "price-history", title: "Price history trigger", topic: "Triggers", level: "Hard",
    prompt: "Create a table price_history(product_id integer, old_price numeric, new_price numeric) and a trigger that adds a row to it whenever an UPDATE changes a product's price. Updates that don't change the price must not add rows.",
    starter: "CREATE TABLE price_history (product_id integer, old_price numeric, new_price numeric);\n\nCREATE FUNCTION log_price_change() RETURNS trigger\nLANGUAGE plpgsql AS $$\nBEGIN\n  \nEND;\n$$;\n\n", hints: ["Compare OLD.price and NEW.price inside the trigger function (IS DISTINCT FROM handles NULLs).", "An AFTER UPDATE … FOR EACH ROW trigger returns NULL.", "Alternatively, a WHEN (OLD.price IS DISTINCT FROM NEW.price) clause on the trigger does the filtering."],
    solution: `CREATE TABLE price_history (product_id integer, old_price numeric, new_price numeric);
CREATE FUNCTION log_price_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO price_history VALUES (NEW.id, OLD.price, NEW.price);
  RETURN NULL;
END;
$$;
CREATE TRIGGER products_price_history AFTER UPDATE ON products
FOR EACH ROW WHEN (OLD.price IS DISTINCT FROM NEW.price) EXECUTE FUNCTION log_price_change();`,
    check: {
      kind: "result", ordered: true,
      probe: `UPDATE products SET price = price * 2 WHERE id IN (1, 2);
UPDATE products SET stock = stock + 1 WHERE id = 3;
SELECT product_id, old_price, new_price FROM price_history ORDER BY product_id;`,
    },
  },
  {
    id: "safe-transfer", title: "Transfer between accounts", topic: "Transactions", level: "Easy",
    prompt: "In one transaction, move 25.00 from Asha's account (id 1) to Chen's account (id 3), then commit.",
    starter: "BEGIN;\n\nCOMMIT;", hints: ["Two UPDATEs between BEGIN and COMMIT: one subtracts, one adds."],
    solution: `BEGIN;
UPDATE accounts SET balance = balance - 25 WHERE id = 1;
UPDATE accounts SET balance = balance + 25 WHERE id = 3;
COMMIT;`,
    check: { kind: "result", probe: "SELECT id, balance FROM accounts ORDER BY id;", ordered: true },
  },
  {
    id: "index-it", title: "Make it use an index", topic: "Indexes", level: "Hard",
    prompt: "This query reads all 50,000 events: SELECT * FROM events WHERE account_id = 7 AND kind = 'refund'. Create an index so that PostgreSQL answers it without a sequential scan of events.",
    starter: "CREATE INDEX ...", hints: ["An index on account_id alone already helps; (account_id, kind) is even more selective.", "Check your plan on the Visualize page with EXPLAIN."],
    solution: "CREATE INDEX events_account_kind ON events (account_id, kind);",
    check: { kind: "uses-index", query: "SELECT * FROM events WHERE account_id = 7 AND kind = 'refund'", table: "events" },
  },
];

export const findChallenge = (id: string) => CHALLENGES.find((c) => c.id === id);
