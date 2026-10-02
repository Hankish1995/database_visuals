"use client";

import { ChevronDown } from "lucide-react";
import { useMessages } from "@/i18n";

// PostgreSQL is the only modeled engine. The others are listed, disabled,
// so the selector never implies the simulation can switch engines.
export function EngineSelect() {
  const m = useMessages();
  return (
    <label className="relative hidden items-center sm:flex">
      <span className="sr-only">{m.topbar.engineLabel}</span>
      <span aria-hidden className="pointer-events-none absolute left-3 size-2 rounded-full bg-accent" />
      <select
        defaultValue="postgresql"
        title={m.topbar.engineTitle}
        className="h-9 appearance-none rounded-lg border border-line bg-surface pl-7 pr-8 text-sm font-medium text-ink hover:border-line-strong"
      >
        <option value="postgresql">PostgreSQL</option>
        <option value="mysql" disabled>{m.topbar.notModeled("MySQL")}</option>
        <option value="sqlite" disabled>{m.topbar.notModeled("SQLite")}</option>
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 size-4 text-muted" />
    </label>
  );
}
