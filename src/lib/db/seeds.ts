// The sample database every SQL page starts from: a small online shop that is
// easy to read, plus a larger events table so the planner has real choices.

export const SHOP_SCHEMA = `
CREATE TABLE customers (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL,
  email      text NOT NULL UNIQUE,
  city       text NOT NULL,
  created_at date NOT NULL DEFAULT current_date
);

CREATE TABLE products (
  id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name     text NOT NULL,
  category text NOT NULL,
  price    numeric(10,2) NOT NULL CHECK (price > 0),
  stock    integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  tags     text[] NOT NULL DEFAULT '{}',
  details  jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE orders (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers(id),
  status      text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'paid', 'shipped', 'cancelled')),
  ordered_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id   integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES products(id),
  quantity   integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE accounts (
  id      integer PRIMARY KEY,
  owner   text NOT NULL,
  balance numeric(10,2) NOT NULL CHECK (balance >= 0)
);

CREATE TABLE audit_log (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text NOT NULL,
  operation  text NOT NULL,
  row_id     integer,
  old_data   jsonb,
  new_data   jsonb,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id integer NOT NULL,
  kind       text NOT NULL,
  created_at timestamptz NOT NULL,
  amount     integer NOT NULL
);
`;

export const SHOP_DATA = `
INSERT INTO customers (name, email, city, created_at) VALUES
  ('Asha Rao', 'asha@example.com', 'Pune', '2025-01-12'),
  ('Ben Carter', 'ben@example.com', 'London', '2025-02-03'),
  ('Chen Wei', 'chen@example.com', 'Singapore', '2025-02-20'),
  ('Dara Singh', 'dara@example.com', 'Pune', '2025-03-15'),
  ('Elena Costa', 'elena@example.com', 'Lisbon', '2025-04-01'),
  ('Farid Khan', 'farid@example.com', 'Dubai', '2025-05-22');

INSERT INTO products (name, category, price, stock, tags, details) VALUES
  ('Mechanical keyboard', 'hardware', 89.00, 25, '{keyboard,usb}', '{"switch": "brown", "layout": "US"}'),
  ('USB-C hub', 'hardware', 39.50, 60, '{usb,adapter}', '{"ports": 7}'),
  ('Standing desk', 'furniture', 420.00, 5, '{desk}', '{"motor": "dual", "max_height_cm": 125}'),
  ('Desk lamp', 'furniture', 34.99, 40, '{light}', '{"color_temp_k": 4000}'),
  ('SQL handbook', 'books', 29.00, 100, '{sql,postgres}', '{"pages": 480}'),
  ('Noise-cancelling headphones', 'audio', 199.00, 12, '{audio,bluetooth}', '{"battery_h": 30}'),
  ('Webcam', 'hardware', 59.00, 0, '{video,usb}', '{"resolution": "1080p"}');

INSERT INTO orders (customer_id, status, ordered_at) VALUES
  (1, 'shipped', '2025-06-01 10:15+00'), (1, 'paid', '2025-06-18 09:00+00'),
  (2, 'shipped', '2025-06-03 14:30+00'), (3, 'placed', '2025-06-20 16:45+00'),
  (4, 'cancelled', '2025-06-05 11:00+00'), (5, 'paid', '2025-06-19 08:20+00'),
  (2, 'paid', '2025-06-21 12:10+00');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 89.00), (1, 5, 2, 29.00), (2, 2, 1, 39.50), (3, 3, 1, 420.00), (3, 4, 2, 34.99),
  (4, 6, 1, 199.00), (5, 5, 1, 29.00), (6, 1, 1, 89.00), (6, 2, 2, 39.50), (7, 6, 1, 199.00);

INSERT INTO accounts VALUES (1, 'Asha', 100.00), (2, 'Ben', 50.00), (3, 'Chen', 0.00);

INSERT INTO events (account_id, kind, created_at, amount)
SELECT (g % 500) + 1,
       (ARRAY['login', 'purchase', 'refund', 'logout'])[(g % 4) + 1],
       timestamptz '2025-01-01' + (g * interval '7 minutes'),
       (g * 37) % 1000
FROM generate_series(1, 50000) AS g;

ANALYZE;
`;

export const SHOP_SEED = SHOP_SCHEMA + SHOP_DATA;
