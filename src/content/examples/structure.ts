import type { ExampleGroup } from "./types";

export const STRUCTURE: ExampleGroup = {
  id: "structure", title: "Tables & constraints",
  examples: [
    {
      id: "create-table", title: "CREATE TABLE with constraints", summary: "Keys, checks and defaults guard the data.",
      sql: `DROP TABLE IF EXISTS reviews;

CREATE TABLE reviews (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id  integer NOT NULL REFERENCES products(id),
  customer_id integer NOT NULL REFERENCES customers(id),
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, customer_id)
);

INSERT INTO reviews (product_id, customer_id, rating, body) VALUES (1, 1, 5, 'Great switches');
SELECT * FROM reviews;

-- This one breaks the CHECK constraint on purpose:
INSERT INTO reviews (product_id, customer_id, rating) VALUES (2, 1, 9);`,
      notice: "The last INSERT fails with a check-constraint violation: the database refuses a rating of 9.",
      expectError: true,
    },
    {
      id: "alter-generated", title: "ALTER TABLE and generated columns", summary: "Add a column computed from others.",
      sql: `ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_with_tax numeric(10,2)
  GENERATED ALWAYS AS (round(price * 1.18, 2)) STORED;

SELECT name, price, price_with_tax FROM products ORDER BY id;`,
      notice: "price_with_tax is computed and stored by the database; it updates itself whenever price changes.",
    },
    {
      id: "enum-domain", title: "Enums and domains", summary: "Custom types that restrict values.",
      sql: `DROP TABLE IF EXISTS tickets;
DROP TYPE IF EXISTS ticket_priority;
DROP DOMAIN IF EXISTS email_address;

CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'urgent');
CREATE DOMAIN email_address AS text CHECK (VALUE ~ '^[^@\\s]+@[^@\\s]+$');

CREATE TABLE tickets (
  id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporter email_address NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'normal'
);

INSERT INTO tickets (reporter, priority) VALUES ('asha@example.com', 'urgent'), ('ben@example.com', DEFAULT);
SELECT * FROM tickets ORDER BY priority DESC;

INSERT INTO tickets (reporter) VALUES ('not-an-email');`,
      notice: "Enum values sort in declaration order (urgent first here). The domain's CHECK rejects the bad email.",
      expectError: true,
    },
    {
      id: "sequences", title: "Sequences", summary: "Generate unique numbers outside a table.",
      sql: `CREATE SEQUENCE IF NOT EXISTS invoice_number START 1000 INCREMENT 10;

SELECT nextval('invoice_number') AS invoice FROM generate_series(1, 3);
SELECT currval('invoice_number') AS last_issued;`,
      notice: "Each nextval() call hands out a new number. Sequences never roll back, so gaps are normal.",
    },
    {
      id: "partitioning", title: "Declarative partitioning", summary: "Split a table by range; queries skip partitions.",
      sql: `DROP TABLE IF EXISTS readings;

CREATE TABLE readings (
  sensor_id integer NOT NULL,
  taken_on  date NOT NULL,
  value     numeric NOT NULL
) PARTITION BY RANGE (taken_on);

CREATE TABLE readings_2025_q1 PARTITION OF readings FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE readings_2025_q2 PARTITION OF readings FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

INSERT INTO readings
SELECT (g % 5) + 1, date '2025-01-01' + (g % 180), g % 97 FROM generate_series(1, 2000) g;

SELECT tableoid::regclass AS partition, count(*) FROM readings GROUP BY 1 ORDER BY 1;

EXPLAIN SELECT avg(value) FROM readings WHERE taken_on >= '2025-05-01';`,
      notice: "Rows land in the matching partition. The plan only scans readings_2025_q2: partition pruning.",
    },
  ],
};
