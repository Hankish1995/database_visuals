"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { EXAMPLE_GROUPS, type SqlExample } from "@/content/examples";

export function ExampleLibrary({ current, onPick }: { current: string | null; onPick: (e: SqlExample) => void }) {
  const [open, setOpen] = useState<string | null>(EXAMPLE_GROUPS[0].id);
  return (
    <div className="space-y-1">
      {EXAMPLE_GROUPS.map((group) => (
        <div key={group.id}>
          <button type="button" aria-expanded={open === group.id} onClick={() => setOpen(open === group.id ? null : group.id)}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-ink hover:bg-subtle">
            <span>{group.title} <span className="font-normal text-muted">({group.examples.length})</span></span>
            <ChevronRight aria-hidden className={`size-4 text-muted transition-transform ${open === group.id ? "rotate-90" : ""}`} />
          </button>
          {open === group.id && (
            <ul className="mb-1 space-y-0.5">
              {group.examples.map((ex) => (
                <li key={ex.id}>
                  <button type="button" onClick={() => onPick(ex)} aria-current={current === ex.id ? "true" : undefined}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-left ${current === ex.id ? "border-accent/50 bg-accent-soft" : "border-transparent hover:bg-subtle"}`}>
                    <span className="block text-sm text-ink">{ex.title}</span>
                    <span className="block text-xs text-muted">{ex.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
