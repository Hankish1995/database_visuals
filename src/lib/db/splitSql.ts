// Splits a script into statements on top-level semicolons, respecting
// 'strings', "identifiers", $tag$ dollar-quoted bodies$tag$, -- and /* */
// comments. Each statement is sent on its own, like psql does, so a
// procedure can COMMIT and every statement gets its own result.
export function splitSql(script: string): string[] {
  const out: string[] = [];
  let start = 0;
  let i = 0;
  const n = script.length;
  while (i < n) {
    const c = script[i];
    const next = script[i + 1];
    if (c === "-" && next === "-") {
      const end = script.indexOf("\n", i);
      i = end === -1 ? n : end + 1;
    } else if (c === "/" && next === "*") {
      const end = script.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
    } else if (c === "'" || c === '"') {
      i = skipQuoted(script, i, c);
    } else if (c === "$") {
      const tag = /^\$[A-Za-z_]*\$/.exec(script.slice(i))?.[0];
      if (tag) {
        const end = script.indexOf(tag, i + tag.length);
        i = end === -1 ? n : end + tag.length;
      } else i++;
    } else if (c === ";") {
      push(out, script.slice(start, i));
      start = ++i;
    } else i++;
  }
  push(out, script.slice(start));
  return out;
}

function skipQuoted(s: string, i: number, quote: string): number {
  let j = i + 1;
  while (j < s.length) {
    if (s[j] === quote) {
      if (s[j + 1] === quote) j += 2; // doubled quote escape
      else return j + 1;
    } else j++;
  }
  return s.length;
}

function push(out: string[], statement: string) {
  const trimmed = statement.trim();
  // Skip pieces that are only comments or whitespace.
  const meaningful = trimmed.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
  if (meaningful) out.push(trimmed);
}

/** The command tag for a statement: its leading keywords, e.g. "CREATE OR REPLACE FUNCTION" -> "CREATE FUNCTION". */
export function commandOf(statement: string): string {
  const words = statement.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").trim().split(/\s+/).map((w) => w.toUpperCase());
  const first = words[0] ?? "";
  if (first === "WITH") return "WITH";
  if (["CREATE", "DROP", "ALTER"].includes(first)) {
    const rest = words.slice(1).filter((w) => !["OR", "REPLACE", "UNIQUE", "TEMP", "TEMPORARY", "UNLOGGED", "MATERIALIZED", "CONSTRAINT", "EVENT", "IF", "NOT", "EXISTS"].includes(w));
    const materialized = words.includes("MATERIALIZED") ? "MATERIALIZED " : "";
    const event = words[1] === "EVENT" ? "EVENT " : "";
    return `${first} ${event}${materialized}${rest[0] ?? ""}`.replace(/\(.*$/, "").trim();
  }
  if (first === "REFRESH") return "REFRESH MATERIALIZED VIEW";
  if (first === "START") return "BEGIN";
  return first.replace(/\(.*$/, "");
}
