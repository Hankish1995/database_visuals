import { TABLE, USER_COUNT } from "@/lib/sim/data";
import { USER_COLUMNS, type ParsedQuery, type RowValues, type UserColumn } from "@/lib/sim/types";

// The Query flow animation doesn't execute SQL. It recognises four small
// shapes on the users table and explains anything else instead:
//   SELECT * | col[, col...] FROM users WHERE id = n
//   INSERT INTO users (col, ...) VALUES (...)
//   UPDATE users SET col = 'value'[, ...] WHERE id = n
//   DELETE FROM users WHERE id = n

export const SUPPORTED_SQL = "SELECT … / UPDATE … / DELETE … WHERE id = <number>, or INSERT INTO users (name, email) VALUES (…)";
export const DEFAULT_SQL = "SELECT * FROM users WHERE id = 42;";

export const CRUD_EXAMPLES = [
  { kind: "select", label: "SELECT", sql: "SELECT * FROM users WHERE id = 42;" },
  { kind: "insert", label: "INSERT", sql: "INSERT INTO users (name, email) VALUES ('Dana', 'dana@example.com');" },
  { kind: "update", label: "UPDATE", sql: "UPDATE users SET email = 'bob@new.example' WHERE id = 42;" },
  { kind: "delete", label: "DELETE", sql: "DELETE FROM users WHERE id = 42;" },
] as const;

export type ParseResult = { ok: true; query: ParsedQuery } | { ok: false; error: string };

const fail = (error: string): ParseResult => ({ ok: false, error });
const ok = (query: Omit<ParsedQuery, "columns" | "selectAll"> & Partial<ParsedQuery>): ParseResult =>
  ({ ok: true, query: { columns: [...USER_COLUMNS], selectAll: true, ...query } });
const WHERE_ID = /^where id ?= ?(-?\d+)$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseQuery(input: string): ParseResult {
  const sql = input.trim().replace(/;\s*$/, "").replace(/\s+/g, " ");
  if (!sql) return fail("Type a statement to run, for example: SELECT * FROM users WHERE id = 42;");
  if (splitTopLevel(sql, ";").length > 1) return fail("Run one statement at a time.");
  if (/\breturning\b/i.test(sql)) return fail("RETURNING isn't part of this animation.");
  const verb = sql.split(" ")[0].toLowerCase();
  const raw = input.trim();
  if (verb === "select") return parseSelect(sql, raw);
  if (verb === "insert") return parseInsert(sql, raw);
  if (verb === "update") return parseUpdate(sql, raw);
  if (verb === "delete") return parseDelete(sql, raw);
  return fail(`${verb.toUpperCase()} isn't animated here. Supported: ${SUPPORTED_SQL}.`);
}

function tableError(table: string): ParseResult | null {
  return table.toLowerCase() === TABLE ? null : fail(`There is no table "${table}" in this model. Only "users" exists.`);
}

function whereId(rest: string, verb: string): number | ParseResult {
  const where = WHERE_ID.exec(rest.trim());
  if (!where) return fail(rest ? "Only a WHERE id = <number> filter is animated." : `Add a filter: WHERE id = <number>. ${verb} without one would touch every row.`);
  const id = Number(where[1]);
  return Number.isSafeInteger(id) ? id : fail("The id must be a whole number.");
}

function parseSelect(sql: string, raw: string): ParseResult {
  const shape = /^select (.+?) from ([a-z_][a-z0-9_]*)(?: (.*))?$/i.exec(sql);
  if (!shape) return fail(`Couldn't read that query. Supported: ${SUPPORTED_SQL}.`);
  const [, list, table, rest = ""] = shape;
  const bad = tableError(table);
  if (bad) return bad;
  let names: UserColumn[] | null = null;
  if (list.trim() !== "*") {
    names = list.split(",").map((c) => c.trim().toLowerCase()) as UserColumn[];
    const unknown = names.find((n) => !(USER_COLUMNS as readonly string[]).includes(n));
    if (unknown !== undefined) return fail(`users has no column "${unknown || "(empty)"}". Columns: ${USER_COLUMNS.join(", ")}.`);
  }
  const id = whereId(rest, "SELECT");
  if (typeof id !== "number") return id;
  return ok({ kind: "select", sql: raw, id, values: {}, columns: names ?? [...USER_COLUMNS], selectAll: names === null });
}

