import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_EXAMPLES, type SqlExample } from "@/content/examples";
import { openSeeded } from "@/lib/db/openSeeded";
import { runScript } from "@/lib/db/runScript";
import { SHOP_SEED } from "@/lib/db/seeds";
import type { StatementResult } from "@/lib/db/types";

// Every SQL example in the lab runs against real PostgreSQL (PGlite).
const SHOP = { key: "shop", sql: SHOP_SEED };

function check(example: SqlExample, results: StatementResult[], pass: string) {
  const errors = results.filter((r) => r.error);
  const where = `${example.id} (${pass})`;
  if (example.continueOnError) return; // errors are the point; the runner kept going
  if (example.expectError) {
    assert.equal(errors.length, 1, `${where}: expected exactly one error, got ${errors.map((e) => e.error!.message).join(" | ")}`);
    assert.equal(results.at(-1)!.error !== null, true, `${where}: the error should be the final statement`);
  } else {
    assert.equal(errors.length, 0, `${where}: ${errors.map((e) => `${e.sql.slice(0, 60)} -> ${e.error!.message}`).join(" | ")}`);
  }
}

test("every example runs on a fresh database, and runs again", async () => {
  for (const example of ALL_EXAMPLES) {
    const db = await openSeeded(SHOP);
    const options = { continueOnError: example.continueOnError };
    check(example, await runScript(db, example.sql, options), "first run");
    check(example, await runScript(db, example.sql, options), "second run");
    await db.close();
  }
});

test("all examples run one after another on one database", async () => {
  const db = await openSeeded(SHOP);
  for (const example of ALL_EXAMPLES) {
    check(example, await runScript(db, example.sql, { continueOnError: example.continueOnError }), "in sequence");
  }
  await db.close();
});
