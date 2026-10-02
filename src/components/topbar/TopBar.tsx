"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNetwork, Database, Terminal, Trophy } from "lucide-react";
import { EngineSelect } from "@/components/topbar/EngineSelect";
import { HelpPopover } from "@/components/topbar/HelpPopover";
import { SettingsPopover } from "@/components/topbar/SettingsPopover";
import { PrefsSwitches } from "@/components/prefs/PrefsSwitches";
import { useMessages } from "@/i18n";
import type { Settings } from "@/hooks/useWorkspace";

const NAV = [
  { href: "/", key: "learn", icon: BookOpen },
  { href: "/practice", key: "practice", icon: Terminal },
  { href: "/visualize", key: "visualize", icon: ChartNetwork },
  { href: "/challenges", key: "challenges", icon: Trophy },
] as const;

interface Props { settings?: Settings; onSettingsChange?: (s: Settings) => void }

export function TopBar({ settings, onSettingsChange }: Props) {
  const path = usePathname();
  const m = useMessages();
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface px-4 py-2 lg:h-16 lg:flex-nowrap lg:px-5 lg:py-0">
      <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-flow-bright to-accent text-white shadow-sm">
          <Database className="size-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-extrabold uppercase tracking-wide text-ink">
            {m.topbar.brandStart} <span className="text-accent">{m.topbar.brandEnd}</span>
          </span>
          <span className="hidden truncate text-xs text-muted sm:block">{m.topbar.tagline}</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2 lg:order-last">
        <PrefsSwitches />
        <EngineSelect />
        <HelpPopover />
        {settings && onSettingsChange && <SettingsPopover settings={settings} onChange={onSettingsChange} />}
      </div>

      <nav aria-label={m.topbar.mainNav} className="order-last -mx-1 flex w-full gap-1 overflow-x-auto lg:order-none lg:mx-0 lg:ml-4 lg:w-auto">
        {NAV.map(({ href, key, icon: Icon }) => {
          const current = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={current ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${current ? "bg-accent-soft font-semibold text-accent" : "text-ink-soft hover:bg-subtle hover:text-ink"}`}>
              <Icon className="size-4" aria-hidden />
              {m.topbar[key]}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
