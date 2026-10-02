import { TABLE, USER_COUNT } from "@/lib/sim/data";
import { simEn, type SimText } from "@/lib/sim/text/en";
import { USER_COLUMNS, type ParsedQuery, type RowValues, type UserColumn } from "@/lib/sim/types";

// The Query flow animation doesn't execute SQL. It recognises four small
// shapes on the users table and explains anything else instead:
//   SELECT * | col[, col...] FROM users WHERE id = n
//   INSERT INTO users (col, ...) VALUES (...)
//   UPDATE users SET col = 'value'[, ...] WHERE id = n
//   DELETE FROM users WHERE id = n

export { SUPPORTED_SQL } from "@/lib/sim/supported";
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

type Errors = SimText["errors"];

/** `t` phrases the validation errors (English by default). */
export function parseQuery(input: string, t: Errors = simEn.errors): ParseResult {
  const sql = input.trim().replace(/;\s*$/, "").replace(/\s+/g, " ");
  if (!sql) return fail(t.empty);
  if (splitTopLevel(sql, ";").length > 1) return fail(t.oneAtATime);
  if (/\breturning\b/i.test(sql)) return fail(t.returning);
  const verb = sql.split(" ")[0].toLowerCase();
  const raw = input.trim();
  if (verb === "select") return parseSelect(sql, raw, t);
  if (verb === "insert") return parseInsert(sql, raw, t);
  if (verb === "update") return parseUpdate(sql, raw, t);
  if (verb === "delete") return parseDelete(sql, raw, t);
  return fail(t.notAnimated(verb.toUpperCase()));
}

function tableError(table: string, t: Errors): ParseResult | null {
  return table.toLowerCase() === TABLE ? null : fail(t.noTable(table));
}

function whereId(rest: string, verb: string, t: Errors): number | ParseResult {
  const where = WHERE_ID.exec(rest.trim());
  if (!where) return fail(rest ? t.whereOnlyId : t.whereMissing(verb));
  const id = Number(where[1]);
  return Number.isSafeInteger(id) ? id : fail(t.idWhole);
}

function parseSelect(sql: string, raw: string, t: Errors): ParseResult {
  const shape = /^select (.+?) from ([a-z_][a-z0-9_]*)(?: (.*))?$/i.exec(sql);
  if (!shape) return fail(t.selectUnreadable);
  const [, list, table, rest = ""] = shape;
  const bad = tableError(table, t);
  if (bad) return bad;
  let names: UserColumn[] | null = null;
  if (list.trim() !== "*") {
    names = list.split(",").map((c) => c.trim().toLowerCase()) as UserColumn[];
    const unknown = names.find((n) => !(USER_COLUMNS as readonly string[]).includes(n));
    if (unknown !== undefined) return fail(t.unknownColumn(unknown));
  }
  const id = whereId(rest, "SELECT", t);
  if (typeof id !== "number") return id;
  return ok({ kind: "select", sql: raw, id, values: {}, columns: names ?? [...USER_COLUMNS], selectAll: names === null });
}

function parseInsert(sql: string, raw: string, t: Errors): ParseResult {
  const shape = /^insert into ([a-z_][a-z0-9_]*) ?(\((.*?)\))? ?values ?\((.*)\)$/i.exec(sql);
  if (!shape) return fail(t.insertUnreadable);
  const [, table, , colList, valueList] = shape;
  const bad = tableError(table, t);
  if (bad) return bad;
  if (!colList) return fail(t.listColumns);
  const cols = colList.split(",").map((c) => c.trim().toLowerCase());
  const vals = splitTopLevel(valueList, ",").map((v) => v.trim());
  if (cols.length !== vals.length) return fail(t.countMismatch(cols.length, vals.length));
  const values: RowValues = {};
  for (let i = 0; i < cols.length; i++) {
    const problem = assign(values, cols[i], vals[i], true, t);
    if (problem) return fail(problem);
  }
  if (!values.name || !values.email) return fail(t.notNull);
  return ok({ kind: "insert", sql: raw, id: values.id ?? null, values });
}

function parseUpdate(sql: string, raw: string, t: Errors): ParseResult {
  const shape = /^update ([a-z_][a-z0-9_]*) set (.+?)( where .*)?$/i.exec(sql);
  if (!shape) return fail(t.updateUnreadable);
  const [, table, setList, rest = ""] = shape;
  const bad = tableError(table, t);
  if (bad) return bad;
  const values: RowValues = {};
  for (const part of splitTopLevel(setList, ",")) {
    const m = /^\s*([a-z_]+) ?= ?(.+?)\s*$/i.exec(part);
    if (!m) return fail(t.setUnreadable(part.trim()));
    if (m[1].toLowerCase() === "id") return fail(t.pkUpdate);
    const problem = assign(values, m[1].toLowerCase(), m[2], false, t);
    if (problem) return fail(problem);
  }
  const id = whereId(rest, "UPDATE", t);
  if (typeof id !== "number") return id;
  return ok({ kind: "update", sql: raw, id, values });
}

function parseDelete(sql: string, raw: string, t: Errors): ParseResult {
  const shape = /^delete from ([a-z_][a-z0-9_]*)( where .*)?$/i.exec(sql);
  if (!shape) return fail(t.deleteUnreadable);
  const bad = tableError(shape[1], t);
  if (bad) return bad;
  const id = whereId(shape[2] ?? "", "DELETE", t);
  if (typeof id !== "number") return id;
  return ok({ kind: "delete", sql: raw, id, values: {} });
}

/** Parses one literal into `values[col]`; returns an error message, or null. */
function assign(values: RowValues, col: string, literal: string, allowId: boolean, t: Errors): string | null {
  if (!(USER_COLUMNS as readonly string[]).includes(col)) return t.unknownColumn(col);
  if (/^default$/i.test(literal)) return col === "id" || col === "created_at" ? null : t.noDefault(col);
  if (col === "id") {
    if (!allowId) return t.pkChange;
    if (!/^\d+$/.test(literal)) return t.idPositive;
    values.id = Number(literal);
    return null;
  }
  const str = /^'((?:[^']|'')*)'$/.exec(literal);
  if (!str) return t.quoted(col);
  const text = str[1].replace(/''/g, "'");
  if (col === "created_at" && !DATE.test(text)) return t.dateFormat;
  if (col !== "created_at" && !text.trim()) return t.blank(col);
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
