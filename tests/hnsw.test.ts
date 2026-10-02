import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGraph, EF_MAX, EF_MIN, GRAPH, K, QUERIES } from "@/lib/hnsw/dataset";
import { deriveFrame } from "@/lib/hnsw/frame";
import { HNSW_TEXT } from "@/lib/hnsw/text";
const describe = HNSW_TEXT.en.describe;
import { exactSearch, hnswSearch, recall } from "@/lib/hnsw/search";

const query = (label: string) => QUERIES.find((q) => q.label === label)!;
const run = (label: string, ef: number) => hnswSearch(GRAPH, query(label), ef, K);
const recallAt = (label: string, ef: number) => recall(run(label, ef).results, exactSearch(GRAPH, query(label), K));

test("the dataset and graph are deterministic", () => {
  assert.deepEqual(buildGraph(), GRAPH);
  assert.deepEqual(run("Query A", 9), run("Query A", 9));
});

test("the graph is layered: every upper-layer vector is also on every layer below", () => {
  const sizes = GRAPH.neighbors.map((layer) => Object.keys(layer).length);
  assert.equal(sizes[0], GRAPH.nodes.length);
  for (let l = 1; l < sizes.length; l++) assert.ok(sizes[l] < sizes[l - 1], `layer ${l} is smaller than the one below`);
  for (let l = 1; l < GRAPH.neighbors.length; l++) {
    for (const id of Object.keys(GRAPH.neighbors[l])) assert.ok(id in GRAPH.neighbors[l - 1]);
  }
  const top = GRAPH.nodes.find((n) => n.id === GRAPH.entryPoint)!;
  assert.equal(top.level, GRAPH.topLayer);
});

test("layer 0 is connected, so every vector is reachable", () => {
  const seen = new Set([GRAPH.entryPoint]);
  const queue = [GRAPH.entryPoint];
  while (queue.length) for (const n of GRAPH.neighbors[0][queue.shift()!]) if (!seen.has(n)) { seen.add(n); queue.push(n); }
  assert.equal(seen.size, GRAPH.nodes.length);
});

test("exact search returns the true k nearest, nearest first", () => {
  for (const q of QUERIES) {
    const exact = exactSearch(GRAPH, q, K);
    assert.equal(exact.length, K);
    for (let i = 1; i < K; i++) assert.ok(exact[i - 1].distance <= exact[i].distance);
  }
});

test("a larger ef_search explores more of the graph (never less)", () => {
  for (const q of QUERIES) {
    let previous = 0;
    for (let ef = EF_MIN; ef <= EF_MAX; ef++) {
      const r = hnswSearch(GRAPH, q, ef, K);
      assert.equal(r.results.length, K);
      assert.ok(r.visited >= previous, `${q.label} ef=${ef}`);
      previous = r.visited;
    }
  }
});

test("ef_search changes the answer: Query A misses neighbors at 5 and finds them all at 6", () => {
  assert.equal(recallAt("Query A", 5), 0.2);
  assert.equal(recallAt("Query A", 6), 1);
  assert.ok(run("Query A", 6).visited > run("Query A", 5).visited);
  assert.notDeepEqual(run("Query A", 5).results, run("Query A", 6).results);
});

test("a bigger list is no guarantee: Query B still misses a closer vector at 24, and needs 32", () => {
  assert.equal(recallAt("Query B", 24), 0.8);
  assert.equal(recallAt("Query B", EF_MAX), 1);
  assert.equal(recallAt("Query C", 7), 0.8);
  assert.equal(recallAt("Query C", 8), 1);
});

test("the animation frame is a pure function of the trace", () => {
  const r = run("Query A", 8);
  const start = deriveFrame(GRAPH, r, 0);
  assert.equal(start.event?.kind, "enter");
  assert.deepEqual([...start.layers[GRAPH.topLayer].kept], [GRAPH.entryPoint]);
  const end = deriveFrame(GRAPH, r, r.trace.length - 1);
  assert.ok(end.done);
  for (const n of r.results) assert.ok(end.layers[0].kept.has(n.id), `${n.id} is a final candidate`);
  assert.ok(end.layers[0].kept.size <= Math.max(8, K));
  assert.deepEqual(deriveFrame(GRAPH, r, 10_000), end); // clamped
  assert.match(describe(null, 8, K), /Run search/);
  for (const e of r.trace) assert.ok(describe(e, 8, K).length > 10);
});
