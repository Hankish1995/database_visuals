import type { ExampleGroup } from "./types";

export const PROCEDURES: ExampleGroup = {
  id: "procedures", title: "Procedures",
  examples: [
    {
      id: "procedure-transfer", title: "CREATE PROCEDURE and CALL", summary: "A money transfer with its own checks.",
      sql: `CREATE OR REPLACE PROCEDURE transfer(p_from integer, p_to integer, p_amount numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive, got %', p_amount;
  END IF;
  UPDATE accounts SET balance = balance - p_amount WHERE id = p_from;
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_to;
  RAISE NOTICE 'moved % from account % to account %', p_amount, p_from, p_to;
END;
$$;

CALL transfer(1, 2, 10.00);
SELECT * FROM accounts ORDER BY id;`,
      notice: "Procedures are invoked with CALL, not SELECT. If a balance would go negative, the CHECK constraint stops the whole call.",
    },
    {
      id: "procedure-inout", title: "INOUT parameters", summary: "A procedure that hands values back.",
      sql: `CREATE OR REPLACE PROCEDURE restock_low(p_threshold integer, INOUT restocked integer DEFAULT NULL)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products SET stock = stock + 10 WHERE stock < p_threshold;
  GET DIAGNOSTICS restocked = ROW_COUNT;
END;
$$;

CALL restock_low(15);
SELECT name, stock FROM products ORDER BY stock;`,
      notice: "CALL returns one row holding the INOUT values: how many products were restocked.",
    },
    {
      id: "procedure-commit", title: "Transaction control inside a procedure", summary: "Commit in batches, which functions can't do.",
      sql: `DROP TABLE IF EXISTS import_batches;
CREATE TABLE import_batches (batch integer, loaded_at timestamptz DEFAULT clock_timestamp());

CREATE OR REPLACE PROCEDURE load_in_batches(p_batches integer)
LANGUAGE plpgsql
AS $$
BEGIN
  FOR i IN 1..p_batches LOOP
    INSERT INTO import_batches (batch) VALUES (i);
    COMMIT;  -- each batch is durable on its own
    RAISE NOTICE 'batch % committed', i;
  END LOOP;
END;
$$;

CALL load_in_batches(3);
SELECT * FROM import_batches;`,
      notice: "Unlike a function, a procedure may COMMIT: each batch becomes its own transaction.",
    },
  ],
};
