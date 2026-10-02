import type { ReactNode } from "react";

const WORDS = "select|from|where|and|or|not|null|is|in|as|on|join|left|right|inner|outer|cross|lateral|group|having|order|by|limit|offset|distinct|union|intersect|except|all|with|recursive|insert|into|values|update|set|delete|returning|merge|using|when|matched|then|else|end|case|create|replace|alter|drop|table|view|materialized|index|unique|primary|key|references|check|default|constraint|function|procedure|returns|language|trigger|before|after|instead|of|for|each|row|statement|execute|begin|commit|rollback|savepoint|declare|if|elsif|loop|raise|notice|exception|return|call|do|explain|analyze|vacuum|grant|policy|exists|between|like|ilike|asc|desc|nulls|first|last|over|partition|window|filter|refresh|sequence|type|domain|enum|listen|notify|prepare|deallocate|fetch|cursor|close|show|reset|isolation|level|read|repeatable|serializable|checkpoint";
const TOKEN = new RegExp(`(--[^\\n]*|\\s+|\\b(?:${WORDS})\\b|\\$[A-Za-z_]*\\$|\\d+(?:\\.\\d+)?|'[^']*'?|[*,;=()<>:+\\-/|]|[^\\s*,;=()<>:+\\-/|']+)`, "gi");
const KEYWORD = new RegExp(`^(${WORDS})$`, "i");

/** Syntax colouring for the editor's overlay. Purely visual; the textarea holds the text. */
export function highlightSql(sql: string): ReactNode[] {
  return (sql.match(TOKEN) ?? []).map((tok, i) => {
    const cls = tok.startsWith("--") ? "text-muted italic"
      : tok.startsWith("$") && tok.endsWith("$") ? "text-index"
      : KEYWORD.test(tok) ? "font-semibold text-accent"
      : /^\d+$/.test(tok) ? "text-number"
      : tok.startsWith("'") ? "text-ok"
      : /^[*,;=()]$/.test(tok) ? "text-ink-soft"
      : "text-ink";
    return <span key={i} className={cls}>{tok}</span>;
  });
}
