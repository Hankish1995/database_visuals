import type { ExampleGroup } from "./types";

export const TRIGGERS: ExampleGroup = {
  id: "triggers", title: "Triggers",
  examples: [
    {
      id: "before-trigger", title: "BEFORE trigger: clean the data", summary: "Normalise an email before it's stored.",
      sql: `CREATE OR REPLACE FUNCTION normalise_email() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;  -- the (modified) row that will be written
END;
$$;

CREATE OR REPLACE TRIGGER customers_normalise_email
BEFORE INSERT OR UPDATE OF email ON customers
FOR EACH ROW EXECUTE FUNCTION normalise_email();

INSERT INTO customers (name, email, city)
VALUES ('Hana Sato', '  Hana.Sato@Example.COM ', 'Osaka')
ON CONFLICT (email) DO UPDATE SET city = EXCLUDED.city
RETURNING id, email;`,
      notice: "The row is stored as hana.sato@example.com: a BEFORE trigger can rewrite NEW before it's written.",
    },
    {
      id: "updated-at", title: "Keep updated_at current", summary: "The classic timestamp trigger.",
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER products_touch
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

UPDATE products SET stock = stock + 1 WHERE name = 'Webcam';
SELECT name, stock, updated_at FROM products WHERE updated_at IS NOT NULL;`,
      notice: "No UPDATE mentions updated_at, yet it's filled in: the trigger sets it on every change.",
    },
    {
      id: "audit-trigger", title: "AFTER trigger: audit log", summary: "Record every insert, update and delete.",
      sql: `CREATE OR REPLACE FUNCTION audit_changes() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, row_id, old_data, new_data)
  VALUES (TG_TABLE_NAME, TG_OP,
          coalesce(NEW.id, OLD.id),
          CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
          CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END);
  RETURN NULL;  -- ignored for AFTER triggers
END;
$$;

CREATE OR REPLACE TRIGGER accounts_audit
AFTER INSERT OR UPDATE OR DELETE ON accounts
FOR EACH ROW EXECUTE FUNCTION audit_changes();

UPDATE accounts SET balance = balance + 5 WHERE id = 3;

SELECT operation, row_id, old_data->>'balance' AS old_balance, new_data->>'balance' AS new_balance, changed_at
FROM audit_log ORDER BY id DESC LIMIT 5;`,
      notice: "TG_OP, OLD and NEW describe the change; the trigger copies them into audit_log automatically.",
    },
    {
      id: "validation-trigger", title: "Reject bad writes", summary: "Stop an order for an out-of-stock product.",
      sql: `CREATE OR REPLACE FUNCTION check_stock() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  available integer;
BEGIN
  SELECT stock INTO available FROM products WHERE id = NEW.product_id;
  IF available < NEW.quantity THEN
    RAISE EXCEPTION 'only % in stock for product %', available, NEW.product_id
      USING HINT = 'Restock the product or lower the quantity.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER order_items_check_stock
BEFORE INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION check_stock();

-- The standing desk has 5 in stock; ordering 50 is refused:
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (4, 3, 50, 420.00);`,
      notice: "RAISE EXCEPTION aborts the INSERT; the HINT shows up with the error.",
      expectError: true,
    },
    {
      id: "instead-of", title: "INSTEAD OF trigger on a view", summary: "Make a join view writable.",
      sql: `CREATE OR REPLACE VIEW order_overview AS
SELECT o.id, c.name AS customer, o.status
FROM orders o JOIN customers c ON c.id = o.customer_id;

CREATE OR REPLACE FUNCTION order_overview_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE orders SET status = NEW.status WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER order_overview_write
INSTEAD OF UPDATE ON order_overview
FOR EACH ROW EXECUTE FUNCTION order_overview_update();

UPDATE order_overview SET status = 'shipped' WHERE id = 2;
SELECT * FROM order_overview ORDER BY id;`,
      notice: "A join view isn't updatable by itself; the INSTEAD OF trigger says what an UPDATE on it means.",
    },
    {
      id: "statement-trigger", title: "Statement-level trigger with transition table", summary: "One call per statement, seeing all changed rows.",
      sql: `CREATE OR REPLACE FUNCTION report_price_changes() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n FROM changed;
  RAISE NOTICE '% statement changed % product(s)', TG_OP, n;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER products_price_report
AFTER UPDATE ON products
REFERENCING NEW TABLE AS changed
FOR EACH STATEMENT EXECUTE FUNCTION report_price_changes();

UPDATE products SET price = price WHERE category = 'hardware';`,
      notice: "One notice for the whole UPDATE, counting every changed row via the transition table.",
    },
    {
      id: "event-trigger", title: "Event trigger on DDL", summary: "React to schema changes, not data changes.",
      sql: `CREATE OR REPLACE FUNCTION announce_ddl() RETURNS event_trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE NOTICE 'schema change: %', TG_TAG;
END;
$$;

DROP EVENT TRIGGER IF EXISTS announce_ddl;
CREATE EVENT TRIGGER announce_ddl ON ddl_command_end EXECUTE FUNCTION announce_ddl();

CREATE TABLE IF NOT EXISTS scratch (id int);
DROP TABLE scratch;

-- Clean up so later examples stay quiet:
DROP EVENT TRIGGER announce_ddl;`,
      notice: "Notices appear for CREATE TABLE and DROP TABLE: event triggers fire on DDL commands.",
    },
  ],
};