function parseInsert(sql: string, raw: string): ParseResult {
  const shape = /^insert into ([a-z_][a-z0-9_]*) ?(\((.*?)\))? ?values ?\((.*)\)$/i.exec(sql);
  if (!shape) return fail("Couldn't read that INSERT. Try: INSERT INTO users (name, email) VALUES ('Dana', 'dana@example.com');");
  const [, table, , colList, valueList] = shape;
  const bad = tableError(table);
  if (bad) return bad;
  if (!colList) return fail("List the columns: INSERT INTO users (name, email) VALUES (…).");
  const cols = colList.split(",").map((c) => c.trim().toLowerCase());
  const vals = splitTopLevel(valueList, ",").map((v) => v.trim());
  if (cols.length !== vals.length) return fail(`${cols.length} column(s) but ${vals.length} value(s).`);
  const values: RowValues = {};
  for (let i = 0; i < cols.length; i++) {
    const problem = assign(values, cols[i], vals[i], true);
    if (problem) return fail(problem);
  }
  if (!values.name || !values.email) return fail("name and email are NOT NULL: give both.");
  return ok({ kind: "insert", sql: raw, id: values.id ?? null, values });
}

function parseUpdate(sql: string, raw: string): ParseResult {
  const shape = /^update ([a-z_][a-z0-9_]*) set (.+?)( where .*)?$/i.exec(sql);
  if (!shape) return fail("Couldn't read that UPDATE. Try: UPDATE users SET email = 'bob@new.example' WHERE id = 42;");
  const [, table, setList, rest = ""] = shape;
  const bad = tableError(table);
  if (bad) return bad;
  const values: RowValues = {};
  for (const part of splitTopLevel(setList, ",")) {
    const m = /^\s*([a-z_]+) ?= ?(.+?)\s*$/i.exec(part);
    if (!m) return fail(`Couldn't read "${part.trim()}". Write column = 'value'.`);
    if (m[1].toLowerCase() === "id") return fail("Changing the primary key isn't animated; update name, email or created_at.");
    const problem = assign(values, m[1].toLowerCase(), m[2], false);
    if (problem) return fail(problem);
  }
  const id = whereId(rest, "UPDATE");
  if (typeof id !== "number") return id;
  return ok({ kind: "update", sql: raw, id, values });
}

function parseDelete(sql: string, raw: string): ParseResult {
  const shape = /^delete from ([a-z_][a-z0-9_]*)( where .*)?$/i.exec(sql);
  if (!shape) return fail("Couldn't read that DELETE. Try: DELETE FROM users WHERE id = 42;");
  const bad = tableError(shape[1]);
  if (bad) return bad;
  const id = whereId(shape[2] ?? "", "DELETE");
  if (typeof id !== "number") return id;
  return ok({ kind: "delete", sql: raw, id, values: {} });
}

/** Parses one literal into `values[col]`; returns an error message, or null. */
function assign(values: RowValues, col: string, literal: string, allowId: boolean): string | null {
  if (!(USER_COLUMNS as readonly string[]).includes(col)) return `users has no column "${col}". Columns: ${USER_COLUMNS.join(", ")}.`;
  if (/^default$/i.test(literal)) return col === "id" || col === "created_at" ? null : `${col} has no default.`;
  if (col === "id") {
    if (!allowId) return "Changing the primary key isn't animated.";
    if (!/^\d+$/.test(literal)) return "id must be a positive whole number.";
    values.id = Number(literal);
    return null;
  }
  const str = /^'((?:[^']|'')*)'$/.exec(literal);
  if (!str) return `${col} needs a quoted text value, like '…'.`;
  const text = str[1].replace(/''/g, "'");
  if (col === "created_at" && !DATE.test(text)) return "created_at must look like '2025-06-30'.";
  if (col !== "created_at" && !text.trim()) return `${col} can't be empty.`;
  values[col as "name" | "email" | "created_at"] = text;
  return null;
}

/** Splits on `sep` outside single-quoted strings and parentheses. */
function splitTopLevel(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0, quoted = false, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'") quoted = !quoted;
    else if (!quoted && c === "(") depth++;
    else if (!quoted && c === ")") depth--;
    else if (!quoted && depth === 0 && c === sep) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts.filter((p) => p.trim() !== "" || sep !== ";");
}

export const KNOWN_ID_RANGE = `1-${USER_COUNT}`;

const KEYWORDS = /\b(select|from|where|and|or|insert|into|values|update|set|delete|default)\b/gi;

/** Uppercases keywords (outside string literals) and normalises spacing. */
export function formatSql(input: string): string {
  const compact = input.trim().replace(/\s*;$/, "");
  if (!compact) return "";
  const pieces = compact.split(/('(?:[^']|'')*')/);
  const formatted = pieces.map((p, i) => (i % 2 ? p : p.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").replace(/\s*=\s*/g, " = ").replace(/\(\s*/g, "(").replace(/\s*\)/g, ")").replace(KEYWORDS, (k) => k.toUpperCase())));
  return `${formatted.join("")};`;
}
