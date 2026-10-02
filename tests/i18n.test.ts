import { test } from "node:test";
import assert from "node:assert/strict";
import { CHALLENGES } from "@/content/challenges";
import { CONCEPTS } from "@/content/concepts";
import { EXAMPLE_GROUPS } from "@/content/examples";
import { HI } from "@/content/hi";
import { LABS } from "@/content/labs";
import { LESSON_SECTIONS } from "@/content/lessons";
import { contentFor } from "@/content/localized";
import { PLAN_NODE_INFO } from "@/content/planNodes";
import { PLAN_SAMPLES } from "@/content/planSamples";
import { VECTOR_CONCEPTS } from "@/content/vectorConcepts";
import { MESSAGES } from "@/i18n";
import { HNSW_TEXT } from "@/lib/hnsw/text";
import { buildSimulation } from "@/lib/sim/buildSimulation";
import { CRUD_EXAMPLES, parseQuery } from "@/lib/sim/sql";
import { SIM_TEXT } from "@/lib/sim/text";
import type { ParsedQuery } from "@/lib/sim/types";

const DEVANAGARI = /[ऀ-ॿ]/;
const missing = (ids: string[], have: Record<string, unknown>) => ids.filter((id) => !(id in have));

test("every lesson, concept, lab step, example, challenge and plan text has Hindi", () => {
  assert.deepEqual(missing(LESSON_SECTIONS.map((s) => s.id), HI.sections), []);
  assert.deepEqual(missing(LESSON_SECTIONS.flatMap((s) => s.lessons.map((l) => l.id)), HI.lessons), []);
  assert.deepEqual(missing(Object.keys(CONCEPTS), HI.concepts), []);
  assert.deepEqual(missing(Object.keys(VECTOR_CONCEPTS), HI.vectorConcepts), []);
  for (const [id, lab] of Object.entries(LABS)) {
    assert.ok(HI.labs[id], `lab ${id}`);
    assert.deepEqual(missing(lab.steps.map((s) => s.id), HI.labs[id].steps), [], `lab ${id} steps`);
  }
  assert.deepEqual(missing(EXAMPLE_GROUPS.map((g) => g.id), HI.exampleGroups), []);
  assert.deepEqual(missing(EXAMPLE_GROUPS.flatMap((g) => g.examples.map((e) => e.id)), HI.examples), []);
  for (const c of CHALLENGES) assert.equal(HI.challenges[c.id]?.hints.length, c.hints.length, `challenge ${c.id} hints`);
  assert.deepEqual(missing(Object.keys(PLAN_NODE_INFO), HI.planNodes), []);
  assert.deepEqual(missing(PLAN_SAMPLES.map((s) => s.id), HI.planSamples), []);
});

test("Hindi content keeps the English SQL and structure", () => {
  const en = contentFor("en"), hi = contentFor("hi");
  assert.equal(hi.lesson("hnsw").title, "HNSW वेक्टर सर्च");
  assert.equal(hi.labs.acid.steps[0].sql, en.labs.acid.steps[0].sql);
  assert.equal(hi.example("joins")!.sql, en.example("joins")!.sql);
  assert.deepEqual(hi.challenges.map((c) => c.id), en.challenges.map((c) => c.id));
  assert.match(hi.concepts.bufferPool.definition, DEVANAGARI);
});

test("interface messages exist in both languages", () => {
  const walk = (en: unknown, hi: unknown, path: string) => {
    if (typeof en === "object" && en) for (const k of Object.keys(en)) walk((en as never)[k], (hi as never)[k], `${path}.${k}`);
    else assert.equal(typeof hi, typeof en, path);
  };
  walk(MESSAGES.en, MESSAGES.hi, "messages");
  assert.match(MESSAGES.hi.editor.run, DEVANAGARI);
});

test("the simulation narrates every step in Hindi without changing the steps", () => {
  for (const ex of CRUD_EXAMPLES) {
    const q = (parseQuery(ex.sql) as { ok: true; query: ParsedQuery }).query;
    for (const options of [{ useIndex: true, cache: "miss" }, { useIndex: false, cache: "hit" }] as const) {
      const en = buildSimulation(q, options, SIM_TEXT.en), hi = buildSimulation(q, options, SIM_TEXT.hi);
      assert.deepEqual(hi.steps.map((s) => s.id), en.steps.map((s) => s.id));
      assert.equal(hi.commandTag, en.commandTag);
      for (const s of hi.steps) for (const f of [s.title, s.what, s.why, s.notice]) assert.match(f, DEVANAGARI, `${ex.kind} ${s.id}`);
    }
  }
  const bad = parseQuery("DELETE FROM users", SIM_TEXT.hi.errors);
  assert.ok(!bad.ok && DEVANAGARI.test(bad.error));
  assert.match(HNSW_TEXT.hi.describe(null, 8, 5), DEVANAGARI);
});
