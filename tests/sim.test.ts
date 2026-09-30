import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSimulation } from "@/lib/sim/buildSimulation";
import { deriveScene } from "@/lib/sim/sceneState";
import { CRUD_EXAMPLES, formatSql, parseQuery } from "@/lib/sim/sql";
import type { SimOptions } from "@/lib/sim/types";

const sim = (sql: string, options: SimOptions = { useIndex: true, cache: "miss" }) => {
  const parsed = parseQuery(sql);
  assert.ok(parsed.ok, parsed.ok ? "" : parsed.error);
  return buildSimulation(parsed.query, options);
};
const ids = (s: ReturnType<typeof sim>) => s.steps.map((x) => x.id).join(" ");
const end = (s: ReturnType<typeof sim>) => deriveScene(s, s.steps.length - 1, "done");

test("each CRUD example parses to its kind", () => {
  for (const ex of CRUD_EXAMPLES) {
    const r = parseQuery(ex.sql);
    assert.ok(r.ok && r.query.kind === ex.kind, ex.sql);
  }
});

test("SELECT is unchanged: index lookup, cache miss, return", () => {
  const s = sim("SELECT * FROM users WHERE id = 42;");
  assert.equal(ids(s), "client parse plan execute index buffer disk return");
  assert.equal(s.commandTag, "SELECT 1");
  assert.equal(end(s).wal.length, 0);
});

test("INSERT writes the heap, then the index, then commits and flushes", () => {
  const s = sim(CRUD_EXAMPLES[1].sql);
  assert.equal(ids(s), "client parse plan execute space disk write index commit return");
  assert.equal(s.commandTag, "INSERT 0 1");
  assert.equal(s.change?.after?.id, 57);
  const scene = end(s);
  assert.deepEqual(scene.wal.map((w) => w.record), ["Heap INSERT", "Btree INSERT_LEAF", "Transaction COMMIT"]);
  assert.ok(scene.wal.every((w) => w.flushed));
  assert.deepEqual(scene.dirtyPages, [18]);
  // before the commit step, nothing is flushed yet
  const beforeCommit = deriveScene(s, s.steps.findIndex((x) => x.id === "commit") - 1, "paused");
  assert.ok(beforeCommit.wal.length === 2 && beforeCommit.wal.every((w) => !w.flushed));
});

test("INSERT with an existing id fails at the index and aborts", () => {
  const s = sim("INSERT INTO users (id, name, email) VALUES (42, 'X', 'x@example.com')", { useIndex: true, cache: "hit" });
  assert.equal(ids(s), "client parse plan execute space write index abort return");
  assert.equal(s.commandTag, "ERROR");
  assert.match(s.error!, /duplicate key/);
  const scene = end(s);
  assert.ok(scene.failed);
  assert.deepEqual(scene.wal.map((w) => w.record), ["Heap INSERT", "Transaction ABORT"]);
  assert.ok(scene.wal.every((w) => !w.flushed));
});

test("UPDATE writes a new version, commits; DELETE marks the row", () => {
  const u = sim(CRUD_EXAMPLES[2].sql, { useIndex: true, cache: "hit" });
  assert.equal(ids(u), "client parse plan execute index buffer write commit return");
  assert.equal(u.change?.after?.email, "bob@new.example");
  assert.deepEqual(u.newTuple, { page: 17, slot: 15 });
  assert.deepEqual(end(u).wal.map((w) => w.record), ["Heap HOT_UPDATE", "Transaction COMMIT"]);
  const d = sim(CRUD_EXAMPLES[3].sql, { useIndex: false, cache: "miss" });
  assert.equal(ids(d), "client parse plan execute buffer disk filter write commit return");
  assert.equal(d.commandTag, "DELETE 1");
  assert.equal(d.change?.after, null);
});

test("a write that matches nothing changes nothing and writes no WAL", () => {
  const s = sim("UPDATE users SET name = 'Z' WHERE id = 999");
  assert.equal(ids(s), "client parse plan execute index return");
  assert.equal(s.commandTag, "UPDATE 0");
  assert.equal(end(s).wal.length, 0);
});

test("the parser explains what it can't animate", () => {
  const err = (sql: string) => { const r = parseQuery(sql); return r.ok ? "" : r.error; };
  assert.match(err("DELETE FROM users"), /WHERE id/);
  assert.match(err("UPDATE users SET id = 3 WHERE id = 1"), /primary key/);
  assert.match(err("INSERT INTO users (name) VALUES ('x')"), /NOT NULL/);
  assert.match(err("INSERT INTO users (name, email) VALUES ('x')"), /2 column/);
  assert.match(err("INSERT INTO users VALUES (1, 'x', 'y')"), /List the columns/);
  assert.match(err("TRUNCATE users"), /isn't animated/);
  assert.equal(formatSql("insert into users (name,email) values ('select me','a@b')"), "INSERT INTO users (name, email) VALUES ('select me', 'a@b');");
});
