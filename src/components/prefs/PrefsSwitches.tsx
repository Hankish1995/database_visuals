"use client";

import { Languages, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useMessages } from "@/i18n";
import { setLocale, setTheme, useLocale, useTheme, type Locale, type Theme } from "@/lib/prefs";

interface Choice<T extends string> { value: T; label: string; short: ReactNode; lang?: string }

// A two-option radio group. The chosen option is marked by a raised, ringed
// chip and aria-checked -- never by colour alone. On phones each option
// shows a short form (an icon, or EN/हि) with the full name for screen readers.
function Choices<T extends string>({ label, icon, value, options, onChange }: {
  label: string; icon: ReactNode; value: T; options: Choice<T>[]; onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center gap-1 rounded-lg border border-line bg-subtle p-0.5">
      <span aria-hidden className="hidden pl-1 text-muted lg:inline">{icon}</span>
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={checked} lang={o.lang} onClick={() => onChange(o.value)}
            className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium ${checked ? "bg-surface text-accent shadow-sm ring-1 ring-accent/40" : "text-muted hover:text-ink"}`}>
            <span aria-hidden className="xl:hidden">{o.short}</span>
            <span className="sr-only xl:not-sr-only">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PrefsSwitches() {
  const m = useMessages();
  const theme = useTheme();
  const locale = useLocale();
  return (
    <div className="flex items-center gap-2">
      <Choices<Theme> label={m.prefs.theme} icon={<Sun className="size-3.5" />} value={theme} onChange={setTheme}
        options={[
          { value: "light", label: m.prefs.light, short: <Sun className="size-4" /> },
          { value: "dark", label: m.prefs.dark, short: <Moon className="size-4" /> },
        ]} />
      <Choices<Locale> label={m.prefs.language} icon={<Languages className="size-3.5" />} value={locale} onChange={setLocale}
        options={[
          { value: "en", label: "English", short: "EN", lang: "en" },
          { value: "hi", label: "हिन्दी", short: "हि", lang: "hi" },
        ]} />
    </div>
  );
}
