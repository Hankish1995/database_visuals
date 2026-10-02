"use client";

import { useRef, type KeyboardEvent } from "react";
import { highlightSql } from "@/components/editor/highlightSql";
import { useMessages } from "@/i18n";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  className?: string;
}

const TEXT = "px-3 py-2.5 font-mono text-[13px] leading-6 whitespace-pre";

// A multi-line SQL editor: a real textarea (so typing, selection, undo and
// screen readers work normally) over a coloured copy of its text.
// Ctrl/⌘ + Enter runs.
export function SqlEditor({ id, label, value, onChange, onRun, className = "" }: Props) {
  const runHelp = useMessages().sql.runHelp;
  const overlay = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lines = value.split("\n").length;

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onRun(); }
  };

  return (
    <div className={`flex min-h-0 overflow-hidden rounded-lg border border-line bg-subtle focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${className}`}>
      <div ref={gutter} aria-hidden className="shrink-0 overflow-hidden border-r border-line py-2.5 text-right font-mono text-[13px] leading-6 text-muted select-none">
        {Array.from({ length: lines }, (_, i) => <div key={i} className="px-2.5">{i + 1}</div>)}
      </div>
      <div className="relative min-w-0 flex-1">
        <pre ref={overlay} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${TEXT}`}>
          {highlightSql(value)}
          {"\n"}
        </pre>
        <textarea id={id} aria-label={label} aria-describedby={`${id}-help`} value={value} spellCheck={false} autoComplete="off" autoCapitalize="off" wrap="off"
          onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown}
          onScroll={(e) => {
            const { scrollTop, scrollLeft } = e.currentTarget;
            if (overlay.current) { overlay.current.scrollTop = scrollTop; overlay.current.scrollLeft = scrollLeft; }
            if (gutter.current) gutter.current.scrollTop = scrollTop;
          }}
          className={`absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent text-transparent caret-ink outline-none selection:bg-accent/25 ${TEXT}`} />
      </div>
      <p id={`${id}-help`} className="sr-only">{runHelp}</p>
    </div>
  );
}
