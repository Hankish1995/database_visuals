import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidElement, type ReactElement } from "react";
import { highlightSql } from "@/components/editor/highlightSql";
import { ALL_EXAMPLES } from "@/content/examples";
import { LABS } from "@/content/labs";
import { CHALLENGES } from "@/content/challenges";
import { splitSql } from "@/lib/db/splitSql";

const text = (sql: string) => highlightSql(sql).map((n) => (isValidElement(n) ? (n as ReactElement<{ children: string }>).props.children : "")).join("");

test("the editor's colouring reproduces every script exactly (so the overlay lines up)", () => {
  const scripts = [...ALL_EXAMPLES.map((e) => e.sql), ...Object.values(LABS).flatMap((l) => l.steps.map((s) => s.sql)), ...CHALLENGES.flatMap((c) => [c.solution, c.starter]), "select 'unterminated", "a$b $$x$$ -- c\n/* d */ e::int"];
  for (const sql of scripts) assert.equal(text(sql), sql);
});

test("splitSql keeps function bodies, strings and comments intact", () => {
  assert.deepEqual(splitSql("select ';'; create function f() returns int as $$ select 1; $$ language sql; -- tail;\n"), [
    "select ';'",
    "create function f() returns int as $$ select 1; $$ language sql",
  ]);
  assert.deepEqual(splitSql("do $body$ begin raise notice 'a;b'; end $body$;select 2"), ["do $body$ begin raise notice 'a;b'; end $body$", "select 2"]);
  assert.deepEqual(splitSql("-- only a comment;\n  "), []);
});
