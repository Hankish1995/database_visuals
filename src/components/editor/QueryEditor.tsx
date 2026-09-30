"use client";

import Link from "next/link";
import { useRef, type FormEvent, type KeyboardEvent } from "react";
import { Braces, CircleAlert, Database, Play } from "lucide-react";
import { highlightSql } from "@/components/editor/highlightSql";
import { CRUD_EXAMPLES, formatSql, SUPPORTED_SQL } from "@/lib/sim/sql";
import type { Workspace } from "@/hooks/useWorkspace";

// One-line SQL editor: a textarea with a coloured overlay behind it.
// Enter runs the query; editing it resets the scene.
export function QueryEditor({ ws, className = "" }: { ws: Workspace; className?: string }) {
  const overlay = useRef<HTMLPreElement>(null);
  const submit = (e: FormEvent) => { e.preventDefault(); ws.run(); };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ws.run(); }
  };

  return (
    <section aria-label="SQL editor" className={`rounded-xl border border-line bg-surface p-2 shadow-card ${className}`}>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <label htmlFor="sql-input" className="hidden items-center gap-2 px-2 text-sm font-semibold text-ink sm:flex">
          <Database className="size-5 text-muted" aria-hidden /> SQL
        </label>
        <div role="group" aria-label="Try a statement" className="flex w-full shrink-0 flex-wrap items-center gap-1 sm:px-1 lg:order-first lg:w-auto">
          <span className="sr-only">Watch a</span>
          {CRUD_EXAMPLES.map((ex) => {
            const current = ws.sim.kind === ex.kind;
            return (
              <button key={ex.kind} type="button" onClick={() => ws.run(ex.sql)} aria-pressed={current} title={ex.sql}
                className={`rounded-md border px-2.5 py-1 font-mono text-xs font-semibold ${current ? "border-accent bg-accent-soft text-accent" : "border-line text-ink-soft hover:border-accent/50 hover:text-ink"}`}>
                {ex.label}
              </button>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-1 basis-full items-center rounded-lg border border-line bg-subtle focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 sm:basis-auto">
          <span aria-hidden className="border-r border-line px-3 font-mono text-sm text-muted">1</span>
          <div className="relative min-w-0 flex-1">
            <pre ref={overlay} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden px-3 py-2.5 font-mono text-[15px] leading-6 whitespace-pre">
              {highlightSql(ws.sql)}
            </pre>
            <textarea id="sql-input" rows={1} wrap="off" spellCheck={false} autoComplete="off" autoCapitalize="off"
              aria-label="SQL query" aria-describedby="sql-help" aria-invalid={Boolean(ws.error)} aria-errormessage={ws.error ? "sql-error" : undefined}
              value={ws.sql} onChange={(e) => ws.editSql(e.target.value)} onKeyDown={onKeyDown}
              onScroll={(e) => { if (overlay.current) overlay.current.scrollLeft = e.currentTarget.scrollLeft; }}
              className="relative block w-full resize-none overflow-x-auto overflow-y-hidden bg-transparent px-3 py-2.5 font-mono text-[15px] leading-6 whitespace-pre text-transparent caret-ink outline-none selection:bg-accent/20 [scrollbar-width:none]" />
          </div>
        </div>
        <button type="button" onClick={() => ws.setSql(formatSql(ws.sql))}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm font-medium text-ink-soft hover:border-line-strong hover:text-ink">
          <Braces className="size-4" aria-hidden /> Format
        </button>
        <button type="submit" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 sm:flex-none">
          <Play className="size-4 fill-current" aria-hidden /> Run query
        </button>
      </form>
      {ws.error ? (
        <p id="sql-error" role="alert" className="mt-2 flex items-start gap-1.5 px-2 text-sm text-miss">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {ws.error}{" "}
            <Link href={`/practice?sql=${encodeURIComponent(ws.sql)}`} className="font-semibold text-accent underline-offset-2 hover:underline">
              Run it for real in the SQL Lab →
            </Link>
          </span>
        </p>
      ) : (
        <p id="sql-help" className="mt-1.5 px-2 text-xs text-muted">Simulated subset: <code className="font-mono">{SUPPORTED_SQL}</code>. Press Enter to run.</p>
      )}
    </section>
  );
}
