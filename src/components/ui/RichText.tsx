import { Fragment } from "react";

// Renders message text where `backticked` parts are code (identifiers,
// setting names, SQL): they stay untranslated and are shown in monospace.
export function RichText({ text }: { text: string }) {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 ? <code key={i} className="font-mono text-[0.95em]">{part}</code> : <Fragment key={i}>{part}</Fragment>);
}
