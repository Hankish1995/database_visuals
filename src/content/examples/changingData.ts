import type { ExampleGroup } from "./types";

export const CHANGING_DATA: ExampleGroup = {
  id: "changing", title: "Changing data",
  examples: [
    {
      id: "insert-returning", title: "INSERT … RETURNING", summary: "Insert rows and get generated values back.",
      sql: `INSERT INTO customers (name, email, city)
VALUES ('Gita Menon', 'gita@example.com', 'Kochi')
ON CONFLICT (email) DO NOTHING
RETURNING id, name, created_at;

SELECT id, name, email FROM customers ORDER BY id;`,
      notice: "RETURNING shows the identity value the database generated. Run it twice: the second time ON CONFLICT skips the duplicate and returns nothing.",
    },
    {
      id: "upsert", title: "Upsert (ON CONFLICT DO UPDATE)", summary: "Insert, or update the existing row instead.",
      sql: `INSERT INTO accounts (id, owner, balance) VALUES (4, 'Dev', 25.00)
ON CONFLICT (id) DO UPDATE
  SET balance = accounts.balance + EXCLUDED.balance
RETURNING *;`,
      notice: "The first run inserts Dev; each later run hits the primary key conflict and adds 25 to the balance.",
    },
    {
      id: "update-returning", title: "UPDATE … RETURNING", summary: "Change rows and see the new values.",
      sql: `UPDATE products
SET price = round(price * 1.05, 2)
WHERE category = 'books'
RETURNING name, price;`,
      notice: "Every book gets 5% more expensive; RETURNING shows the new prices.",
    },
    {
      id: "delete-cascade", title: "DELETE with ON DELETE CASCADE", summary: "Deleting an order removes its items too.",
      sql: `SELECT count(*) AS items_before FROM order_items;

DELETE FROM orders WHERE status = 'cancelled' RETURNING id, customer_id;

SELECT count(*) AS items_after FROM order_items;`,
      notice: "order_items references orders with ON DELETE CASCADE, so the cancelled order's line item disappears with it.",
    },
    {
      id: "merge", title: "MERGE", summary: "Apply a batch: update matches, insert the rest.",
      sql: `MERGE INTO products AS p
USING (VALUES ('Desk lamp', 45), ('Monitor arm', 15)) AS s(name, restock)
ON p.name = s.name
WHEN MATCHED THEN
  UPDATE SET stock = p.stock + s.restock
WHEN NOT MATCHED THEN
  INSERT (name, category, price, stock) VALUES (s.name, 'furniture', 49.00, s.restock)
RETURNING merge_action(), p.name, p.stock;`,
      notice: "merge_action() reports what happened to each source row: UPDATE for the lamp, INSERT for the new arm (then UPDATE on later runs).",
    },
  ],
};
