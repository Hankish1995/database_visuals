import { INDEX, TABLE } from "@/lib/sim/data";
import type { ParsedQuery, SimOptions, SimStep, UserRow } from "@/lib/sim/types";

const VERB = { select: "SELECT", insert: "INSERT", update: "UPDATE", delete: "DELETE" } as const;

function treeText(q: ParsedQuery): string {
  const set = Object.entries(q.values).map(([k, v]) => `${k} = ${typeof v === "string" ? `'${v}'` : v}`).join(", ");
  switch (q.kind) {
    case "select": return `SELECT ${q.selectAll ? "all columns" : q.columns.join(", ")} FROM ${TABLE} WHERE id = ${q.id}`;
    case "insert": return `INSERT INTO ${TABLE} (${Object.keys(q.values).join(", ")}) with one row of values`;
    case "update": return `UPDATE ${TABLE} SET ${set} WHERE id = ${q.id}`;
    case "delete": return `DELETE FROM ${TABLE} WHERE id = ${q.id}`;
  }
}

/** Client -> parser -> planner -> executor: the same shape for every statement. */
export function commonSteps(query: ParsedQuery, options: SimOptions, plan: string[]): SimStep[] {
  const verb = VERB[query.kind];
  const write = query.kind !== "select";
  const lookup = options.useIndex
    ? `For one id on a primary key, an index scan using ${INDEX} is far cheaper than reading the whole table.`
    : `${INDEX} is off for lookups in this run, so finding id = ${query.id} means reading every page of ${TABLE}.`;
  return [
    {
      id: "client", component: "client",
      title: `Client sends the ${verb}`,
      what: "The application sends the SQL text to the database server over its connection.",
      why: write ? "Every change goes through the server, which enforces constraints, logging and concurrency for all clients." : "The server does all of the planning and data access; the client only sends text and waits for rows.",
      notice: "The query marker leaves the client and heads for the parser.",
    },
    {
      id: "parse", component: "parser", edge: "client-parser",
      title: "Parser builds a syntax tree",
      what: `The text is split into tokens and checked against SQL grammar, giving a tree: ${treeText(query)}. Names like "${TABLE}" are then resolved against the catalog.`,
      why: "Later stages work on a structured tree, not raw text. Syntax errors stop here, before any data is touched.",
      notice: "The parser lights up. Open it in the inspector to see the tree.",
    },
    {
      id: "plan", component: "planner", edge: "parser-planner",
      title: query.kind === "insert" ? "Planner makes an insert plan" : options.useIndex ? "Planner picks an index scan" : "Planner falls back to a table scan",
      what: query.kind === "insert"
        ? `An INSERT with VALUES has nothing to search for, so the plan is simple: build one row and hand it to "${plan[0]}".`
        : write ? `${verb} first has to find the row, just like a SELECT. ${lookup}` : `The planner estimates the cost of candidate plans. ${lookup}`,
      why: "Choosing how to reach data up front avoids unnecessary page reads, which are the expensive part.",
      notice: `The chosen plan is "${plan.map((l) => l.trim()).join(" ")}".`,
    },
    {
      id: "execute", component: "executor", edge: "planner-executor",
      title: "Executor runs the plan",
      what: query.kind === "insert"
        ? `The executor builds the new tuple: ${query.id === null ? "id comes from the users_id_seq sequence" : `id is ${query.id}, as given`}${query.values.created_at ? "" : ", and created_at gets its default (today)"}.`
        : "The executor carries out the plan node by node and asks the storage layer for the pages it needs.",
      why: write ? "Writes happen in pages in memory first; the executor also has to keep every index on the table up to date." : "The plan says how; the executor does the work, pulling rows one at a time as they are needed.",
      notice: query.kind === "insert" ? "Next, it looks for a page with room for the row." : options.useIndex ? "Next, the marker heads to the B-tree index." : "Next, the marker heads straight to the table's pages.",
    },
  ];
}

export function returnStep(query: ParsedQuery, rows: UserRow[], source: string | null): SimStep {
  const found = rows.length > 0;
  return {
    id: "return", component: "row", edge: "buffer-client",
    title: found ? "Return the row to the client" : "Return zero rows",
    what: found
      ? `The executor reads the tuple from ${source}, checks this row version is visible to the query (MVCC), keeps ${query.selectAll ? "all columns" : query.columns.join(", ")}, and sends it to the client.`
      : `No row has id = ${query.id}. The client receives an empty result, which is not an error.`,
    why: found ? "Only the requested row leaves the server; the rest of the page stays cached for later queries." : "An empty result is a normal answer for a filter that matches nothing.",
    notice: found ? "The result appears below the scene. The run is complete." : "The result table is empty. The run is complete.",
  };
}
