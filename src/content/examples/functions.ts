import type { ExampleGroup } from "./types";

export const FUNCTIONS: ExampleGroup = {
  id: "functions", title: "Functions",
  examples: [
    {
      id: "sql-function", title: "SQL function", summary: "A reusable calculation, callable in any query.",
      sql: `CREATE OR REPLACE FUNCTION order_total(p_order_id integer)
RETURNS numeric
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(sum(quantity * unit_price), 0)
  FROM order_items WHERE order_id = p_order_id
$$;

SELECT id, status, order_total(id) AS total FROM orders ORDER BY id;`,
      notice: "STABLE tells the planner the result won't change within one statement, so it can be optimized.",
    },
    {
      id: "plpgsql-function", title: "PL/pgSQL function", summary: "Variables, IF/ELSIF and a result.",
      sql: `CREATE OR REPLACE FUNCTION customer_tier(p_customer_id integer)
RETURNS text
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  spent numeric;
BEGIN
  SELECT coalesce(sum(oi.quantity * oi.unit_price), 0) INTO spent
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.customer_id = p_customer_id AND o.status <> 'cancelled';

  IF spent >= 400 THEN RETURN 'gold';
  ELSIF spent >= 100 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$;

SELECT name, customer_tier(id) AS tier FROM customers ORDER BY id;`,
      notice: "PL/pgSQL adds variables and control flow; SELECT … INTO stores a query result in a variable.",
    },
    {
      id: "table-function", title: "Set-returning function", summary: "A function you can SELECT FROM.",
      sql: `CREATE OR REPLACE FUNCTION products_in(p_category text, p_max_price numeric DEFAULT 1000)
RETURNS TABLE (name text, price numeric, in_stock boolean)
LANGUAGE sql STABLE
AS $$
  SELECT name, price, stock > 0 FROM products
  WHERE category = p_category AND price <= p_max_price
  ORDER BY price
$$;

SELECT * FROM products_in('hardware');
SELECT * FROM products_in('hardware', p_max_price => 60);`,
      notice: "RETURNS TABLE makes the function behave like a parameterized view. Named arguments use =>.",
    },
    {
      id: "do-loop", title: "DO block with a loop", summary: "Run procedural code once; RAISE NOTICE output.",
      sql: `DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT name, stock FROM products ORDER BY stock LOOP
    IF r.stock = 0 THEN
      RAISE NOTICE '% is out of stock', r.name;
    ELSIF r.stock < 20 THEN
      RAISE NOTICE '% is running low (% left)', r.name, r.stock;
    END IF;
  END LOOP;
END;
$$;`,
      notice: "A DO block is an anonymous function. Its RAISE NOTICE messages appear under the statement.",
    },
    {
      id: "exception", title: "Error handling in PL/pgSQL", summary: "Catch an error and recover.",
      sql: `CREATE OR REPLACE FUNCTION safe_ratio(a numeric, b numeric)
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  RETURN a / b;
EXCEPTION
  WHEN division_by_zero THEN
    RAISE NOTICE 'division by zero for % / %, returning NULL', a, b;
    RETURN NULL;
END;
$$;

SELECT safe_ratio(10, 4) AS ok, safe_ratio(1, 0) AS caught;`,
      notice: "The EXCEPTION block catches the error, so the query succeeds and the second value is NULL.",
    },
    {
      id: "expression-index", title: "Function in an index", summary: "Index lower(email) for case-insensitive lookups.",
      sql: `CREATE INDEX IF NOT EXISTS customers_email_lower ON customers (lower(email));
SET enable_seqscan = off;  -- the table is tiny; force the planner to show the index option
EXPLAIN SELECT * FROM customers WHERE lower(email) = 'asha@example.com';
RESET enable_seqscan;`,
      notice: "The plan uses customers_email_lower because the query uses the same expression the index stores.",
    },
  ],
};
